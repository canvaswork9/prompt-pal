import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { estimated1RM } from '@/lib/decision-engine';
import { toast } from 'sonner';

const todayStr = () => new Date().toISOString().slice(0, 10);

export interface WorkingSet {
  id?: string;
  set_number: number;
  weight_kg: number;
  reps: number;
  rpe: number;
  is_warmup: boolean;
  saved: boolean;
}

export interface ExerciseLog {
  exercise_key: string;
  exercise_name: string;
  sets: WorkingSet[];
}

export function useWorkout(targetDate?: string) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [checkinId, setCheckinId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exerciseLogs, setExerciseLogs] = useState<Map<string, WorkingSet[]>>(new Map());
  // Real start time from DB — so elapsed is accurate even after leaving and returning
  const [sessionStartFromDB, setSessionStartFromDB] = useState<number | null>(null);
  const dateToUse = targetDate || todayStr();

  // Load or create today's workout session
  useEffect(() => {
    async function init() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }

        const { data: checkin } = await supabase
          .from('daily_checkins')
          .select('id, readiness_score, status, training_split')
          .eq('user_id', user.id)
          .eq('date', dateToUse)
          .maybeSingle();

        if (checkin) setCheckinId(checkin.id);

        // Fetch session for target date
        const { data: session } = await supabase
          .from('workout_sessions')
          .select('id, created_at, duration_min, completed')
          .eq('user_id', user.id)
          .eq('date', dateToUse)
          .maybeSingle();

        // Auto-complete any stale incomplete sessions from previous days
        // This prevents old sessions from polluting the Dashboard
        const { error: staleError } = await supabase
          .from('workout_sessions')
          .update({ completed: true })
          .eq('user_id', user.id)
          .eq('completed', false)
          .lt('date', todayStr());
        if (staleError) console.error('Failed to clean up stale sessions:', staleError);

        if (session) {
          setSessionId(session.id);

          // Restore sessionStart from DB created_at so elapsed time is accurate
          // even if user left and came back
          const createdAt = new Date(session.created_at).getTime();
          setSessionStartFromDB(createdAt);

          const { data: sets } = await supabase
            .from('exercise_sets')
            .select('*')
            .eq('session_id', session.id)
            .order('set_number');

          if (sets && sets.length > 0) {
            const map = new Map<string, WorkingSet[]>();
            sets.forEach(s => {
              const key = s.exercise_key;
              const existing = map.get(key) || [];
              existing.push({
                id: s.id,
                set_number: s.set_number,
                weight_kg: Number(s.weight_kg) || 0,
                reps: s.reps || 0,
                rpe: s.rpe || 0,
                is_warmup: s.is_warmup || false,
                saved: true,
              });
              map.set(key, existing);
            });
            setExerciseLogs(map);
          }
        }
        setLoading(false);
      } catch (err) {
        console.error('Failed to initialize workout session:', err);
        setLoading(false);
      }
    }
    init();
  }, [dateToUse]);

  const createCardioSession = useCallback(async (
    cardioType: string,
    durationMin: number,
    distanceKm: number | null,
    avgHr: number | null,
    zoneTarget: string,
    zoneAchieved: string,
    avgInclinePct: number | null = null,
  ): Promise<boolean> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data: checkin } = await supabase
      .from('daily_checkins')
      .select('id, readiness_score')
      .eq('user_id', user.id)
      .eq('date', dateToUse)
      .maybeSingle();

    const { error } = await supabase.from('workout_sessions').insert({
      user_id: user.id,
      date: dateToUse,
      session_type: 'cardio',
      cardio_type: cardioType,
      duration_min: durationMin,
      distance_km: distanceKm,
      avg_hr: avgHr,
      zone_target: zoneTarget,
      zone_achieved: zoneAchieved,
      avg_incline_pct: avgInclinePct,
      checkin_id: checkin?.id || null,
      readiness_score: checkin?.readiness_score || null,
      completed: true,
    });

    if (error) { toast.error('Failed to save cardio session'); return false; }
    toast.success('Cardio session saved! 🏃');
    return true;
  }, [dateToUse]);

  const ensureSession = useCallback(async (): Promise<string | null> => {
    if (sessionId) return sessionId;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: checkin } = await supabase
      .from('daily_checkins')
      .select('id, readiness_score, training_split')
      .eq('user_id', user.id)
      .eq('date', dateToUse)
      .maybeSingle();

    const { data: newSession, error } = await supabase
      .from('workout_sessions')
      .insert({
        user_id: user.id,
        date: dateToUse,
        checkin_id: checkin?.id || null,
        readiness_score: checkin?.readiness_score || null,
        split: checkin?.training_split || null,
      })
      .select('id')
      .single();

    if (error) {
      toast.error('Failed to create session');
      return null;
    }
    setSessionId(newSession.id);
    return newSession.id;
  }, [sessionId]);

  const saveSet = useCallback(async (
    exerciseKey: string,
    exerciseName: string,
    set: WorkingSet
  ) => {
    setSaving(true);
    try {
      const sid = await ensureSession();
      if (!sid) throw new Error('No session');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not logged in');

      const row = {
        session_id: sid,
        exercise_key: exerciseKey,
        exercise_name: exerciseName,
        set_number: set.set_number,
        weight_kg: set.weight_kg,
        reps: set.reps,
        rpe: set.rpe,
        is_warmup: set.is_warmup,
      };

      let savedId = set.id;
      if (set.id) {
        const { error } = await supabase.from('exercise_sets').update(row).eq('id', set.id);
        if (error) throw error;
      } else {
        const { data: inserted, error } = await supabase.from('exercise_sets').insert(row).select('id').single();
        if (error) throw error;
        savedId = inserted.id;
      }

      setExerciseLogs(prev => {
        const next = new Map(prev);
        const sets = [...(next.get(exerciseKey) || [])];
        const idx = sets.findIndex(s => s.set_number === set.set_number);
        const updatedSet = { ...set, id: savedId, saved: true };
        if (idx >= 0) sets[idx] = updatedSet;
        else sets.push(updatedSet);
        next.set(exerciseKey, sets);
        return next;
      });

      await checkAndUpdatePR(user.id, exerciseKey, set.weight_kg, set.reps, sid);

      toast.success(`Set ${set.set_number} saved`);
      return true;
    } catch (err: any) {
      toast.error(err.message || 'Failed to save set');
      return false;
    } finally {
      setSaving(false);
    }
  }, [ensureSession]);

  const checkAndUpdatePR = async (
    userId: string,
    exerciseKey: string,
    weight: number,
    reps: number,
    sid: string
  ) => {
    const newE1RM = estimated1RM(weight, reps);
    if (newE1RM <= 0) return;

    const { data: existingPR } = await supabase
      .from('personal_records')
      .select('id, estimated_1rm')
      .eq('user_id', userId)
      .eq('exercise_key', exerciseKey)
      .order('estimated_1rm', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!existingPR || newE1RM > Number(existingPR.estimated_1rm || 0)) {
      const { error: prError } = await supabase.from('personal_records').insert({
        user_id: userId,
        exercise_key: exerciseKey,
        weight_kg: weight,
        reps: reps,
        estimated_1rm: newE1RM,
        session_id: sid,
        achieved_at: todayStr(),
      });
      if (prError) { console.error('Failed to save PR:', prError); }
      else { toast.success(`🏆 New PR! Est. 1RM: ${newE1RM} kg`, { duration: 4000 }); }
    }
  };

  const autoSaveDuration = useCallback(async (durationMin: number) => {
    // Update duration on existing session without marking completed
    // This lets Dashboard show elapsed time even if user never taps Finish
    const sid = sessionId;
    if (!sid) return;
    const { error: durError } = await supabase
      .from('workout_sessions')
      .update({ duration_min: durationMin })
      .eq('id', sid);
    if (durError) console.error('Failed to save duration:', durError);
  }, [sessionId]);

  const finishSession = useCallback(async (durationMin?: number) => {
    if (!sessionId) return;
    const { error } = await supabase
      .from('workout_sessions')
      .update({ completed: true, duration_min: durationMin || null })
      .eq('id', sessionId);
    if (error) toast.error('Failed to finish session');
    else toast.success('Session complete! 💪');
  }, [sessionId]);

  const getSetsForExercise = useCallback((key: string): WorkingSet[] => {
    return exerciseLogs.get(key) || [];
  }, [exerciseLogs]);

  return {
    loading,
    saving,
    sessionId,
    sessionStartFromDB,
    exerciseLogs,
    saveSet,
    autoSaveDuration,
    finishSession,
    getSetsForExercise,
    createCardioSession,
    dateToUse,
  };
}

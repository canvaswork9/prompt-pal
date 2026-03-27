import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { calculateReadiness } from '@/lib/decision-engine';
import type { CheckinData, ReadinessResult } from '@/lib/types';
import { toast } from 'sonner';

function todayStr() { return new Date().toISOString().slice(0, 10); }

export function useCheckin() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [existingId, setExistingId] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [baselineHR, setBaselineHR] = useState<number>(60);import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { calculateReadiness } from '@/lib/decision-engine';
import type { CheckinData, ReadinessResult } from '@/lib/types';
import { toast } from 'sonner';

function todayStr() { return new Date().toISOString().slice(0, 10); }

export function useCheckin() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [existingId, setExistingId] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [baselineHR, setBaselineHR] = useState<number>(60);
  const [displayName, setDisplayName] = useState('');
  // Track today's date — if user leaves app open past midnight, currentDate changes
  // and the load effect re-runs automatically
  const [currentDate, setCurrentDate] = useState(todayStr);
  const [data, setData] = useState<CheckinData>({
    sleep_hours: 7,
    sleep_quality: 'ok',
    resting_hr: 62,
    hrv_ms: null,
    yesterday_training: 'none',
    muscle_soreness: 'none',
    nutrition_load: 'maintenance',
  });

  // Load today's checkin if it exists
  // Reset submitted state and reload if calendar day changes (e.g. app open past midnight)
  useEffect(() => {
    const interval = setInterval(() => {
      const newDate = todayStr();
      if (newDate !== currentDate) {
        setCurrentDate(newDate);
        setSubmitted(false);
        setExistingId(null);
      }
    }, 60_000); // check every minute
    return () => clearInterval(interval);
  }, [currentDate]);

  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }

        const yesterdayDate = new Date();
        yesterdayDate.setDate(yesterdayDate.getDate() - 1);
        const yesterdayStr = yesterdayDate.toISOString().slice(0, 10);

        const [{ data: checkin }, { data: profile }, { data: yesterday }] = await Promise.all([
          supabase.from('daily_checkins').select('*').eq('user_id', user.id).eq('date', todayStr()).maybeSingle(),
          supabase.from('user_profiles').select('baseline_hr, display_name').eq('id', user.id).maybeSingle(),
          supabase.from('daily_checkins').select('training_split, status, resting_hr, nutrition_load').eq('user_id', user.id).eq('date', yesterdayStr).maybeSingle(),
        ]);

        if (profile?.baseline_hr) setBaselineHR(profile.baseline_hr);
        if (profile?.display_name) setDisplayName(profile.display_name);

        if (checkin) {
          // Today's checkin already exists — restore it
          setData({
            sleep_hours: Number(checkin.sleep_hours),
            sleep_quality: (checkin.sleep_quality as CheckinData['sleep_quality']) || 'ok',
            resting_hr: checkin.resting_hr ?? 62,
            hrv_ms: (checkin as any).hrv_ms ?? null,
            yesterday_training: (checkin.yesterday_training as CheckinData['yesterday_training']) || 'none',
            muscle_soreness: (checkin.muscle_soreness as CheckinData['muscle_soreness']) || 'none',
            nutrition_load: (checkin.nutrition_load as CheckinData['nutrition_load']) || 'maintenance',
          });
          setExistingId(checkin.id);
          if (checkin.readiness_score) setSubmitted(true);
        } else if (yesterday) {
          // Smart defaults from yesterday's data
          // yesterday_training = what they actually did yesterday (from training_split)
          const splitToTraining = (split: string): CheckinData['yesterday_training'] => {
            if (!split) return 'none';
            const s = split.toLowerCase();
            if (s.includes('upper')) return 'upper';
            if (s.includes('lower')) return 'lower';
            if (s.includes('full') || s.includes('light')) return 'full';
            if (s.includes('cardio') || s.includes('recovery')) return 'cardio';
            return 'none';
          };
          setData(prev => ({
            ...prev,
            yesterday_training: splitToTraining(yesterday.training_split || ''),
            resting_hr: yesterday.resting_hr ?? prev.resting_hr,
            nutrition_load: (yesterday.nutrition_load as CheckinData['nutrition_load']) || prev.nutrition_load,
          }));
        }
        setLoading(false);
      } catch (err) {
        console.error('Failed to load checkin:', err);
        setLoading(false);
      }
    }
    load();
  }, [currentDate]);

  const result: ReadinessResult = calculateReadiness(data, baselineHR);

  const save = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not logged in');

      const row = {
        user_id: user.id,
        date: todayStr(),
        sleep_hours: data.sleep_hours,
        sleep_quality: data.sleep_quality,
        resting_hr: data.resting_hr,
        hrv_ms: data.hrv_ms ?? null,
        yesterday_training: data.yesterday_training,
        muscle_soreness: data.muscle_soreness,
        nutrition_load: data.nutrition_load,
        readiness_score: result.score,
        status: result.status,
        decision: result.decision,
        training_split: result.training_split,
        cardio_zone: result.cardio_zone,
        coach_message: result.coach_message,
        score_breakdown: result.score_breakdown as any,
      };

      if (existingId) {
        const { error } = await supabase.from('daily_checkins').update(row).eq('id', existingId);
        if (error) throw error;
      } else {
        const { data: inserted, error } = await supabase.from('daily_checkins').insert(row).select('id').single();
        if (error) throw error;
        setExistingId(inserted.id);
      }

      setSubmitted(true);
      toast.success('Check-in saved!');
      return true;
    } catch (err: any) {
      toast.error(err.message || 'Failed to save');
      return false;
    } finally {
      setSaving(false);
    }
  };

  return { data, setData, result, submitted, setSubmitted, loading, saving, save, existingId, displayName };
}
  const [displayName, setDisplayName] = useState('');
  // Track today's date — if user leaves app open past midnight, currentDate changes
  // and the load effect re-runs automatically
  const [currentDate, setCurrentDate] = useState(todayStr);
  const [data, setData] = useState<CheckinData>({
    sleep_hours: 7,
    sleep_quality: 'ok',
    resting_hr: 62,
    yesterday_training: 'none',
    muscle_soreness: 'none',
    nutrition_load: 'maintenance',
  });

  // Load today's checkin if it exists
  // Reset submitted state and reload if calendar day changes (e.g. app open past midnight)
  useEffect(() => {
    const interval = setInterval(() => {
      const newDate = todayStr();
      if (newDate !== currentDate) {
        setCurrentDate(newDate);
        setSubmitted(false);
        setExistingId(null);
      }
    }, 60_000); // check every minute
    return () => clearInterval(interval);
  }, [currentDate]);

  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }

        const yesterdayDate = new Date();
        yesterdayDate.setDate(yesterdayDate.getDate() - 1);
        const yesterdayStr = yesterdayDate.toISOString().slice(0, 10);

        const [{ data: checkin }, { data: profile }, { data: yesterday }] = await Promise.all([
          supabase.from('daily_checkins').select('*').eq('user_id', user.id).eq('date', todayStr()).maybeSingle(),
          supabase.from('user_profiles').select('baseline_hr, display_name').eq('id', user.id).maybeSingle(),
          supabase.from('daily_checkins').select('training_split, status, resting_hr, nutrition_load').eq('user_id', user.id).eq('date', yesterdayStr).maybeSingle(),
        ]);

        if (profile?.baseline_hr) setBaselineHR(profile.baseline_hr);
        if (profile?.display_name) setDisplayName(profile.display_name);

        if (checkin) {
          // Today's checkin already exists — restore it
          setData({
            sleep_hours: Number(checkin.sleep_hours),
            sleep_quality: (checkin.sleep_quality as CheckinData['sleep_quality']) || 'ok',
            resting_hr: checkin.resting_hr ?? 62,
            yesterday_training: (checkin.yesterday_training as CheckinData['yesterday_training']) || 'none',
            muscle_soreness: (checkin.muscle_soreness as CheckinData['muscle_soreness']) || 'none',
            nutrition_load: (checkin.nutrition_load as CheckinData['nutrition_load']) || 'maintenance',
          });
          setExistingId(checkin.id);
          if (checkin.readiness_score) setSubmitted(true);
        } else if (yesterday) {
          // Smart defaults from yesterday's data
          // yesterday_training = what they actually did yesterday (from training_split)
          const splitToTraining = (split: string): CheckinData['yesterday_training'] => {
            if (!split) return 'none';
            const s = split.toLowerCase();
            if (s.includes('upper')) return 'upper';
            if (s.includes('lower')) return 'lower';
            if (s.includes('full') || s.includes('light')) return 'full';
            if (s.includes('cardio') || s.includes('recovery')) return 'cardio';
            return 'none';
          };
          setData(prev => ({
            ...prev,
            yesterday_training: splitToTraining(yesterday.training_split || ''),
            resting_hr: yesterday.resting_hr ?? prev.resting_hr,
            nutrition_load: (yesterday.nutrition_load as CheckinData['nutrition_load']) || prev.nutrition_load,
          }));
        }
        setLoading(false);
      } catch (err) {
        console.error('Failed to load checkin:', err);
        setLoading(false);
      }
    }
    load();
  }, [currentDate]);

  const result: ReadinessResult = calculateReadiness(data, baselineHR);

  const save = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not logged in');

      const row = {
        user_id: user.id,
        date: todayStr(),
        sleep_hours: data.sleep_hours,
        sleep_quality: data.sleep_quality,
        resting_hr: data.resting_hr,
        yesterday_training: data.yesterday_training,
        muscle_soreness: data.muscle_soreness,
        nutrition_load: data.nutrition_load,
        readiness_score: result.score,
        status: result.status,
        decision: result.decision,
        training_split: result.training_split,
        cardio_zone: result.cardio_zone,
        coach_message: result.coach_message,
        score_breakdown: result.score_breakdown as any,
      };

      if (existingId) {
        const { error } = await supabase.from('daily_checkins').update(row).eq('id', existingId);
        if (error) throw error;
      } else {
        const { data: inserted, error } = await supabase.from('daily_checkins').insert(row).select('id').single();
        if (error) throw error;
        setExistingId(inserted.id);
      }

      setSubmitted(true);
      toast.success('Check-in saved!');
      return true;
    } catch (err: any) {
      toast.error(err.message || 'Failed to save');
      return false;
    } finally {
      setSaving(false);
    }
  };

  return { data, setData, result, submitted, setSubmitted, loading, saving, save, existingId, displayName };
}

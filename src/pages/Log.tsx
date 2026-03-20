import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { estimated1RM } from '@/lib/decision-engine';
import { useWorkout, type WorkingSet } from '@/hooks/useWorkout';
import { useNavigate } from 'react-router-dom';
import { selectExercises, EXERCISE_DB } from '@/lib/exercise-db';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/lib/i18n';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import DisabledFeaturePlaceholder from '@/components/DisabledFeaturePlaceholder';
import SkeletonLoader from '@/components/SkeletonLoader';
import RestTimer from '@/components/RestTimer';

const todayStr = () => new Date().toISOString().slice(0, 10);

const LogPage = () => {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const logEnabled = useFeatureFlag('progressive_overload');
  const { loading, saving, saveSet, autoSaveDuration, finishSession, getSetsForExercise, sessionStartFromDB } = useWorkout();
  const [exercises, setExercises] = useState<{ key: string; name: string; type: string; green_sets?: string; yellow_sets?: string; muscles?: string }[]>([]);
  const [checkinStatus, setCheckinStatus] = useState<string>('Yellow');
  const [currentEx, setCurrentEx] = useState(0);
  const [localSets, setLocalSets] = useState<WorkingSet[]>([]);
  // Use DB created_at if available (returning user), otherwise fallback to mount time
  const [sessionStart] = useState(() => Date.now());
  const effectiveStart = sessionStartFromDB ?? sessionStart;
  const [restTimer, setRestTimer] = useState<{ active: boolean; seconds: number }>({ active: false, seconds: 0 });
  const [lastWeights, setLastWeights] = useState<Record<string, number>>({});

  useEffect(() => {
    async function loadExercises() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const [{ data: checkin }, { data: profile }] = await Promise.all([
          supabase.from('daily_checkins').select('*').eq('user_id', user.id).eq('date', todayStr()).maybeSingle(),
          supabase.from('user_profiles').select('experience').eq('id', user.id).maybeSingle(),
        ]);

        let exList: { key: string; name_en: string; name_th: string; type: string }[] = [];

        if (checkin?.training_split) {
          exList = selectExercises(
            checkin.training_split,
            (checkin.status as any) || 'Yellow',
            (profile?.experience as any) || 'intermediate',
            (checkin.muscle_soreness as any) || 'none'
          );
          setCheckinStatus(checkin.status || 'Yellow');
          setExercises(exList.map(e => ({
            key: e.key,
            name: lang === 'th' ? e.name_th : e.name_en,
            type: e.type,
            green_sets: (e as any).green_sets,
            yellow_sets: (e as any).yellow_sets,
            muscles: (e as any).muscles,
          })));
        } else {
          exList = [
            { key: 'squat_barbell', name_en: 'Barbell Back Squat', name_th: 'Barbell Back Squat', type: 'compound' },
            { key: 'rdl', name_en: 'Romanian Deadlift', name_th: 'Romanian Deadlift', type: 'compound' },
            { key: 'leg_press', name_en: 'Leg Press', name_th: 'Leg Press', type: 'compound' },
          ];
          setExercises(exList.map(e => ({ key: e.key, name: e.name_en, type: e.type })));
        }

        const exKeys = exList.map(e => e.key);
        if (exKeys.length > 0) {
          const { data: prs } = await supabase
            .from('personal_records')
            .select('exercise_key, weight_kg')
            .eq('user_id', user.id)
            .in('exercise_key', exKeys);

          if (prs && prs.length > 0) {
            const weightMap: Record<string, number> = {};
            prs.forEach(pr => {
              if (pr.exercise_key && pr.weight_kg) {
                weightMap[pr.exercise_key] = Number(pr.weight_kg);
              }
            });
            setLastWeights(weightMap);
          }
        }
      } catch (err) {
        console.error('Failed to load exercises:', err);
      }
    }
    loadExercises();
  }, [lang]);

  useEffect(() => {
    if (exercises.length === 0) return;
    const saved = getSetsForExercise(exercises[currentEx].key);
    if (saved.length > 0) {
      setLocalSets(saved);
    } else {
      const lastWeight = lastWeights[exercises[currentEx].key] || 0;
      setLocalSets([
        { set_number: 1, weight_kg: lastWeight, reps: 0, rpe: 0, is_warmup: false, saved: false },
      ]);
    }
  }, [currentEx, exercises, getSetsForExercise, lastWeights]);

  const addSet = () => {
    const last = localSets[localSets.length - 1];
    setLocalSets([...localSets, {
      set_number: localSets.length + 1,
      weight_kg: last?.weight_kg || 0,
      reps: 0,
      rpe: 0,
      is_warmup: false,
      saved: false,
    }]);
  };

  const updateSet = (i: number, field: keyof WorkingSet, value: number | boolean) => {
    setLocalSets(localSets.map((s, j) => j === i ? { ...s, [field]: value, saved: false } : s));
  };

  const handleSaveSet = async (i: number) => {
    const set = localSets[i];
    if (!exercises[currentEx]) return;
    const ok = await saveSet(exercises[currentEx].key, exercises[currentEx].name, set);
    if (ok) {
      setLocalSets(prev => prev.map((s, j) => j === i ? { ...s, saved: true } : s));
      const exType = exercises[currentEx].type;
      const restSeconds = exType === 'compound' ? 120 : 60;
      setRestTimer({ active: true, seconds: restSeconds });
    }
  };

  // Auto-save duration every 60s — uses real DB start time so elapsed is accurate
  useEffect(() => {
    if (exercises.length === 0) return;
    const interval = setInterval(() => {
      const elapsed = Math.round((Date.now() - effectiveStart) / 60000);
      if (elapsed > 0) autoSaveDuration(elapsed);
    }, 60000);
    return () => clearInterval(interval);
  }, [exercises, effectiveStart, autoSaveDuration]);

  const handleFinish = async () => {
    const durationMin = Math.round((Date.now() - effectiveStart) / 60000);
    await finishSession(durationMin);
    navigate('/progress');
  };

  if (!logEnabled) return <DisabledFeaturePlaceholder name="Progressive Overload Log" />;
  if (loading) return <SkeletonLoader />;

  if (exercises.length === 0) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center space-y-4">
        <h1 className="text-display text-2xl">No Workout Plan</h1>
        <p className="text-muted-foreground">Complete your check-in first.</p>
        <Button variant="accent" onClick={() => navigate('/app')}>Go to Check-in</Button>
      </div>
    );
  }

  const workingSets = localSets.filter(s => !s.is_warmup && s.weight_kg > 0 && s.reps > 0);
  const bestSet = workingSets.length > 0
    ? workingSets.reduce((a, b) => estimated1RM(a.weight_kg, a.reps) > estimated1RM(b.weight_kg, b.reps) ? a : b)
    : null;
  const best1RM = bestSet ? estimated1RM(bestSet.weight_kg, bestSet.reps) : 0;

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-display text-2xl">Session Log</h1>
        <p className="text-sm text-muted-foreground">Today · {exercises.length} exercises</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {exercises.map((ex, i) => (
          <Button key={ex.key} variant={i === currentEx ? 'default' : 'outline'} size="sm" onClick={() => setCurrentEx(i)} className="whitespace-nowrap">
            {i + 1}. {ex.name}
          </Button>
        ))}
      </div>

      <motion.div key={currentEx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-xl p-4 sm:p-5 card-shadow space-y-4">
        {/* Header: progress + plan info */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-mono">Exercise {currentEx + 1} of {exercises.length}</span>
            <div className="flex gap-1">
              {exercises.map((_, idx) => (
                <div key={idx} className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  idx < currentEx ? 'bg-status-green' : idx === currentEx ? 'bg-primary' : 'bg-secondary'
                }`} />
              ))}
            </div>
          </div>
          <h2 className="font-semibold text-lg">{exercises[currentEx].name}</h2>
          <div className="flex flex-wrap gap-1.5">
            {exercises[currentEx].muscles && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                {exercises[currentEx].muscles}
              </span>
            )}
            {(exercises[currentEx].green_sets || exercises[currentEx].yellow_sets) && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-mono">
                Target: {checkinStatus === 'Green' ? exercises[currentEx].green_sets : exercises[currentEx].yellow_sets}
              </span>
            )}
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
              Rest: {exercises[currentEx].type === 'compound' ? '2 min' : '90s'}
            </span>
          </div>
        </div>

        {restTimer.active && (
          <RestTimer seconds={restTimer.seconds} onDone={() => setRestTimer({ active: false, seconds: 0 })} />
        )}

        {/* Card-based set layout (mobile-friendly) */}
        <div className="space-y-2">
          {localSets.map((s, i) => (
            <div key={i} className={`rounded-xl border p-3 transition-all ${
              s.saved
                ? 'border-accent/30 bg-accent/5'
                : 'border-border bg-secondary/20'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono font-medium text-muted-foreground">
                  {s.is_warmup ? 'Warm-up' : `Set ${s.set_number}`}
                </span>
                {s.saved ? (
                  <span className="text-accent text-xs font-bold tracking-wide">✓ SAVED</span>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-3 text-xs font-semibold text-accent hover:bg-accent/10"
                    onClick={() => handleSaveSet(i)}
                    disabled={saving || s.weight_kg <= 0 || s.reps <= 0}
                  >
                    Save set
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wide block text-center">kg</label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={s.weight_kg || ''}
                    onChange={e => updateSet(i, 'weight_kg', +e.target.value)}
                    className="h-11 text-center font-mono text-base bg-card"
                    placeholder="0"
                    step={0.5}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wide block text-center">Reps</label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={s.reps || ''}
                    onChange={e => updateSet(i, 'reps', +e.target.value)}
                    className="h-11 text-center font-mono text-base bg-card"
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wide block text-center">RPE</label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={s.rpe || ''}
                    onChange={e => updateSet(i, 'rpe', +e.target.value)}
                    className="h-11 text-center font-mono text-base bg-card"
                    placeholder="1–10"
                    min={1}
                    max={10}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <Button variant="outline" size="sm" onClick={addSet}>+ Add Set</Button>

        {bestSet && (
          <div className="bg-secondary/50 border border-border rounded-xl p-3 space-y-1 text-sm">
            <div className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Best set</div>
            <div className="flex items-center justify-between">
              <span className="font-mono font-semibold">{bestSet.weight_kg} kg × {bestSet.reps}</span>
              <div className="text-right">
                <span className="text-xs text-muted-foreground">Est. 1RM </span>
                <span className="font-mono font-bold text-accent">~{best1RM} kg</span>
              </div>
            </div>
          </div>
        )}

        {lastWeights[exercises[currentEx]?.key] > 0 && !bestSet && (
          <div className="text-xs text-muted-foreground bg-secondary rounded-lg px-3 py-2">
            📊 Last PR: <span className="font-mono font-medium">{lastWeights[exercises[currentEx].key]} kg</span> — pre-filled above
          </div>
        )}
      </motion.div>

      <div className="flex gap-3">
        <Button variant="outline" disabled={currentEx === 0} onClick={() => setCurrentEx(c => c - 1)} className="flex-1">← Previous</Button>
        {currentEx < exercises.length - 1 ? (
          <Button variant="accent" onClick={() => setCurrentEx(c => c + 1)} className="flex-1">Next Exercise →</Button>
        ) : (
          <Button variant="accent" onClick={handleFinish} className="flex-1">✓ Finish Session</Button>
        )}
      </div>
    </div>
  );
};

export default LogPage;

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
import { toast } from 'sonner';

const todayStr = () => new Date().toISOString().slice(0, 10);

const CARDIO_TYPES = [
  { value: 'run',        label: '🏃 Run',        incline: true  },
  { value: 'bike',       label: '🚴 Bike',       incline: true  },
  { value: 'swim',       label: '🏊 Swim',       incline: false },
  { value: 'row',        label: '🚣 Row',        incline: false },
  { value: 'elliptical', label: '⚙️ Elliptical', incline: true  },
  { value: 'walk',       label: '🚶 Walk',       incline: true  },
  { value: 'hiit',       label: '⚡ HIIT',       incline: false },
  { value: 'other',      label: '🏋️ Other',      incline: false },
];

const LogPage = () => {
  const [selectedDate, setSelectedDate]   = useState(todayStr());
  const [activeTab, setActiveTab]         = useState<'strength' | 'cardio'>('strength');

  // Cardio form state
  const [cardioType, setCardioType]               = useState('run');
  const [cardioDuration, setCardioDuration]       = useState('');
  const [cardioDistance, setCardioDistance]       = useState('');
  const [cardioAvgHr, setCardioAvgHr]             = useState('');
  const [cardioIncline, setCardioIncline]         = useState('');
  const [cardioZoneAchieved, setCardioZoneAchieved] = useState('Zone 2');
  const [cardioSaving, setCardioSaving]           = useState(false);
  const [cardioSaved, setCardioSaved]             = useState(false);

  const { lang } = useLanguage();
  const navigate = useNavigate();
  const logEnabled = useFeatureFlag('progressive_overload');
  const {
    loading, saving, saveSet, autoSaveDuration, finishSession,
    getSetsForExercise, sessionStartFromDB, dateToUse, createCardioSession,
  } = useWorkout(selectedDate);

  const [exercises, setExercises]       = useState<{ key: string; name: string; type: string; green_sets?: string; yellow_sets?: string; muscles?: string }[]>([]);
  const [checkinStatus, setCheckinStatus] = useState<string>('Yellow');
  const [currentEx, setCurrentEx]       = useState(0);
  const [localSets, setLocalSets]       = useState<WorkingSet[]>([]);
  const [sessionStart]                  = useState(() => Date.now());
  const effectiveStart                  = sessionStartFromDB ?? sessionStart;
  const [restTimer, setRestTimer]       = useState<{ active: boolean; seconds: number }>({ active: false, seconds: 0 });
  const [lastWeights, setLastWeights]   = useState<Record<string, number>>({});
  const [prRmMap, setPrRmMap]           = useState<Record<string, number>>({});
  const [readinessScore, setReadinessScore] = useState<number>(70);
  const [overloadSuggestion, setOverloadSuggestion] = useState<Record<string, { ready: boolean; suggestion: string }>>({});

  // Incline applies to current cardio type
  const cardioTypeData  = CARDIO_TYPES.find(ct => ct.value === cardioType);
  const showIncline     = cardioTypeData?.incline ?? false;

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
            { key: 'rdl',           name_en: 'Romanian Deadlift',  name_th: 'Romanian Deadlift',  type: 'compound' },
            { key: 'leg_press',     name_en: 'Leg Press',          name_th: 'Leg Press',          type: 'compound' },
          ];
          setExercises(exList.map(e => ({ key: e.key, name: e.name_en, type: e.type })));
        }

        const exKeys = exList.map(e => e.key);
        if (exKeys.length > 0) {
          const threeWeeksAgo = new Date();
          threeWeeksAgo.setDate(threeWeeksAgo.getDate() - 21);

          const { data: prs } = await supabase
            .from('personal_records')
            .select('exercise_key, weight_kg, estimated_1rm, achieved_at')
            .eq('user_id', user.id)
            .in('exercise_key', exKeys)
            .order('achieved_at', { ascending: false });

          if (prs && prs.length > 0) {
            const weightMap: Record<string, number> = {};
            const rmMap: Record<string, number>     = {};
            prs.forEach(pr => {
              if (pr.exercise_key && pr.weight_kg && !weightMap[pr.exercise_key])
                weightMap[pr.exercise_key] = Number(pr.weight_kg);
              if (pr.exercise_key && pr.estimated_1rm &&
                  (!rmMap[pr.exercise_key] || Number(pr.estimated_1rm) > rmMap[pr.exercise_key]))
                rmMap[pr.exercise_key] = Number(pr.estimated_1rm);
            });
            setLastWeights(weightMap);
            setPrRmMap(rmMap);

            const recentPRs  = prs.filter(pr => pr.achieved_at && new Date(pr.achieved_at) >= threeWeeksAgo);
            const countByEx: Record<string, number> = {};
            recentPRs.forEach(pr => { countByEx[pr.exercise_key] = (countByEx[pr.exercise_key] || 0) + 1; });

            const suggestions: Record<string, { ready: boolean; suggestion: string }> = {};
            exKeys.forEach(key => {
              const count     = countByEx[key] || 0;
              const curWeight = weightMap[key]  || 0;
              if (count >= 3 && curWeight > 0) {
                const next = Math.round((curWeight + 2.5) / 2.5) * 2.5;
                suggestions[key] = { ready: true,  suggestion: `Ready to progress → try ${next}kg (+2.5kg)` };
              } else if (count >= 2) {
                suggestions[key] = { ready: false, suggestion: `${count}/3 consistent sessions — almost ready to increase` };
              }
            });
            setOverloadSuggestion(suggestions);
          }
        }

        if (checkin?.readiness_score) setReadinessScore(checkin.readiness_score);
      } catch (err) {
        console.error('Failed to load exercises:', err);
      }
    }
    loadExercises();
  }, [lang]);

  const intensityFromSets = (setsStr: string): number => {
    if (!setsStr || setsStr === 'Skip') return 0.65;
    const match = setsStr.match(/(\d+)(?:–|-)(\d+)/);
    if (match) {
      const mid = (parseInt(match[1]) + parseInt(match[2])) / 2;
      if (mid <= 4)  return 0.90;
      if (mid <= 6)  return 0.85;
      if (mid <= 8)  return 0.78;
      if (mid <= 10) return 0.72;
      if (mid <= 12) return 0.67;
      if (mid <= 15) return 0.62;
      return 0.55;
    }
    return 0.65;
  };

  const readinessModifier = (s: number): number =>
    s >= 90 ? 1.02 : s >= 70 ? 1.00 : s >= 55 ? 0.85 : s >= 45 ? 0.75 : 0.60;

  const getAdaptiveWeight = (exKey: string, setsStr?: string): number | null => {
    const rm = prRmMap[exKey];
    if (!rm || rm <= 0) return null;
    const sets = setsStr || (checkinStatus === 'Green'
      ? exercises[currentEx]?.green_sets
      : exercises[currentEx]?.yellow_sets) || '';
    const raw = rm * intensityFromSets(sets) * readinessModifier(readinessScore);
    return Math.round(raw / 2.5) * 2.5;
  };

  useEffect(() => {
    if (exercises.length === 0) return;
    const saved = getSetsForExercise(exercises[currentEx].key);
    if (saved.length > 0) {
      setLocalSets(saved);
    } else {
      const todaySets = checkinStatus === 'Green'
        ? exercises[currentEx]?.green_sets
        : exercises[currentEx]?.yellow_sets;
      const adaptive = getAdaptiveWeight(exercises[currentEx].key, todaySets);
      const prefill  = adaptive ?? lastWeights[exercises[currentEx].key] ?? 0;
      setLocalSets([{ set_number: 1, weight_kg: prefill, reps: 0, rpe: 0, is_warmup: false, saved: false }]);
    }
  }, [currentEx, exercises, getSetsForExercise, lastWeights, prRmMap, readinessScore, checkinStatus]);

  const addSet = () => {
    const last = localSets[localSets.length - 1];
    setLocalSets([...localSets, {
      set_number: localSets.length + 1,
      weight_kg: last?.weight_kg || 0,
      reps: 0, rpe: 0, is_warmup: false, saved: false,
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
      const restSeconds = exercises[currentEx].type === 'compound' ? 120 : 60;
      setRestTimer({ active: true, seconds: restSeconds });
    }
  };

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

  const handleSaveCardio = async () => {
    if (!cardioDuration || Number(cardioDuration) <= 0) {
      toast.error('Please enter duration');
      return;
    }
    setCardioSaving(true);
    const ok = await createCardioSession(
      cardioType,
      Number(cardioDuration),
      cardioDistance ? Number(cardioDistance) : null,
      cardioAvgHr    ? Number(cardioAvgHr)    : null,
      '',
      cardioZoneAchieved,
      showIncline && cardioIncline ? Number(cardioIncline) : null,
    );
    setCardioSaving(false);
    if (ok) {
      setCardioSaved(true);
      setCardioDuration('');
      setCardioDistance('');
      setCardioAvgHr('');
      setCardioIncline('');
    }
  };

  const workingSets = localSets.filter(s => !s.is_warmup && s.weight_kg > 0 && s.reps > 0);
  const bestSet     = workingSets.length > 0
    ? workingSets.reduce((a, b) => estimated1RM(a.weight_kg, a.reps) > estimated1RM(b.weight_kg, b.reps) ? a : b)
    : null;
  const best1RM = bestSet ? estimated1RM(bestSet.weight_kg, bestSet.reps) : 0;

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

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">

      {/* Header + Date selector */}
      <div>
        <h1 className="text-display text-2xl">Session Log</h1>
        <div className="flex items-center gap-3 mt-3">
          <label className="text-sm text-muted-foreground whitespace-nowrap">Date</label>
          <input
            type="date" value={selectedDate} max={todayStr()}
            onChange={e => setSelectedDate(e.target.value)}
            className="flex-1 bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
          />
          {selectedDate !== todayStr() && (
            <button onClick={() => setSelectedDate(todayStr())}
              className="text-xs text-primary underline underline-offset-2 whitespace-nowrap">
              Back to today
            </button>
          )}
        </div>
        {selectedDate !== todayStr() && (
          <p className="text-xs text-muted-foreground bg-secondary/60 rounded-lg px-3 py-2 mt-2">
            📅 Logging for {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        )}
        <p className="text-sm text-muted-foreground mt-1">
          {selectedDate === todayStr() ? 'Today' : selectedDate} · {exercises.length} exercises
        </p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2">
        <Button variant={activeTab === 'strength' ? 'default' : 'outline'} size="sm" className="flex-1"
          onClick={() => setActiveTab('strength')}>
          🏋️ Strength
        </Button>
        <Button variant={activeTab === 'cardio' ? 'default' : 'outline'} size="sm" className="flex-1"
          onClick={() => setActiveTab('cardio')}>
          🏃 Cardio
        </Button>
      </div>

      {/* ─── STRENGTH TAB ─── */}
      {activeTab === 'strength' && (
        <>
          {/* Exercise selector pills */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {exercises.map((ex, i) => (
              <Button key={ex.key} variant={i === currentEx ? 'default' : 'outline'} size="sm"
                onClick={() => setCurrentEx(i)} className="whitespace-nowrap">
                {i + 1}. {ex.name}
              </Button>
            ))}
          </div>

          {/* Exercise card */}
          <motion.div key={currentEx} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="bg-card rounded-xl p-4 sm:p-5 card-shadow space-y-4">

            {/* Header */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-label">Exercise {currentEx + 1} of {exercises.length}</span>
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

            {/* Sets */}
            <div className="space-y-2">
              {localSets.map((s, i) => (
                <div key={i} className={`rounded-xl border p-3 transition-colors ${
                  s.saved ? 'border-status-green/40 bg-status-green/5' : 'border-border bg-secondary/30'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-label">{s.is_warmup ? 'Warm-up' : `Set ${s.set_number}`}</span>
                    {s.saved ? (
                      <span className="text-status-green text-xs font-medium">✓ Saved</span>
                    ) : (
                      <Button variant="ghost" size="sm" className="h-8 px-3 text-xs"
                        onClick={() => handleSaveSet(i)}
                        disabled={saving || s.weight_kg <= 0 || s.reps <= 0}>
                        Save set
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <label className="text-label block text-center">kg</label>
                      <Input type="number" inputMode="decimal" value={s.weight_kg || ''}
                        onChange={e => updateSet(i, 'weight_kg', +e.target.value)}
                        className="h-11 text-center font-mono text-base bg-card" placeholder="0" step={0.5} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-label block text-center">Reps</label>
                      <Input type="number" inputMode="numeric" value={s.reps || ''}
                        onChange={e => updateSet(i, 'reps', +e.target.value)}
                        className="h-11 text-center font-mono text-base bg-card" placeholder="0" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-label block text-center">RPE</label>
                      <Input type="number" inputMode="numeric" value={s.rpe || ''}
                        onChange={e => updateSet(i, 'rpe', +e.target.value)}
                        className="h-11 text-center font-mono text-base bg-card" placeholder="1–10" min={1} max={10} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Button variant="outline" size="sm" onClick={addSet}>+ Add Set</Button>

            {bestSet && (
              <div className="bg-secondary rounded-lg p-3 space-y-1 text-sm">
                <div>Best set: <span className="font-mono font-semibold">{bestSet.weight_kg} kg × {bestSet.reps}</span></div>
                <div>Est. 1RM: <span className="font-mono font-semibold">~{best1RM} kg</span></div>
              </div>
            )}

            {/* Adaptive target */}
            {(() => {
              const ex = exercises[currentEx];
              if (!ex) return null;
              const todaySets = checkinStatus === 'Green' ? ex.green_sets : ex.yellow_sets;
              const targetKg  = getAdaptiveWeight(ex.key, todaySets);
              if (targetKg && !bestSet) {
                return (
                  <div className="rounded-lg px-3 py-2 text-xs flex items-center justify-between"
                    style={{ background: 'rgba(108,99,255,0.1)', border: '1px solid rgba(108,99,255,0.25)' }}>
                    <span style={{ color: 'hsl(245 100% 70%)' }}>
                      🎯 Adaptive target: <span className="font-mono font-bold">{targetKg} kg</span>
                      <span style={{ color: '#404070', marginLeft: 6 }}>
                        ({Math.round(intensityFromSets(todaySets || '') * readinessModifier(readinessScore) * 100)}% of {prRmMap[ex.key]}kg 1RM)
                      </span>
                    </span>
                  </div>
                );
              }
              if (!prRmMap[ex.key] && !bestSet) {
                return (
                  <div className="text-xs text-muted-foreground bg-secondary rounded-lg px-3 py-2">
                    Log this exercise to unlock adaptive weight targets
                  </div>
                );
              }
              return null;
            })()}

            {/* Progressive overload */}
            {(() => {
              const ex = exercises[currentEx];
              if (!ex) return null;
              const ol = overloadSuggestion[ex.key];
              if (!ol) return null;
              return (
                <div className="rounded-lg px-3 py-2 text-xs"
                  style={ol.ready
                    ? { background: 'rgba(186,255,41,0.08)', border: '1px solid rgba(186,255,41,0.25)' }
                    : { background: 'rgba(108,99,255,0.06)', border: '1px solid rgba(108,99,255,0.15)' }}>
                  <span style={{ color: ol.ready ? 'hsl(77 100% 58%)' : 'hsl(245 100% 70%)' }}>
                    {ol.ready ? '📈 ' : '⏳ '}{ol.suggestion}
                  </span>
                </div>
              );
            })()}
          </motion.div>

          {/* Previous / Next / Finish */}
          <div className="flex gap-3">
            <Button variant="outline" disabled={currentEx === 0}
              onClick={() => setCurrentEx(c => c - 1)} className="flex-1">← Previous</Button>
            {currentEx < exercises.length - 1 ? (
              <Button variant="accent" onClick={() => setCurrentEx(c => c + 1)} className="flex-1">Next Exercise →</Button>
            ) : (
              <Button variant="accent" onClick={handleFinish} className="flex-1">✓ Finish Session</Button>
            )}
          </div>
        </>
      )}

      {/* ─── CARDIO TAB ─── */}
      {activeTab === 'cardio' && (
        <div className="bg-card rounded-xl p-5 card-shadow space-y-4">
          {cardioSaved ? (
            <div className="text-center py-6 space-y-3">
              <div className="text-4xl">✅</div>
              <p className="font-semibold">Cardio logged!</p>
              <Button variant="outline" size="sm" onClick={() => setCardioSaved(false)}>Log another</Button>
            </div>
          ) : (
            <>
              {/* Activity type */}
              <div>
                <label className="text-sm text-muted-foreground block mb-2">Type</label>
                <div className="grid grid-cols-4 gap-2">
                  {CARDIO_TYPES.map(ct => (
                    <button key={ct.value} onClick={() => setCardioType(ct.value)}
                      className={`flex flex-col items-center gap-1 py-2 px-1 rounded-lg text-xs font-medium transition-colors ${
                        cardioType === ct.value
                          ? 'bg-primary/15 border border-primary/40 text-primary'
                          : 'bg-secondary border border-transparent text-muted-foreground'
                      }`}>
                      <span>{ct.label.split(' ')[0]}</span>
                      <span>{ct.label.split(' ').slice(1).join(' ')}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Metrics grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-muted-foreground block mb-1">Duration (min) *</label>
                  <Input type="number" inputMode="numeric" min="1" max="360"
                    value={cardioDuration} onChange={e => setCardioDuration(e.target.value)}
                    placeholder="e.g. 45" className="font-mono" />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground block mb-1">Distance (km)</label>
                  <Input type="number" inputMode="decimal" min="0" step="0.1"
                    value={cardioDistance} onChange={e => setCardioDistance(e.target.value)}
                    placeholder="e.g. 5.0" className="font-mono" />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground block mb-1">Avg HR (bpm)</label>
                  <Input type="number" inputMode="numeric" min="60" max="220"
                    value={cardioAvgHr} onChange={e => setCardioAvgHr(e.target.value)}
                    placeholder="e.g. 145" className="font-mono" />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground block mb-1">Zone achieved</label>
                  <select value={cardioZoneAchieved} onChange={e => setCardioZoneAchieved(e.target.value)}
                    className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
                    {['Zone 1', 'Zone 2', 'Zone 2–3', 'Zone 3', 'Zone 3–4', 'Zone 4', 'Zone 5'].map(z => (
                      <option key={z} value={z}>{z}</option>
                    ))}
                  </select>
                </div>

                {/* Incline — only for run, walk, bike, elliptical */}
                {showIncline && (
                  <div className="col-span-2">
                    <label className="text-sm text-muted-foreground block mb-1">
                      Avg Incline / Grade (%)
                      <span className="ml-1 text-[10px] text-muted-foreground/60">
                        — affects effort calculation
                      </span>
                    </label>
                    <Input type="number" inputMode="decimal" min="0" max="45" step="0.5"
                      value={cardioIncline} onChange={e => setCardioIncline(e.target.value)}
                      placeholder="e.g. 5.0  (0 = flat)" className="font-mono" />
                  </div>
                )}
              </div>

              <Button onClick={handleSaveCardio} disabled={cardioSaving} className="w-full">
                {cardioSaving ? 'Saving...' : '💾 Save Cardio Session'}
              </Button>
            </>
          )}
        </div>
      )}

    </div>
  );
};

export default LogPage;

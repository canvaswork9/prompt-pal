import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { estimated1RM } from '@/lib/decision-engine';
import { useWorkout, type WorkingSet } from '@/hooks/useWorkout';
import { useNavigate } from 'react-router-dom';
import { selectExercises } from '@/lib/exercise-db';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/lib/i18n';

const todayStr = () => new Date().toISOString().slice(0, 10);

const LogPage = () => {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const { loading, saving, saveSet, finishSession, getSetsForExercise } = useWorkout();
  const [exercises, setExercises] = useState<{ key: string; name: string }[]>([]);
  const [currentEx, setCurrentEx] = useState(0);
  const [localSets, setLocalSets] = useState<WorkingSet[]>([]);
  const [sessionStart] = useState(() => Date.now());

  // Load exercises from today's checkin
  useEffect(() => {
    async function loadExercises() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [{ data: checkin }, { data: profile }] = await Promise.all([
        supabase.from('daily_checkins').select('*').eq('user_id', user.id).eq('date', todayStr()).maybeSingle(),
        supabase.from('user_profiles').select('experience').eq('id', user.id).maybeSingle(),
      ]);

      if (checkin?.training_split) {
        const exList = selectExercises(
          checkin.training_split,
          (checkin.status as any) || 'Yellow',
          (profile?.experience as any) || 'intermediate',
          (checkin.muscle_soreness as any) || 'none'
        );
        setExercises(exList.map(e => ({
          key: e.key,
          name: lang === 'th' ? e.name_th : e.name_en,
        })));
      } else {
        setExercises([
          { key: 'squat_barbell', name: 'Barbell Back Squat' },
          { key: 'rdl', name: 'Romanian Deadlift' },
          { key: 'leg_press', name: 'Leg Press' },
        ]);
      }
    }
    loadExercises();
  }, [lang]);

  // Load saved sets when switching exercise
  useEffect(() => {
    if (exercises.length === 0) return;
    const saved = getSetsForExercise(exercises[currentEx].key);
    if (saved.length > 0) {
      setLocalSets(saved);
    } else {
      setLocalSets([
        { set_number: 1, weight_kg: 0, reps: 0, rpe: 0, is_warmup: false, saved: false },
      ]);
    }
  }, [currentEx, exercises, getSetsForExercise]);

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
    }
  };

  const handleFinish = async () => {
    const durationMin = Math.round((Date.now() - sessionStart) / 60000);
    await finishSession(durationMin);
    navigate('/progress');
  };

  if (loading) return <div className="flex items-center justify-center min-h-[50vh] text-muted-foreground">Loading...</div>;

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

      {/* Exercise Nav */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {exercises.map((ex, i) => (
          <Button key={ex.key} variant={i === currentEx ? 'default' : 'outline'} size="sm" onClick={() => setCurrentEx(i)} className="whitespace-nowrap">
            {i + 1}. {ex.name}
          </Button>
        ))}
      </div>

      {/* Current Exercise */}
      <motion.div key={currentEx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-xl p-5 card-shadow space-y-4">
        <h2 className="font-semibold text-lg">
          Exercise {currentEx + 1} of {exercises.length}: {exercises[currentEx].name}
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground text-xs uppercase border-b border-border">
                <th className="py-2 text-left">Set</th>
                <th className="py-2 text-center">kg</th>
                <th className="py-2 text-center">Reps</th>
                <th className="py-2 text-center">RPE</th>
                <th className="py-2 text-center">Save</th>
              </tr>
            </thead>
            <tbody>
              {localSets.map((s, i) => (
                <tr key={i} className="border-b border-border/50">
                  <td className="py-2 font-mono">{s.is_warmup ? 'W' : s.set_number}</td>
                  <td className="py-2">
                    <Input type="number" value={s.weight_kg || ''} onChange={e => updateSet(i, 'weight_kg', +e.target.value)} className="w-20 text-center bg-secondary mx-auto h-8 font-mono" placeholder="0" />
                  </td>
                  <td className="py-2">
                    <Input type="number" value={s.reps || ''} onChange={e => updateSet(i, 'reps', +e.target.value)} className="w-16 text-center bg-secondary mx-auto h-8 font-mono" placeholder="0" />
                  </td>
                  <td className="py-2">
                    <Input type="number" value={s.rpe || ''} onChange={e => updateSet(i, 'rpe', +e.target.value)} className="w-16 text-center bg-secondary mx-auto h-8 font-mono" placeholder="0" />
                  </td>
                  <td className="py-2 text-center">
                    {s.saved ? (
                      <span className="text-status-green">✓</span>
                    ) : (
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleSaveSet(i)} disabled={saving || s.weight_kg <= 0 || s.reps <= 0}>
                        💾
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Button variant="outline" size="sm" onClick={addSet}>+ Add Set</Button>

        {bestSet && (
          <div className="bg-secondary rounded-lg p-3 space-y-1 text-sm">
            <div>Best set: <span className="font-mono font-semibold">{bestSet.weight_kg} kg × {bestSet.reps}</span></div>
            <div>Est. 1RM: <span className="font-mono font-semibold">~{best1RM} kg</span></div>
          </div>
        )}
      </motion.div>

      {/* Nav */}
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

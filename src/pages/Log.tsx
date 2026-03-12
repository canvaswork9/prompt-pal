import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { estimated1RM } from '@/lib/decision-engine';
import type { SetData } from '@/lib/types';

const LogPage = () => {
  const exercises = [
    { key: 'squat_barbell', name: 'Barbell Back Squat' },
    { key: 'rdl', name: 'Romanian Deadlift' },
    { key: 'leg_press', name: 'Leg Press' },
  ];

  const [currentEx, setCurrentEx] = useState(0);
  const [sets, setSets] = useState<SetData[]>([
    { set_number: 1, weight_kg: 65, reps: 12, rpe: 7, is_warmup: false },
    { set_number: 2, weight_kg: 65, reps: 10, rpe: 8, is_warmup: false },
  ]);

  const addSet = () => {
    const last = sets[sets.length - 1];
    setSets([...sets, { set_number: sets.length + 1, weight_kg: last?.weight_kg || 0, reps: 0, rpe: 0, is_warmup: false }]);
  };

  const updateSet = (i: number, field: keyof SetData, value: number) => {
    setSets(sets.map((s, j) => j === i ? { ...s, [field]: value } : s));
  };

  const bestSet = sets.reduce((a, b) => estimated1RM(a.weight_kg, a.reps) > estimated1RM(b.weight_kg, b.reps) ? a : b, sets[0]);
  const best1RM = bestSet ? estimated1RM(bestSet.weight_kg, bestSet.reps) : 0;

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-display text-2xl">Session Log</h1>
        <p className="text-sm text-muted-foreground">Lower Body · Today · Score: 78</p>
      </div>

      {/* Exercise Nav */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {exercises.map((ex, i) => (
          <Button key={ex.key} variant={i === currentEx ? 'default' : 'outline'} size="sm" onClick={() => setCurrentEx(i)}>
            {i + 1}. {ex.name}
          </Button>
        ))}
      </div>

      {/* Current Exercise */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-xl p-5 card-shadow space-y-4">
        <h2 className="font-semibold text-lg">Exercise {currentEx + 1} of {exercises.length}: {exercises[currentEx].name}</h2>

        {/* Set Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground text-xs uppercase border-b border-border">
                <th className="py-2 text-left">Set</th>
                <th className="py-2 text-center">Weight (kg)</th>
                <th className="py-2 text-center">Reps</th>
                <th className="py-2 text-center">RPE</th>
                <th className="py-2 text-center">✓</th>
              </tr>
            </thead>
            <tbody>
              {sets.map((s, i) => (
                <tr key={i} className="border-b border-border/50">
                  <td className="py-2 font-mono">{s.set_number}</td>
                  <td className="py-2">
                    <Input type="number" value={s.weight_kg} onChange={e => updateSet(i, 'weight_kg', +e.target.value)} className="w-20 text-center bg-secondary mx-auto h-8 font-mono" />
                  </td>
                  <td className="py-2">
                    <Input type="number" value={s.reps} onChange={e => updateSet(i, 'reps', +e.target.value)} className="w-16 text-center bg-secondary mx-auto h-8 font-mono" />
                  </td>
                  <td className="py-2">
                    <Input type="number" value={s.rpe} onChange={e => updateSet(i, 'rpe', +e.target.value)} className="w-16 text-center bg-secondary mx-auto h-8 font-mono" />
                  </td>
                  <td className="py-2 text-center text-status-green">✓</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Button variant="outline" size="sm" onClick={addSet}>+ Add Set</Button>

        {/* Stats */}
        {bestSet && (
          <div className="bg-secondary rounded-lg p-3 space-y-1 text-sm">
            <div>Best set: <span className="font-mono font-semibold">{bestSet.weight_kg} kg × {bestSet.reps}</span></div>
            <div>Est. 1RM today: <span className="font-mono font-semibold">~{best1RM} kg</span></div>
            <div className="text-xs text-muted-foreground">Score 78 → Hold or slight increase next Green day.</div>
          </div>
        )}
      </motion.div>

      {/* Nav */}
      <div className="flex gap-3">
        <Button variant="outline" disabled={currentEx === 0} onClick={() => setCurrentEx(c => c - 1)} className="flex-1">← Previous</Button>
        {currentEx < exercises.length - 1 ? (
          <Button variant="accent" onClick={() => setCurrentEx(c => c + 1)} className="flex-1">Next Exercise →</Button>
        ) : (
          <Button variant="accent" className="flex-1">✓ Finish Session</Button>
        )}
      </div>
    </div>
  );
};

export default LogPage;

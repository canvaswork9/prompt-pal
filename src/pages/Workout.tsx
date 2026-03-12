import { motion } from 'framer-motion';
import { useLanguage } from '@/lib/i18n';
import { selectExercises } from '@/lib/exercise-db';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

const WorkoutPage = () => {
  const { t, lang } = useLanguage();
  const [expandedTips, setExpandedTips] = useState<string | null>(null);

  // Mock data for demo
  const score = 78;
  const status = 'Yellow' as const;
  const split = 'Lower Body';
  const experience = 'intermediate';
  const soreness = 'upper';

  const exercises = selectExercises(split, status, experience, soreness);

  const intensityBands = [
    { range: '85–100', icon: '🔥', desc: 'Push for PRs — your body is ready', active: false },
    { range: '70–84', icon: '✅', desc: 'Normal intensity — solid session', active: false },
    { range: '55–69', icon: '⚡', desc: 'Reduce load 15–20% — quality over weight', active: true },
    { range: '45–54', icon: '🛑', desc: 'Technique work only — no max effort', active: false },
    { range: '<45', icon: '😴', desc: 'Rest or mobility only', active: false },
  ];

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Top Banner */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl p-5 card-shadow">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-display text-xl">TODAY: {split.toUpperCase()}</h1>
            <p className="text-sm text-muted-foreground">Score {score} · {status} · ~55 min · Reduce load 15–20%</p>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium bg-status-yellow-dim text-status-yellow`}>
            ● {status}
          </div>
        </div>
      </motion.div>

      {/* Intensity Bands */}
      <div className="space-y-1">
        {intensityBands.map(band => (
          <div key={band.range} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${band.active ? 'bg-primary/10 border border-primary/30' : ''}`}>
            <span className="w-14 font-mono text-muted-foreground text-xs">{band.range}</span>
            <span>{band.icon}</span>
            <span className={band.active ? 'font-medium text-foreground' : 'text-muted-foreground'}>{band.desc}</span>
            {band.active && <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded ml-auto">TODAY</span>}
          </div>
        ))}
      </div>

      {/* Exercise Cards */}
      <div className="space-y-4">
        {exercises.map((ex, i) => (
          <motion.div
            key={ex.key}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="bg-card rounded-xl p-4 card-shadow hover:card-shadow-hover transition-shadow"
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-muted-foreground">{i + 1}</span>
                  <h3 className="font-semibold">{lang === 'th' ? ex.name_th : ex.name_en}</h3>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-medium ${ex.type === 'compound' ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground'}`}>
                    {ex.type}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{ex.muscles}</p>
              </div>
            </div>

            {/* Sets/Reps/Rest */}
            <div className="grid grid-cols-3 gap-2 my-3">
              <div className="bg-secondary rounded-lg p-2 text-center">
                <div className="text-[10px] text-muted-foreground uppercase">Sets × Reps</div>
                <div className="font-mono font-semibold text-sm">{status === 'Green' ? ex.green_sets : ex.yellow_sets}</div>
              </div>
              <div className="bg-secondary rounded-lg p-2 text-center">
                <div className="text-[10px] text-muted-foreground uppercase">Rest</div>
                <div className="font-mono font-semibold text-sm">{ex.type === 'compound' ? '2 min' : '90s'}</div>
              </div>
              <div className="bg-secondary rounded-lg p-2 text-center">
                <div className="text-[10px] text-muted-foreground uppercase">Status</div>
                <div className="font-semibold text-sm">🟡 –15%</div>
              </div>
            </div>

            {/* Form Tips */}
            <button
              onClick={() => setExpandedTips(expandedTips === ex.key ? null : ex.key)}
              className="text-xs text-primary hover:text-primary/80 transition-colors"
            >
              {expandedTips === ex.key ? '▲ Hide Form Tips' : '▼ Form Tips'}
            </button>
            {expandedTips === ex.key && (
              <motion.ul initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-2 space-y-1 text-xs text-muted-foreground">
                {(lang === 'th' ? ex.form_tips_th : ex.form_tips_en).map((tip, j) => (
                  <li key={j}>• {tip}</li>
                ))}
              </motion.ul>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 mt-3">
              <Button variant="outline" size="sm" className="text-xs">📝 Log This Set</Button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default WorkoutPage;

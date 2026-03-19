import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import ReadinessRing from '@/components/ReadinessRing';
import type { ReadinessResult, CheckinData } from '@/lib/types';

interface ResultCardProps {
  result: ReadinessResult;
  data: CheckinData;
  onBack: () => void;
}

const ResultCard = ({ result, data, onBack }: ResultCardProps) => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const breakdownItems = [
    { label: 'Sleep Duration', value: `${data.sleep_hours}h`, score: result.score_breakdown.sleep_duration },
    { label: 'Sleep Quality', value: data.sleep_quality, score: result.score_breakdown.sleep_quality },
    { label: 'Heart Rate', value: `${data.resting_hr} bpm`, score: result.score_breakdown.heart_rate },
    { label: 'Recovery', value: data.yesterday_training, score: result.score_breakdown.recovery },
    { label: 'Soreness', value: data.muscle_soreness, score: result.score_breakdown.soreness },
    { label: 'Nutrition', value: data.nutrition_load, score: result.score_breakdown.nutrition },
  ];

  const coachMessage = result.status === 'Green'
    ? "Your recovery looks solid today. Sleep was good and HR is in range. Hit your planned session with full intensity — you're in a great position to push for progress."
    : result.status === 'Yellow'
    ? "HR is a bit elevated and you have some lingering soreness. Train today but reduce load 15-20%. Focus on form and controlled reps. Sleep 8+ hours tonight and you'll be green tomorrow."
    : "Your body is signaling it needs rest. Elevated HR, poor sleep, and soreness all point to the same thing — take a recovery day. Light walking and stretching only.";

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
      <Button variant="ghost" onClick={onBack} className="mb-2">← Back to check-in</Button>

      {/* Ring */}
      <div className="flex justify-center">
        <ReadinessRing score={result.score} status={result.status} size={200} />
      </div>

      {/* Status Badge */}
      <div className="text-center">
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
          result.status === 'Green' ? 'bg-status-green-dim text-status-green' :
          result.status === 'Yellow' ? 'bg-status-yellow-dim text-status-yellow' :
          'bg-status-red-dim text-status-red'
        }`}>
          ● {result.status} — {result.decision}
        </div>
      </div>

      {/* Decision Panel */}
      <div className="bg-card rounded-xl p-5 card-shadow space-y-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><span className="text-muted-foreground">{t('decision')}</span><div className="font-semibold">{result.decision}</div></div>
          <div><span className="text-muted-foreground">{t('todays_split')}</span><div className="font-semibold">{result.training_split}</div></div>
          <div><span className="text-muted-foreground">{t('intensity')}</span><div className="font-semibold">{result.intensity_note}</div></div>
          <div><span className="text-muted-foreground">Cardio</span><div className="font-semibold">{result.cardio_zone}</div></div>
        </div>

        {result.skip_reasons.length > 0 && (
          <div className="border-t border-border pt-3">
            <div className="text-sm text-muted-foreground">⚠️ Skip today:</div>
            {result.skip_reasons.map((r, i) => (
              <div key={i} className="text-sm ml-4">• {r}</div>
            ))}
          </div>
        )}

        <div className="border-t border-border pt-3">
          <div className="text-sm text-muted-foreground mb-1">💬 {t('coach_says')}:</div>
          <p className="text-sm italic leading-relaxed">"{coachMessage}"</p>
        </div>
      </div>

      {/* Score Breakdown */}
      <details className="bg-card rounded-xl p-5 card-shadow">
        <summary className="font-semibold cursor-pointer">{t('score_breakdown')}</summary>
        <div className="mt-4 space-y-3">
          {breakdownItems.map(item => (
            <div key={item.label} className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground w-28">{item.label}</span>
              <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${item.score >= 75 ? 'bg-status-green' : item.score >= 50 ? 'bg-status-yellow' : 'bg-status-red'}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${item.score}%` }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                />
              </div>
              <span className="text-sm font-mono w-8 text-right">{item.score}</span>
            </div>
          ))}
          <div className="border-t border-border pt-2 flex justify-between font-semibold">
            <span>Weighted Total</span>
            <span className="font-mono">{result.score} / 100</span>
          </div>
        </div>
      </details>

      {/* Next Steps — Apex Dark */}
      <div className="bg-secondary/40 rounded-xl p-4 space-y-2.5">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">What to do next</p>
        {result.status !== 'Red' ? (
          <>
            {/* Step 1 — Lime (reward/primary) */}
            <button onClick={() => navigate('/workout')}
              className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left transition-all active:scale-[0.98] glow-lime-btn"
              style={{ background: 'hsl(77 100% 58%)', color: 'hsl(240 60% 3%)' }}>
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0" style={{ background: 'rgba(0,0,0,0.15)' }}>1</span>
              <div className="flex-1">
                <div className="text-sm font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>See today's workout plan</div>
                <div className="text-[11px] opacity-60">{result.training_split}</div>
              </div>
              <span className="opacity-50">→</span>
            </button>
            {/* Steps 2+3 */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { step: 2, label: 'Log sets', sub: 'Track reps', path: '/log' },
                { step: 3, label: 'Log meals', sub: 'Track macros', path: '/meal' },
              ].map(s => (
                <button key={s.step} onClick={() => navigate(s.path)}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-card border border-border hover:border-primary/40 transition-all active:scale-[0.98]">
                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 bg-primary/15 text-primary">{s.step}</span>
                  <div>
                    <div className="text-xs font-semibold">{s.label}</div>
                    <div className="text-[10px] text-muted-foreground">{s.sub}</div>
                  </div>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="space-y-2">
            {[
              { step: 1, label: 'Recovery exercises', sub: 'Mobility & stretching', path: '/workout', lime: true },
              { step: 2, label: 'Log meals', sub: 'Nutrition supports recovery', path: '/meal', lime: false },
            ].map(s => (
              <button key={s.step} onClick={() => navigate(s.path)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-all active:scale-[0.98] ${s.lime ? '' : 'bg-card border border-border'}`}
                style={s.lime ? { background: 'hsl(77 100% 58%)', color: 'hsl(240 60% 3%)' } : {}}>
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                  style={{ background: s.lime ? 'rgba(0,0,0,0.15)' : 'hsl(245 100% 70% / 0.15)', color: s.lime ? 'inherit' : 'hsl(245 100% 70%)' }}>{s.step}</span>
                <div className="flex-1">
                  <div className="text-sm font-semibold">{s.label}</div>
                  <div className={`text-[10px] ${s.lime ? 'opacity-60' : 'text-muted-foreground'}`}>{s.sub}</div>
                </div>
                <span className="opacity-40">→</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ResultCard;

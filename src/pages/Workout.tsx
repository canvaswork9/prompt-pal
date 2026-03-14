import { motion } from 'framer-motion';
import { useLanguage } from '@/lib/i18n';
import { selectExercises } from '@/lib/exercise-db';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const todayStr = () => new Date().toISOString().slice(0, 10);

const WorkoutPage = () => {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const [expandedTips, setExpandedTips] = useState<string | null>(null);
  const [checkinData, setCheckinData] = useState<{
    score: number; status: string; split: string; soreness: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [experience, setExperience] = useState<string>('intermediate');

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const [{ data: checkin }, { data: profile }] = await Promise.all([
        supabase.from('daily_checkins').select('*').eq('user_id', user.id).eq('date', todayStr()).maybeSingle(),
        supabase.from('user_profiles').select('experience').eq('id', user.id).maybeSingle(),
      ]);

      if (profile?.experience) setExperience(profile.experience);

      if (checkin && checkin.readiness_score) {
        setCheckinData({
          score: checkin.readiness_score,
          status: checkin.status || 'Yellow',
          split: checkin.training_split || 'Lower Body',
          soreness: checkin.muscle_soreness || 'none',
        });
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-[50vh] text-muted-foreground">Loading...</div>;

  if (!checkinData) {
    return (
      <div className="max-w-3xl mx-auto p-6 text-center space-y-4">
        <h1 className="text-display text-2xl">No Check-in Today</h1>
        <p className="text-muted-foreground">Complete your daily check-in first to get your workout plan.</p>
        <Button variant="accent" onClick={() => navigate('/app')}>Go to Check-in</Button>
      </div>
    );
  }

  const { score, status, split, soreness } = checkinData;
  const exercises = selectExercises(split, status as any, experience as any, soreness as any);

  const getIntensityBands = (s: number) => [
    { range: '85–100', icon: '🔥', desc: 'Push for PRs — your body is ready', active: s >= 85 },
    { range: '70–84', icon: '✅', desc: 'Normal intensity — solid session', active: s >= 70 && s < 85 },
    { range: '55–69', icon: '⚡', desc: 'Reduce load 15–20% — quality over weight', active: s >= 55 && s < 70 },
    { range: '45–54', icon: '🛑', desc: 'Technique work only — no max effort', active: s >= 45 && s < 55 },
    { range: '<45', icon: '😴', desc: 'Rest or mobility only', active: s < 45 },
  ];

  const intensityBands = getIntensityBands(score);
  const statusColor = status === 'Green' ? 'bg-status-green-dim text-status-green' : status === 'Yellow' ? 'bg-status-yellow-dim text-status-yellow' : 'bg-status-red-dim text-status-red';
  const loadNote = score >= 85 ? 'PR attempt!' : score >= 70 ? 'Normal load' : score >= 55 ? '–15% load' : '–30% load';

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl p-5 card-shadow">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-display text-xl">TODAY: {split.toUpperCase()}</h1>
            <p className="text-sm text-muted-foreground">Score {score} · {status} · ~55 min · {loadNote}</p>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${statusColor}`}>● {status}</div>
        </div>
      </motion.div>

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

      <div className="space-y-4">
        {exercises.map((ex, i) => (
          <motion.div key={ex.key} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="bg-card rounded-xl p-4 card-shadow hover:card-shadow-hover transition-shadow">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-muted-foreground">{i + 1}</span>
                  <h3 className="font-semibold">{lang === 'th' ? ex.name_th : ex.name_en}</h3>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-medium ${ex.type === 'compound' ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground'}`}>{ex.type}</span>
                </div>
                <p className="text-xs text-muted-foreground">{ex.muscles}</p>
              </div>
            </div>
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
                <div className="text-[10px] text-muted-foreground uppercase">Load</div>
                <div className="font-semibold text-sm">{loadNote}</div>
              </div>
            </div>
            <button onClick={() => setExpandedTips(expandedTips === ex.key ? null : ex.key)} className="text-xs text-primary hover:text-primary/80 transition-colors">
              {expandedTips === ex.key ? '▲ Hide Form Tips' : '▼ Form Tips'}
            </button>
            {expandedTips === ex.key && (
              <motion.ul initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-2 space-y-1 text-xs text-muted-foreground">
                {(lang === 'th' ? ex.form_tips_th : ex.form_tips_en).map((tip, j) => (
                  <li key={j}>• {tip}</li>
                ))}
              </motion.ul>
            )}
          </motion.div>
        ))}
      </div>

      <Button variant="accent" className="w-full" onClick={() => navigate('/log')}>📝 Start Logging Sets</Button>
    </div>
  );
};

export default WorkoutPage;

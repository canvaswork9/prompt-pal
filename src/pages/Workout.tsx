import { motion } from 'framer-motion';
import { useLanguage } from '@/lib/i18n';
import { selectExercises, EXERCISE_DB } from '@/lib/exercise-db';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import SkeletonLoader from '@/components/SkeletonLoader';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

const todayStr = () => new Date().toISOString().slice(0, 10);

const WorkoutPage = () => {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const videoEnabled = useFeatureFlag('workout_videos');
  const [expandedTips, setExpandedTips] = useState<string | null>(null);
  const [checkinData, setCheckinData] = useState<{
    score: number; status: string; split: string; soreness: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [experience, setExperience] = useState<string>('intermediate');
  const [prMap, setPrMap] = useState<Record<string, number>>({}); // exercise_key → estimated_1rm

  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }

        const [{ data: checkin }, { data: profile }, { data: prs }] = await Promise.all([
          supabase.from('daily_checkins').select('*').eq('user_id', user.id).eq('date', todayStr()).maybeSingle(),
          supabase.from('user_profiles').select('experience').eq('id', user.id).maybeSingle(),
          supabase.from('personal_records').select('exercise_key, estimated_1rm').eq('user_id', user.id),
        ]);

        if (profile?.experience) setExperience(profile.experience);

        // Build PR map: best 1RM per exercise
        const map: Record<string, number> = {};
        for (const pr of prs ?? []) {
          if (pr.exercise_key && pr.estimated_1rm) {
            if (!map[pr.exercise_key] || pr.estimated_1rm > map[pr.exercise_key]) {
              map[pr.exercise_key] = Number(pr.estimated_1rm);
            }
          }
        }
        setPrMap(map);

        if (checkin && checkin.readiness_score) {
          setCheckinData({
            score: checkin.readiness_score,
            status: checkin.status || 'Yellow',
            split: checkin.training_split || 'Lower Body',
            soreness: checkin.muscle_soreness || 'none',
          });
        }
        setLoading(false);
      } catch (err) {
        console.error('Failed to load workout data:', err);
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <SkeletonLoader />;

  if (!checkinData) {
    return (
      <div className="max-w-3xl mx-auto p-6 space-y-4">
        <div className="bg-card rounded-2xl p-6 text-center space-y-4 card-shadow">
          <div className="text-4xl">⚡</div>
          <h1 className="font-display text-xl font-bold">Check in first</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Your workout plan is personalised to today's readiness score.<br />
            Takes about 60 seconds — sleep, HR, and soreness.
          </p>
          <Button variant="accent" className="w-full" onClick={() => navigate('/app')}>
            Start today's check-in →
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: '😴', label: 'Sleep', desc: 'How rested?' },
            { icon: '❤️', label: 'Heart rate', desc: 'Recovery signal' },
            { icon: '💪', label: 'Soreness', desc: 'What to skip' },
          ].map(({ icon, label, desc }) => (
            <div key={label} className="bg-card rounded-xl p-3 text-center card-shadow">
              <div className="text-2xl mb-1">{icon}</div>
              <div className="text-xs font-semibold">{label}</div>
              <div className="text-[10px] text-muted-foreground">{desc}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const { score, status, split, soreness } = checkinData;
  const exercises = selectExercises(split, status as any, experience as any, soreness as any);

  // ── Adaptive Load Algorithm ────────────────────────────────
  // Parse sets string to get rep range midpoint → intensity factor
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
    if (setsStr.includes('AMRAP')) return 0.60;
    return 0.65;
  };

  const readinessModifier = (s: number): number =>
    s >= 90 ? 1.02 :  // slight push for PR zone
    s >= 70 ? 1.00 :
    s >= 55 ? 0.85 :
    s >= 45 ? 0.75 :
              0.60;

  const calcTargetWeight = (exerciseKey: string, setsStr: string, s: number): number | null => {
    const rm = prMap[exerciseKey];
    if (!rm || rm <= 0) return null;
    const raw = rm * intensityFromSets(setsStr) * readinessModifier(s);
    return Math.round(raw / 2.5) * 2.5; // round to nearest 2.5kg
  };

  const isPrZone = score >= 88;

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
        {exercises.length === 0 ? (
          <div className="bg-card rounded-xl p-6 card-shadow text-center space-y-2">
            <div className="text-4xl">😴</div>
            <h3 className="font-semibold">Rest Day</h3>
            <p className="text-sm text-muted-foreground">Your body needs recovery today. Light movement like walking or stretching is fine.</p>
          </div>
        ) : exercises.map((ex, i) => {
          const todaySets = status === 'Green' ? ex.green_sets : ex.yellow_sets;
          const targetKg  = calcTargetWeight(ex.key, todaySets, score);
          const hasPR     = !!prMap[ex.key];

          return (
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
              {isPrZone && hasPR && ex.type === 'compound' && (
                <span className="text-[10px] px-2 py-1 rounded-full font-bold" style={{ background: 'rgba(186,255,41,0.12)', color: 'hsl(77 100% 58%)', border: '1px solid rgba(186,255,41,0.3)' }}>
                  ⚡ PR ZONE
                </span>
              )}
            </div>

            {/* ── ADAPTIVE LOAD SUGGESTION ── */}
            <div className="grid grid-cols-3 gap-2 my-3">
              <div className="bg-secondary rounded-lg p-2 text-center">
                <div className="text-[10px] text-muted-foreground uppercase">Sets × Reps</div>
                <div className="font-mono font-semibold text-sm">{todaySets}</div>
              </div>
              <div className="bg-secondary rounded-lg p-2 text-center">
                <div className="text-[10px] text-muted-foreground uppercase">Rest</div>
                <div className="font-mono font-semibold text-sm">{ex.type === 'compound' ? '2 min' : '90s'}</div>
              </div>
              {/* Target weight — show if PR exists, else show loadNote */}
              {targetKg ? (
                <div className="rounded-lg p-2 text-center" style={{ background: 'rgba(108,99,255,0.1)', border: '1px solid rgba(108,99,255,0.25)' }}>
                  <div className="text-[10px] uppercase" style={{ color: 'hsl(245 100% 70%)', opacity: 0.7 }}>TARGET</div>
                  <div className="font-mono font-bold text-sm" style={{ color: 'hsl(245 100% 75%)' }}>{targetKg} kg</div>
                </div>
              ) : (
                <div className="bg-secondary rounded-lg p-2 text-center">
                  <div className="text-[10px] text-muted-foreground uppercase">Load</div>
                  <div className="font-semibold text-sm">{loadNote}</div>
                </div>
              )}
            </div>

            {/* PR context line */}
            {hasPR && (
              <p className="text-[11px] mb-2" style={{ color: '#404070' }}>
                Est. 1RM: <span style={{ color: 'hsl(245 100% 70%)', fontFamily: "'JetBrains Mono',monospace", fontWeight: 600 }}>{prMap[ex.key]}kg</span>
                {targetKg && <> · Target = {Math.round(intensityFromSets(todaySets) * readinessModifier(score) * 100)}% of 1RM</>}
              </p>
            )}
            {!hasPR && ex.type === 'compound' && (
              <p className="text-[11px] mb-2" style={{ color: '#2a2a50' }}>
                Log this exercise to unlock personalised weight targets
              </p>
            )}

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
          );
        })}
      </div>

      {/* CTA — go to Log */}
      <div className="sticky bottom-20 lg:bottom-6 px-4 pb-2 pt-3 pointer-events-none">
        <Button
          variant="accent"
          className="w-full pointer-events-auto shadow-lg"
          onClick={() => navigate('/log')}
        >
          🏋️ Start logging sets →
        </Button>
      </div>
    </div>
  );
};

export default WorkoutPage;

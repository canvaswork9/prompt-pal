import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { EXERCISE_DB } from '@/lib/exercise-db';

/* ─────────────────────────────────────────
   WEEKLY PERFORMANCE REPORT
   Modal that appears Mon–Wed summarising
   the previous Mon–Sun week.
   Dismissed state stored in localStorage.
───────────────────────────────────────── */

const BC   = "'Barlow Condensed', sans-serif";
const DM   = "'DM Sans', sans-serif";
const MONO = "'JetBrains Mono', monospace";

interface WeekData {
  // Checkins
  checkinDays:  number;
  greenDays:    number;
  yellowDays:   number;
  redDays:      number;
  avgScore:     number;
  avgSleep:     number;
  avgHR:        number;
  // Workouts
  workoutCount: number;
  totalMinutes: number;
  splits:       string[];
  // PRs
  newPRs:       { exercise: string; weight: number; prev: number | null }[];
  // Weight
  weightStart:  number | null;
  weightEnd:    number | null;
}

// ── Helper: get Mon-Sun range of last week ──
function getLastWeekRange(): { start: string; end: string; label: string } {
  const now   = new Date();
  const dow   = now.getDay(); // 0=Sun
  // Monday of this week
  const thisMon = new Date(now);
  thisMon.setDate(now.getDate() - ((dow + 6) % 7));
  // Last week Mon
  const lastMon = new Date(thisMon);
  lastMon.setDate(thisMon.getDate() - 7);
  // Last week Sun
  const lastSun = new Date(lastMon);
  lastSun.setDate(lastMon.getDate() + 6);

  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const label = lastMon.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    + ' – '
    + lastSun.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return { start: fmt(lastMon), end: fmt(lastSun), label };
}

// ── Should report show? Mon=1, Tue=2, Wed=3 ──
// DEV: set to true to test on any day
const DEV_SHOW = false;

function shouldShowReport(dismissKey: string): boolean {
  const dow = new Date().getDay();
  if (!DEV_SHOW && (dow < 1 || dow > 3)) return false;
  const dismissed = localStorage.getItem(dismissKey);
  if (dismissed === getLastWeekRange().start) return false;
  return true;
}

// ── Headline generator ──
function makeHeadline(d: WeekData): string {
  const gPct = d.checkinDays > 0 ? Math.round((d.greenDays / d.checkinDays) * 100) : 0;
  const prText = d.newPRs.length > 0 ? ` and ${d.newPRs.length} new PR${d.newPRs.length > 1 ? 's' : ''}` : '';

  if (gPct >= 70 && d.workoutCount >= 4) return `Outstanding week — ${d.greenDays} Green days${prText} 🔥`;
  if (gPct >= 50 && d.workoutCount >= 3) return `Solid week — ${d.greenDays} Green days${prText} ✅`;
  if (d.workoutCount >= 4)               return `${d.workoutCount} workouts logged${prText} — recovery needs attention`;
  if (d.checkinDays >= 5)                return `Consistent check-ins — ${d.greenDays} Green days this week`;
  if (d.checkinDays === 0)               return `No check-ins last week — start fresh this week`;
  return `${d.checkinDays} check-ins logged — ${d.greenDays} Green days${prText}`;
}

// ── Focus generator ──
function makeFocus(d: WeekData): string[] {
  const tips: string[] = [];
  if (d.avgSleep > 0 && d.avgSleep < 7)
    tips.push(`Sleep avg ${d.avgSleep}h — below optimal. Target 7.5h this week.`);
  if (d.checkinDays > 0 && d.redDays / d.checkinDays > 0.3)
    tips.push(`${d.redDays} Red days detected — prioritise recovery over training volume.`);
  if (d.workoutCount < 3 && d.checkinDays >= 4)
    tips.push(`Only ${d.workoutCount} workouts logged. Aim for 4 sessions this week.`);
  if (d.avgHR > 72)
    tips.push(`Resting HR ${d.avgHR}bpm — elevated. More sleep and less stress will lower it.`);
  if (tips.length === 0 && d.greenDays >= 4)
    tips.push(`Strong consistency — maintain the same sleep and recovery routine this week.`);
  if (tips.length === 0)
    tips.push(`Keep logging daily — more data means smarter recommendations.`);
  return tips.slice(0, 2);
}

// ── Grade ──
function getGrade(d: WeekData): { label: string; color: string } {
  const gPct = d.checkinDays > 0 ? (d.greenDays / d.checkinDays) : 0;
  if (gPct >= 0.7 && d.workoutCount >= 4 && d.avgSleep >= 7)
    return { label: 'ELITE WEEK', color: 'hsl(77 100% 58%)' };
  if (gPct >= 0.5 && d.workoutCount >= 3)
    return { label: 'STRONG WEEK', color: 'hsl(245 100% 70%)' };
  if (d.checkinDays >= 4)
    return { label: 'BUILDING', color: 'hsl(38 88% 58%)' };
  return { label: 'STARTING', color: 'hsl(240 15% 55%)' };
}

// ── Main component ──────────────────────────────────────────────
const WeeklyReport = () => {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [data, setData]       = useState<WeekData | null>(null);
  const [range, setRange]     = useState({ start: '', end: '', label: '' });

  const DISMISS_KEY = `weekly_report_dismissed_${user?.id ?? 'anon'}`;

  const load = useCallback(async () => {
    if (!user) return;
    const r = getLastWeekRange();
    setRange(r);

    if (!shouldShowReport(DISMISS_KEY)) { setLoading(false); return; }

    setLoading(true);
    try {
      const [cRes, wRes, prRes, wtRes] = await Promise.all([
        supabase.from('daily_checkins')
          .select('date, readiness_score, status, sleep_hours, resting_hr')
          .eq('user_id', user.id)
          .gte('date', r.start).lte('date', r.end),
        supabase.from('workout_sessions')
          .select('date, split, duration_min')
          .eq('user_id', user.id)
          .gte('date', r.start).lte('date', r.end),
        supabase.from('personal_records')
          .select('exercise_key, estimated_1rm, achieved_at')
          .eq('user_id', user.id)
          .gte('achieved_at', r.start + 'T00:00:00')
          .lte('achieved_at', r.end + 'T23:59:59'),
        supabase.from('weight_logs')
          .select('date, weight_kg')
          .eq('user_id', user.id)
          .gte('date', r.start).lte('date', r.end)
          .order('date', { ascending: true }),
      ]);

      const checkins  = cRes.data ?? [];
      const workouts  = wRes.data ?? [];
      const prs       = prRes.data ?? [];
      const weights   = wtRes.data ?? [];

      // Checkin stats
      const greenDays  = checkins.filter(c => c.status === 'Green').length;
      const yellowDays = checkins.filter(c => c.status === 'Yellow').length;
      const redDays    = checkins.filter(c => c.status === 'Red').length;
      const scores     = checkins.map(c => c.readiness_score).filter(Boolean) as number[];
      const sleepVals  = checkins.map(c => c.sleep_hours).filter(Boolean) as number[];
      const hrVals     = checkins.map(c => c.resting_hr).filter(Boolean) as number[];

      // PR display
      const exMap = Object.fromEntries(EXERCISE_DB.map(e => [e.key, e.name_en]));
      const newPRs = prs.map(pr => ({
        exercise: exMap[pr.exercise_key] ?? pr.exercise_key,
        weight:   Number(pr.estimated_1rm),
        prev:     null, // simplified — could load prev PR if needed
      })).slice(0, 3);

      // Unique splits
      const splits = [...new Set(workouts.map(w => w.split).filter(Boolean))];

      setData({
        checkinDays:  checkins.length,
        greenDays, yellowDays, redDays,
        avgScore:  scores.length   ? Math.round(scores.reduce((a,b) => a+b,0) / scores.length) : 0,
        avgSleep:  sleepVals.length ? Math.round((sleepVals.reduce((a,b) => a+b,0) / sleepVals.length) * 10) / 10 : 0,
        avgHR:     hrVals.length   ? Math.round(hrVals.reduce((a,b) => a+b,0) / hrVals.length) : 0,
        workoutCount: workouts.length,
        totalMinutes: workouts.reduce((s, w) => s + (w.duration_min ?? 0), 0),
        splits,
        newPRs,
        weightStart: weights.length ? Number(weights[0].weight_kg) : null,
        weightEnd:   weights.length ? Number(weights[weights.length-1].weight_kg) : null,
      });
      setVisible(true);
    } catch (err) {
      console.error('WeeklyReport load error:', err);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, range.start);
    setVisible(false);
  };

  if (loading || !data || !visible) return null;

  const headline = makeHeadline(data);
  const focus    = makeFocus(data);
  const grade    = getGrade(data);
  const weightDelta = data.weightStart && data.weightEnd
    ? Math.round((data.weightEnd - data.weightStart) * 10) / 10
    : null;
  const gPct = data.checkinDays > 0
    ? Math.round((data.greenDays / data.checkinDays) * 100)
    : 0;

  const stats = [
    { label: 'GREEN DAYS', value: `${gPct}%`, sub: `${data.greenDays}/${data.checkinDays} days`, color: 'hsl(77 100% 58%)' },
    { label: 'AVG SLEEP',  value: `${data.avgSleep}h`, sub: data.avgSleep >= 7.5 ? 'Optimal ✓' : 'Below target', color: data.avgSleep >= 7.5 ? 'hsl(77 100% 58%)' : 'hsl(38 88% 58%)' },
    { label: 'WORKOUTS',   value: `${data.workoutCount}`, sub: `${data.totalMinutes} min total`, color: 'hsl(245 100% 70%)' },
    {
      label: 'WEIGHT',
      value: weightDelta !== null ? `${weightDelta > 0 ? '+' : ''}${weightDelta}kg` : '—',
      sub: data.weightEnd ? `${data.weightEnd}kg now` : 'No logs',
      color: weightDelta !== null && weightDelta < 0 ? 'hsl(77 100% 58%)' : 'hsl(245 100% 70%)',
    },
  ];

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={dismiss}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 100, backdropFilter: 'blur(4px)' }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            style={{
              position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 101,
              maxWidth: 512, margin: '0 auto',
              background: '#0d0d1f',
              border: '1px solid #16162a',
              borderRadius: '20px 20px 0 0',
              maxHeight: '90dvh',
              overflowY: 'auto',
              paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
            }}
          >
            {/* Handle */}
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 4 }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: '#16162a' }} />
            </div>

            <div style={{ padding: '8px 20px 0' }}>

              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <p style={{ fontFamily: BC, fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#404070', marginBottom: 4 }}>
                    WEEKLY REPORT · {range.label}
                  </p>
                  <div style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: 20, background: `${grade.color}15`, border: `1px solid ${grade.color}40` }}>
                    <span style={{ fontFamily: BC, fontWeight: 800, fontSize: 13, letterSpacing: '0.06em', color: grade.color }}>
                      {grade.label}
                    </span>
                  </div>
                </div>
                <button onClick={dismiss}
                  style={{ width: 30, height: 30, borderRadius: '50%', background: '#111125', border: '1px solid #16162a', color: '#404070', fontSize: 14, cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  ×
                </button>
              </div>

              {/* Headline */}
              <h2 style={{ fontFamily: BC, fontWeight: 800, fontSize: 'clamp(20px,5vw,26px)', color: '#ffffff', letterSpacing: '0.01em', lineHeight: 1.1, textTransform: 'uppercase', marginBottom: 16 }}>
                {headline}
              </h2>

              {/* Key stats grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                {stats.map(({ label, value, sub, color }) => (
                  <div key={label} style={{ background: '#07070f', border: '1px solid #16162a', borderRadius: 12, padding: '11px 13px' }}>
                    <p style={{ fontFamily: BC, fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#2a2a50', marginBottom: 4 }}>{label}</p>
                    <p style={{ fontFamily: MONO, fontWeight: 700, fontSize: 22, color, letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</p>
                    <p style={{ fontFamily: BC, fontSize: 11, color: '#404070', marginTop: 3 }}>{sub}</p>
                  </div>
                ))}
              </div>

              {/* New PRs */}
              {data.newPRs.length > 0 && (
                <div style={{ background: 'rgba(186,255,41,0.06)', border: '1px solid rgba(186,255,41,0.2)', borderRadius: 12, padding: '12px 14px', marginBottom: 12 }}>
                  <p style={{ fontFamily: BC, fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'hsl(77 100% 58%)', marginBottom: 8 }}>
                    🏆 NEW PRs THIS WEEK
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {data.newPRs.map((pr, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontFamily: DM, fontSize: 13, color: '#c0c0e0' }}>{pr.exercise}</span>
                        <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700, color: 'hsl(77 100% 58%)' }}>
                          {pr.weight}kg
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Splits this week */}
              {data.splits.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                  {data.splits.map(s => (
                    <span key={s} style={{ fontFamily: BC, fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '3px 10px', borderRadius: 20, background: 'rgba(108,99,255,0.1)', border: '1px solid rgba(108,99,255,0.2)', color: 'hsl(245 100% 70%)' }}>
                      {s.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              )}

              {/* Focus next week */}
              <div style={{ borderTop: '1px solid #16162a', paddingTop: 12, marginBottom: 16 }}>
                <p style={{ fontFamily: BC, fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#404070', marginBottom: 8 }}>
                  FOCUS THIS WEEK
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {focus.map((tip, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'hsl(38 88% 58%)', flexShrink: 0, marginTop: 5 }} />
                      <p style={{ fontFamily: DM, fontSize: 13, color: '#c0c0e0', lineHeight: 1.6 }}>{tip}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <motion.button
                whileTap={{ scale: 0.97 }} onClick={dismiss}
                style={{
                  width: '100%', padding: '15px', borderRadius: 12, border: 'none',
                  background: 'hsl(77 100% 58%)', color: 'hsl(240 60% 3%)',
                  fontFamily: BC, fontWeight: 800, fontSize: 15,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  cursor: 'pointer', boxShadow: '0 4px 20px rgba(186,255,41,0.25)',
                }}>
                ⚡ LET'S GO THIS WEEK
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default WeeklyReport;

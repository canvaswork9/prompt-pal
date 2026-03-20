import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import SkeletonLoader from '@/components/SkeletonLoader';

/* ─────────────────────────────────────────
   LONGEVITY PAGE — Apex Dark
   Font sizes tuned for real mobile readability
───────────────────────────────────────── */

interface DayData {
  date: string;
  status: 'Green' | 'Yellow' | 'Red' | null;
  readiness_score: number | null;
  sleep_hours: number | null;
  resting_hr: number | null;
}

interface WorkoutDay { date: string; }

interface LongevityScore {
  total: number;
  grade: 'ELITE' | 'STRONG' | 'BUILDING' | 'STARTING' | 'NEW';
  greenRate: number;
  sleepScore: number;
  trainingRate: number;
  hrScore: number;
  greenDays: number;
  yellowDays: number;
  redDays: number;
  totalDays: number;
  avgSleep: number;
  avgHR: number;
  hrTrend: 'improving' | 'stable' | 'declining';
  sleepTrend: 'improving' | 'stable' | 'declining';
  greenTrend: 'improving' | 'stable' | 'declining';
  workoutsPerWeek: number;
  consecutiveRed: number;
}

interface Insight {
  type: 'positive' | 'warning' | 'info';
  text: string;
}

// ── Typography constants ──────────────────────────────────────
const BC = "'Barlow Condensed', sans-serif";
const MONO = "'JetBrains Mono', monospace";
const DM = "'DM Sans', sans-serif";

// Section title — e.g. "90-DAY READINESS MAP"
const SEC_LABEL: React.CSSProperties = {
  fontFamily: BC, fontSize: 13, fontWeight: 700,
  letterSpacing: '0.12em', textTransform: 'uppercase',
  color: '#404070', marginBottom: 12,
};

// Card stat label — e.g. "GREEN DAYS"
const STAT_LABEL: React.CSSProperties = {
  fontFamily: BC, fontSize: 12, fontWeight: 600,
  letterSpacing: '0.12em', textTransform: 'uppercase', color: '#404070',
};

// Trend / sub line — e.g. "↑ improving"
const TREND_LABEL: React.CSSProperties = {
  fontFamily: BC, fontSize: 12, fontWeight: 500,
  letterSpacing: '0.04em', marginTop: 3,
};

// Pillar row label
const PILLAR_LABEL: React.CSSProperties = {
  fontFamily: BC, fontSize: 13, fontWeight: 600,
  letterSpacing: '0.08em', textTransform: 'uppercase', color: '#606090',
};

// Pillar value
const PILLAR_VAL: React.CSSProperties = {
  fontFamily: MONO, fontSize: 14, fontWeight: 700, letterSpacing: '-0.01em',
};

// Body text — insights, coach
const BODY: React.CSSProperties = {
  fontFamily: DM, fontSize: 14, lineHeight: 1.65, color: '#c0c0e0',
};

// ── Score calculation ──────────────────────────────────────────
function calcLongevityScore(days: DayData[], workouts: WorkoutDay[]): LongevityScore {
  const checkinDays = days.filter(d => d.status !== null);
  const totalDays = checkinDays.length;

  if (totalDays < 3) {
    return {
      total: 0, grade: 'NEW',
      greenRate: 0, sleepScore: 0, trainingRate: 0, hrScore: 0,
      greenDays: 0, yellowDays: 0, redDays: 0, totalDays,
      avgSleep: 0, avgHR: 0,
      hrTrend: 'stable', sleepTrend: 'stable', greenTrend: 'stable',
      workoutsPerWeek: 0, consecutiveRed: 0,
    };
  }

  const greenDays  = checkinDays.filter(d => d.status === 'Green').length;
  const yellowDays = checkinDays.filter(d => d.status === 'Yellow').length;
  const redDays    = checkinDays.filter(d => d.status === 'Red').length;
  const greenRate  = Math.round((greenDays / totalDays) * 100);

  const sleepDays = checkinDays.filter(d => d.sleep_hours !== null);
  const avgSleep = sleepDays.length
    ? Math.round((sleepDays.reduce((s, d) => s + (d.sleep_hours ?? 0), 0) / sleepDays.length) * 10) / 10
    : 0;
  const sleepScore = avgSleep >= 7.5 ? 100 : avgSleep >= 7 ? 85 : avgSleep >= 6.5 ? 70 : avgSleep >= 6 ? 50 : 30;

  const weeks = Math.max(1, totalDays / 7);
  const workoutsPerWeek = Math.round((workouts.length / weeks) * 10) / 10;
  const trainingRate = Math.min(100, Math.round((workoutsPerWeek / 4) * 100));

  const hrDays = checkinDays.filter(d => d.resting_hr !== null);
  const avgHR = hrDays.length
    ? Math.round(hrDays.reduce((s, d) => s + (d.resting_hr ?? 0), 0) / hrDays.length)
    : 0;
  const hrScore = avgHR > 0
    ? avgHR <= 55 ? 100 : avgHR <= 60 ? 90 : avgHR <= 65 ? 80 : avgHR <= 70 ? 65 : avgHR <= 75 ? 50 : 35
    : 50;

  const total = Math.round(
    (greenRate * 0.40) + (sleepScore * 0.30) + (trainingRate * 0.20) + (hrScore * 0.10)
  );
  const grade = total >= 85 ? 'ELITE' : total >= 70 ? 'STRONG' : total >= 50 ? 'BUILDING' : 'STARTING';

  const mid = Math.floor(checkinDays.length / 2);
  const first = checkinDays.slice(0, mid);
  const second = checkinDays.slice(mid);

  const gF = first.filter(d => d.status === 'Green').length / Math.max(1, first.length);
  const gS = second.filter(d => d.status === 'Green').length / Math.max(1, second.length);
  const greenTrend: 'improving' | 'stable' | 'declining' =
    gS - gF > 0.1 ? 'improving' : gF - gS > 0.1 ? 'declining' : 'stable';

  const hrF = first.filter(d => d.resting_hr).reduce((s, d) => s + (d.resting_hr ?? 0), 0) / Math.max(1, first.filter(d => d.resting_hr).length);
  const hrS = second.filter(d => d.resting_hr).reduce((s, d) => s + (d.resting_hr ?? 0), 0) / Math.max(1, second.filter(d => d.resting_hr).length);
  const hrTrend: 'improving' | 'stable' | 'declining' =
    hrF - hrS > 2 ? 'improving' : hrS - hrF > 2 ? 'declining' : 'stable';

  const slF = first.filter(d => d.sleep_hours).reduce((s, d) => s + (d.sleep_hours ?? 0), 0) / Math.max(1, first.filter(d => d.sleep_hours).length);
  const slS = second.filter(d => d.sleep_hours).reduce((s, d) => s + (d.sleep_hours ?? 0), 0) / Math.max(1, second.filter(d => d.sleep_hours).length);
  const sleepTrend: 'improving' | 'stable' | 'declining' =
    slS - slF > 0.3 ? 'improving' : slF - slS > 0.3 ? 'declining' : 'stable';

  let maxRed = 0, curRed = 0;
  for (const d of checkinDays) {
    if (d.status === 'Red') { curRed++; maxRed = Math.max(maxRed, curRed); } else curRed = 0;
  }

  return {
    total, grade, greenRate, sleepScore, trainingRate, hrScore,
    greenDays, yellowDays, redDays, totalDays,
    avgSleep, avgHR, hrTrend, sleepTrend, greenTrend,
    workoutsPerWeek, consecutiveRed: maxRed,
  };
}

function generateInsights(score: LongevityScore): Insight[] {
  const ins: Insight[] = [];
  if (score.greenTrend === 'improving')
    ins.push({ type: 'positive', text: `Green day rate improving — momentum is building. Keep this consistency going.` });
  else if (score.greenTrend === 'declining')
    ins.push({ type: 'warning', text: `Green days declining recently. Focus on sleep and recovery to reverse the trend.` });
  if (score.sleepTrend === 'improving')
    ins.push({ type: 'positive', text: `Average sleep trending up ${score.avgSleep >= 7.5 ? '— you\'re hitting the optimal range' : '— keep pushing toward 7.5h'}. Sleep is your #1 recovery lever.` });
  else if (score.avgSleep < 6.5)
    ins.push({ type: 'warning', text: `Average sleep ${score.avgSleep}h is below optimal. Each hour under 7h reduces recovery significantly. Prioritize sleep above all.` });
  if (score.consecutiveRed >= 3)
    ins.push({ type: 'warning', text: `${score.consecutiveRed} consecutive Red days detected — overtraining signal. Mandatory rest and sleep focus needed now.` });
  if (score.hrTrend === 'improving')
    ins.push({ type: 'positive', text: `Resting HR trending down — cardiovascular fitness is improving. One of the strongest longevity markers.` });
  else if (score.hrTrend === 'declining')
    ins.push({ type: 'warning', text: `Resting HR trending up — may indicate accumulated fatigue or insufficient recovery.` });
  if (score.workoutsPerWeek < 3)
    ins.push({ type: 'info', text: `${score.workoutsPerWeek} workouts/week average. Target 4 sessions/week for optimal training consistency score.` });
  else if (score.workoutsPerWeek >= 5)
    ins.push({ type: 'positive', text: `${score.workoutsPerWeek} workouts/week — strong training consistency. Ensure rest days are truly restful.` });
  if (score.greenRate >= 70)
    ins.push({ type: 'positive', text: `${score.greenRate}% green days — top-tier readiness consistency. Athletes here show significantly better long-term health outcomes.` });
  return ins.slice(0, 4);
}

const GRADE_CONFIG = {
  ELITE:    { color: 'hsl(77 100% 58%)',  ring: 'hsl(77 100% 58%)',  glow: 'rgba(186,255,41,0.22)',  desc: 'Top-tier longevity consistency' },
  STRONG:   { color: 'hsl(245 100% 72%)', ring: 'hsl(245 100% 70%)', glow: 'rgba(108,99,255,0.2)',   desc: 'Consistent high performer' },
  BUILDING: { color: 'hsl(38 88% 58%)',   ring: 'hsl(38 88% 58%)',   glow: 'rgba(251,191,36,0.18)',  desc: 'Good foundation, keep going' },
  STARTING: { color: 'hsl(240 15% 60%)',  ring: 'hsl(240 15% 55%)',  glow: 'rgba(160,160,200,0.1)', desc: 'Early in your journey' },
  NEW:      { color: 'hsl(240 15% 40%)',  ring: 'hsl(240 35% 22%)',  glow: 'none',                   desc: 'Check in daily to unlock your score' },
};

const TREND_ICON = { improving: '↑', stable: '→', declining: '↓' } as const;
const TREND_COLOR = {
  improving: 'hsl(77 100% 58%)',
  stable:    'hsl(245 100% 70%)',
  declining: 'hsl(2 84% 60%)',
} as const;
const INSIGHT_DOT = {
  positive: 'hsl(77 100% 58%)',
  warning:  'hsl(38 88% 58%)',
  info:     'hsl(245 100% 70%)',
} as const;
const DOT_COLOR: Record<string, string> = {
  Green: 'hsl(77 100% 58%)', Yellow: 'hsl(38 88% 58%)',
  Red:   'hsl(2 84% 60%)',   null:   '#111125',
};

// ── Component ──────────────────────────────────────────────────
const LongevityPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading]     = useState(true);
  const [days, setDays]           = useState<DayData[]>([]);
  const [workouts, setWorkouts]   = useState<WorkoutDay[]>([]);
  const [coachMsg, setCoachMsg]   = useState('');
  const [coachLoading, setCoachLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const ago = new Date(); ago.setDate(ago.getDate() - 90);
    const since = ago.toISOString().slice(0, 10);

    const [cRes, wRes] = await Promise.all([
      supabase.from('daily_checkins')
        .select('date, status, readiness_score, sleep_hours, resting_hr')
        .eq('user_id', user.id).gte('date', since).order('date', { ascending: true }),
      supabase.from('workout_sessions')
        .select('date').eq('user_id', user.id).gte('date', since),
    ]);

    const map = new Map<string, DayData>();
    for (const c of cRes.data ?? [])
      map.set(c.date, { date: c.date, status: c.status as any, readiness_score: c.readiness_score, sleep_hours: c.sleep_hours, resting_hr: c.resting_hr });

    const allDays: DayData[] = [];
    for (let i = 89; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      allDays.push(map.get(key) ?? { date: key, status: null, readiness_score: null, sleep_hours: null, resting_hr: null });
    }

    setDays(allDays);
    setWorkouts((wRes.data ?? []).map(w => ({ date: w.date })));
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const loadCoach = useCallback(async (sc: LongevityScore) => {
    if (!user || sc.totalDays < 7) return;
    setCoachLoading(true);
    try {
      const prompt = `My 90-day longevity data: Score ${sc.total}/100 (${sc.grade}), Green days: ${sc.greenRate}%, Avg sleep: ${sc.avgSleep}h, Avg resting HR: ${sc.avgHR}bpm, Training: ${sc.workoutsPerWeek}/week, Sleep trend: ${sc.sleepTrend}, HR trend: ${sc.hrTrend}. Give me 3 specific, actionable recommendations to improve my longevity score over the next 30 days. Be direct and specific, no generic advice. Max 120 words.`;
      const session = (await supabase.auth.getSession()).data.session;
      const res = await fetch('/functions/v1/ai-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ messages: [{ role: 'user', content: prompt }], userId: user.id }),
      });
      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content ?? data?.message ?? '';
      if (text) setCoachMsg(text);
    } catch { setCoachMsg(''); }
    setCoachLoading(false);
  }, [user]);

  const score = calcLongevityScore(days, workouts);
  const insights = generateInsights(score);
  const gc = GRADE_CONFIG[score.grade];

  useEffect(() => {
    if (!loading && score.totalDays >= 7) loadCoach(score);
  }, [loading]); // eslint-disable-line

  if (loading) return <SkeletonLoader />;

  const R = 44, CIRC = 2 * Math.PI * R;
  const offset = CIRC - (score.total / 100) * CIRC;

  const pillars = [
    { label: 'GREEN DAYS', value: score.greenRate,    color: 'hsl(77 100% 58%)' },
    { label: 'SLEEP',      value: score.sleepScore,   color: 'hsl(245 100% 70%)' },
    { label: 'TRAINING',   value: score.trainingRate, color: 'hsl(38 88% 58%)' },
    { label: 'HEART RATE', value: score.hrScore,      color: 'hsl(158 70% 55%)' },
  ];

  return (
    <div className="min-h-screen max-w-lg mx-auto flex flex-col pb-28">
      <div className="px-4 sm:px-5 pt-4 sm:pt-5 space-y-4">

        {/* ── HEADER ── */}
        <div className="flex items-start justify-between">
          <div>
            <h1 style={{ fontFamily: BC, fontWeight: 800, fontSize: 'clamp(32px,9vw,48px)', letterSpacing: '0.01em', textTransform: 'uppercase', color: '#ffffff', lineHeight: 0.95 }}>
              Longevity
            </h1>
            <p style={{ fontFamily: BC, fontSize: 12, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#404070', marginTop: 5 }}>
              90-DAY CONSISTENCY REPORT
            </p>
          </div>
          <button onClick={() => navigate(-1)}
            style={{ fontFamily: BC, fontSize: 13, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#404070', marginTop: 4 }}>
            ← BACK
          </button>
        </div>

        {/* ── SCORE HERO ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-5 text-center"
          style={{ background: '#0d0d1f', border: `1px solid ${gc.ring}30`, boxShadow: score.grade !== 'NEW' ? `0 0 40px ${gc.glow}` : 'none' }}
        >
          <div className="flex justify-center mb-3">
            <svg width="148" height="148" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r={R} fill="none" stroke="#111125" strokeWidth="7" />
              {score.grade !== 'NEW' && (
                <motion.circle cx="50" cy="50" r={R}
                  fill="none" stroke={gc.ring} strokeWidth="7"
                  strokeLinecap="round" strokeDasharray={CIRC}
                  initial={{ strokeDashoffset: CIRC }}
                  animate={{ strokeDashoffset: offset }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                  transform="rotate(-90 50 50)"
                />
              )}
              {score.grade !== 'NEW' ? (
                <>
                  <text x="50" y="42" textAnchor="middle" fill="#ffffff"
                    style={{ fontFamily: BC, fontWeight: 800, fontSize: 26 }}>{score.total}</text>
                  <text x="50" y="52" textAnchor="middle" fill="#2a2a50" fontSize="6" letterSpacing="2">/ 100</text>
                  <text x="50" y="63" textAnchor="middle" fontSize="8" letterSpacing="2"
                    style={{ fontFamily: BC, fontWeight: 700, fill: gc.color }}>{score.grade}</text>
                </>
              ) : (
                <text x="50" y="55" textAnchor="middle" fill="#2a2a50" fontSize="7" letterSpacing="1">CHECK IN DAILY</text>
              )}
            </svg>
          </div>
          {/* Grade description */}
          <p style={{ fontFamily: BC, fontSize: 15, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: gc.color }}>
            {gc.desc}
          </p>
          <p style={{ fontFamily: BC, fontSize: 12, color: '#404070', marginTop: 4, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            BASED ON {score.totalDays} DAYS OF DATA
          </p>
        </motion.div>

        {/* ── 90-DAY DOT GRID ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="rounded-xl p-4"
          style={{ background: '#0d0d1f', border: '1px solid #16162a' }}
        >
          <p style={SEC_LABEL}>90-DAY READINESS MAP</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            {days.map((d, i) => (
              <div key={i} title={`${d.date}: ${d.status ?? 'No data'}`}
                style={{ width: 8, height: 8, borderRadius: 2, background: DOT_COLOR[d.status ?? 'null'], cursor: 'default' }} />
            ))}
          </div>
          {/* Legend */}
          <div style={{ display: 'flex', gap: 14, marginTop: 10, flexWrap: 'wrap' }}>
            {([['Green', 'hsl(77 100% 58%)'], ['Yellow', 'hsl(38 88% 58%)'], ['Red', 'hsl(2 84% 60%)'], ['No data', '#1e1e3a']] as [string, string][]).map(([label, color]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: color, flexShrink: 0 }} />
                <span style={{ fontFamily: BC, fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#606090' }}>{label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── BREAKDOWN STATS ── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <p style={{ ...SEC_LABEL, marginBottom: 10 }}>BREAKDOWN</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
            {/* Green days */}
            <div className="rounded-xl p-3.5" style={{ background: '#0d0d1f', border: '1px solid #16162a' }}>
              <p style={STAT_LABEL}>GREEN DAYS</p>
              <p style={{ fontFamily: MONO, fontWeight: 700, fontSize: 26, color: 'hsl(77 100% 58%)', letterSpacing: '-0.02em', marginTop: 4 }}>
                {score.greenRate}<span style={{ fontSize: 14 }}>%</span>
              </p>
              <p style={{ ...TREND_LABEL, color: TREND_COLOR[score.greenTrend] }}>
                {TREND_ICON[score.greenTrend]} {score.greenDays}G · {score.yellowDays}Y · {score.redDays}R
              </p>
            </div>
            {/* Avg sleep */}
            <div className="rounded-xl p-3.5" style={{ background: '#0d0d1f', border: '1px solid #16162a' }}>
              <p style={STAT_LABEL}>AVG SLEEP</p>
              <p style={{ fontFamily: MONO, fontWeight: 700, fontSize: 26, color: 'hsl(245 100% 70%)', letterSpacing: '-0.02em', marginTop: 4 }}>
                {score.avgSleep}<span style={{ fontSize: 14 }}>h</span>
              </p>
              <p style={{ ...TREND_LABEL, color: TREND_COLOR[score.sleepTrend] }}>
                {TREND_ICON[score.sleepTrend]} {score.sleepTrend}
              </p>
            </div>
            {/* Resting HR */}
            <div className="rounded-xl p-3.5" style={{ background: '#0d0d1f', border: '1px solid #16162a' }}>
              <p style={STAT_LABEL}>RESTING HR</p>
              <p style={{ fontFamily: MONO, fontWeight: 700, fontSize: 26, color: 'hsl(158 70% 55%)', letterSpacing: '-0.02em', marginTop: 4 }}>
                {score.avgHR > 0 ? <>{score.avgHR}<span style={{ fontSize: 14 }}>bpm</span></> : '—'}
              </p>
              <p style={{ ...TREND_LABEL, color: TREND_COLOR[score.hrTrend] }}>
                {TREND_ICON[score.hrTrend]} {score.hrTrend}
              </p>
            </div>
            {/* Training */}
            <div className="rounded-xl p-3.5" style={{ background: '#0d0d1f', border: '1px solid #16162a' }}>
              <p style={STAT_LABEL}>TRAINING</p>
              <p style={{ fontFamily: MONO, fontWeight: 700, fontSize: 26, color: 'hsl(38 88% 58%)', letterSpacing: '-0.02em', marginTop: 4 }}>
                {score.workoutsPerWeek}<span style={{ fontSize: 14 }}>/wk</span>
              </p>
              <p style={{ ...TREND_LABEL, color: '#404070' }}>target: 4 sessions</p>
            </div>
          </div>
        </motion.div>

        {/* ── SCORE PILLARS ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="rounded-xl p-4"
          style={{ background: '#0d0d1f', border: '1px solid #16162a' }}
        >
          <p style={SEC_LABEL}>SCORE PILLARS</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {pillars.map(({ label, value, color }) => (
              <div key={label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={PILLAR_LABEL}>{label}</span>
                  <span style={{ ...PILLAR_VAL, color }}>{value}</span>
                </div>
                <div style={{ height: 6, background: '#111125', borderRadius: 3, overflow: 'hidden' }}>
                  <motion.div
                    initial={{ width: 0 }} animate={{ width: `${value}%` }}
                    transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
                    style={{ height: 6, background: color, borderRadius: 3 }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p style={{ fontFamily: BC, fontSize: 11, color: '#2a2a50', marginTop: 12, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            WEIGHTED: GREEN 40% · SLEEP 30% · TRAINING 20% · HR 10%
          </p>
        </motion.div>

        {/* ── INSIGHTS ── */}
        {insights.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="rounded-xl p-4"
            style={{ background: '#0d0d1f', border: '1px solid #16162a' }}
          >
            <p style={SEC_LABEL}>INSIGHTS</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {insights.map((ins, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: INSIGHT_DOT[ins.type], flexShrink: 0, marginTop: 5 }} />
                  <p style={BODY}>{ins.text}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── AI LONGEVITY COACH ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="rounded-xl p-4"
          style={{ background: '#0d0d1f', border: '1px solid rgba(108,99,255,0.3)' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <p style={SEC_LABEL}>LONGEVITY COACH</p>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'hsl(245 100% 70%)', flexShrink: 0 }} />
          </div>

          {score.totalDays < 7 ? (
            <p style={{ ...BODY, color: '#404070' }}>
              Check in for at least 7 days to unlock personalized longevity coaching.
            </p>
          ) : coachLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[75, 55, 65].map((w, i) => (
                <div key={i} className="animate-pulse"
                  style={{ height: 12, background: '#111125', borderRadius: 6, width: `${w}%` }} />
              ))}
            </div>
          ) : coachMsg ? (
            <p style={BODY}>{coachMsg}</p>
          ) : (
            <button onClick={() => loadCoach(score)}
              style={{
                width: '100%', padding: '12px', borderRadius: 10, border: 'none',
                background: 'rgba(108,99,255,0.15)', color: 'hsl(245 100% 72%)',
                fontFamily: BC, fontWeight: 700, fontSize: 14,
                letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer',
              }}>
              GENERATE COACHING PLAN
            </button>
          )}
        </motion.div>

        {/* ── CTA ── */}
        <motion.button
          whileTap={{ scale: 0.97 }} onClick={() => navigate('/app')}
          style={{
            width: '100%', padding: '16px', borderRadius: 14, border: 'none',
            background: 'hsl(77 100% 58%)', color: 'hsl(240 60% 3%)',
            fontFamily: BC, fontWeight: 800, fontSize: 16,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            cursor: 'pointer', boxShadow: '0 4px 24px rgba(186,255,41,0.25)',
          }}>
          ⚡ LOG TODAY'S CHECK-IN
        </motion.button>

      </div>
    </div>
  );
};

export default LongevityPage;

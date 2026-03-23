// ─── Shared types, constants, and pure calculation functions for Longevity ───

export interface DayData {
  date: string;
  status: 'Green' | 'Yellow' | 'Red' | null;
  readiness_score: number | null;
  sleep_hours: number | null;
  resting_hr: number | null;
}

export interface WorkoutDay { date: string; }

export interface UserProfile { age: number | null; }

export interface BioAge {
  bioAge: number;
  chronAge: number;
  delta: number;
  label: 'YOUNGER' | 'ON TRACK' | 'OLDER';
  hrAdj: number;
  sleepAdj: number;
  greenAdj: number;
  trainAdj: number;
  bodyFatAdj: number;
  hasAge: boolean;
  hasBodyComp: boolean;
}

export interface LongevityScore {
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

export interface RecoveryDebt {
  score: number;
  level: 'RECOVERED' | 'MILD' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  recommendation: string;
  incidents: { date: string; type: 'red_workout' | 'yellow_workout' }[];
  trend: { date: string; debt: number }[];
  daysSinceHigh: number | null;
}

export interface Insight {
  type: 'positive' | 'warning' | 'info';
  text: string;
}

// ─── Typography constants ───
export const BC   = "'Barlow Condensed', sans-serif";
export const MONO = "'JetBrains Mono', monospace";
export const DM   = "'DM Sans', sans-serif";

export const SEC_LABEL: React.CSSProperties = {
  fontFamily: BC, fontSize: 13, fontWeight: 700,
  letterSpacing: '0.12em', textTransform: 'uppercase',
  color: '#404070', marginBottom: 12,
};
export const STAT_LABEL: React.CSSProperties = {
  fontFamily: BC, fontSize: 12, fontWeight: 600,
  letterSpacing: '0.12em', textTransform: 'uppercase', color: '#404070',
};
export const TREND_LABEL: React.CSSProperties = {
  fontFamily: BC, fontSize: 12, fontWeight: 500,
  letterSpacing: '0.04em', marginTop: 3,
};
export const PILLAR_LABEL: React.CSSProperties = {
  fontFamily: BC, fontSize: 13, fontWeight: 600,
  letterSpacing: '0.08em', textTransform: 'uppercase', color: '#606090',
};
export const PILLAR_VAL: React.CSSProperties = {
  fontFamily: MONO, fontSize: 14, fontWeight: 700, letterSpacing: '-0.01em',
};
export const BODY: React.CSSProperties = {
  fontFamily: DM, fontSize: 14, lineHeight: 1.65, color: '#c0c0e0',
};

export const GRADE_CONFIG = {
  ELITE:    { color: 'hsl(77 100% 58%)',  ring: 'hsl(77 100% 58%)',  glow: 'rgba(186,255,41,0.22)',  desc: 'Top-tier longevity consistency' },
  STRONG:   { color: 'hsl(245 100% 72%)', ring: 'hsl(245 100% 70%)', glow: 'rgba(108,99,255,0.2)',   desc: 'Consistent high performer' },
  BUILDING: { color: 'hsl(38 88% 58%)',   ring: 'hsl(38 88% 58%)',   glow: 'rgba(251,191,36,0.18)',  desc: 'Good foundation, keep going' },
  STARTING: { color: 'hsl(240 15% 60%)',  ring: 'hsl(240 15% 55%)',  glow: 'rgba(160,160,200,0.1)', desc: 'Early in your journey' },
  NEW:      { color: 'hsl(240 15% 40%)',  ring: 'hsl(240 35% 22%)',  glow: 'none',                   desc: 'Check in daily to unlock your score' },
};

export const DEBT_CONFIG = {
  RECOVERED: { color: 'hsl(77 100% 58%)',  bg: 'rgba(186,255,41,0.08)',  border: 'rgba(186,255,41,0.25)',  label: 'RECOVERED'  },
  MILD:      { color: 'hsl(245 100% 70%)', bg: 'rgba(108,99,255,0.08)', border: 'rgba(108,99,255,0.25)',  label: 'MILD DEBT'  },
  MODERATE:  { color: 'hsl(38 88% 58%)',   bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.25)',  label: 'MODERATE'   },
  HIGH:      { color: 'hsl(2 84% 60%)',    bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.25)',   label: 'HIGH DEBT'  },
  CRITICAL:  { color: 'hsl(0 100% 55%)',   bg: 'rgba(220,20,20,0.1)',   border: 'rgba(220,20,20,0.35)',   label: 'CRITICAL'   },
};

export const TREND_ICON  = { improving: '↑', stable: '→', declining: '↓' } as const;
export const TREND_COLOR = {
  improving: 'hsl(77 100% 58%)', stable: 'hsl(245 100% 70%)', declining: 'hsl(2 84% 60%)',
} as const;
export const INSIGHT_DOT = {
  positive: 'hsl(77 100% 58%)', warning: 'hsl(38 88% 58%)', info: 'hsl(245 100% 70%)',
} as const;
export const DOT_COLOR: Record<string, string> = {
  Green: 'hsl(77 100% 58%)', Yellow: 'hsl(38 88% 58%)',
  Red:   'hsl(2 84% 60%)',   null:   '#111125',
};

// ─── Pure calculation functions ───

export function calcLongevityScore(days: DayData[], workouts: WorkoutDay[]): LongevityScore {
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

  const sleepDays  = checkinDays.filter(d => d.sleep_hours !== null);
  const avgSleep   = sleepDays.length
    ? Math.round((sleepDays.reduce((s, d) => s + (d.sleep_hours ?? 0), 0) / sleepDays.length) * 10) / 10
    : 0;
  const sleepScore = avgSleep >= 7.5 ? 100 : avgSleep >= 7 ? 85 : avgSleep >= 6.5 ? 70 : avgSleep >= 6 ? 50 : 30;

  const weeks = Math.max(1, totalDays / 7);
  const workoutsPerWeek = Math.round((workouts.length / weeks) * 10) / 10;
  const trainingRate    = Math.min(100, Math.round((workoutsPerWeek / 4) * 100));

  const hrDays = checkinDays.filter(d => d.resting_hr !== null);
  const avgHR  = hrDays.length
    ? Math.round(hrDays.reduce((s, d) => s + (d.resting_hr ?? 0), 0) / hrDays.length)
    : 0;
  const hrScore = avgHR > 0
    ? avgHR <= 55 ? 100 : avgHR <= 60 ? 90 : avgHR <= 65 ? 80 : avgHR <= 70 ? 65 : avgHR <= 75 ? 50 : 35
    : 50;

  const total = Math.round((greenRate * 0.40) + (sleepScore * 0.30) + (trainingRate * 0.20) + (hrScore * 0.10));
  const grade = total >= 85 ? 'ELITE' : total >= 70 ? 'STRONG' : total >= 50 ? 'BUILDING' : 'STARTING';

  const mid    = Math.floor(checkinDays.length / 2);
  const first  = checkinDays.slice(0, mid);
  const second = checkinDays.slice(mid);

  const gF = first.filter(d => d.status === 'Green').length  / Math.max(1, first.length);
  const gS = second.filter(d => d.status === 'Green').length / Math.max(1, second.length);
  const greenTrend: LongevityScore['greenTrend'] = gS - gF > 0.1 ? 'improving' : gF - gS > 0.1 ? 'declining' : 'stable';

  const hrF = first.filter(d => d.resting_hr).reduce((s, d) => s + (d.resting_hr ?? 0), 0)  / Math.max(1, first.filter(d => d.resting_hr).length);
  const hrS = second.filter(d => d.resting_hr).reduce((s, d) => s + (d.resting_hr ?? 0), 0) / Math.max(1, second.filter(d => d.resting_hr).length);
  const hrTrend: LongevityScore['hrTrend'] = hrF - hrS > 2 ? 'improving' : hrS - hrF > 2 ? 'declining' : 'stable';

  const slF = first.filter(d => d.sleep_hours).reduce((s, d) => s + (d.sleep_hours ?? 0), 0)  / Math.max(1, first.filter(d => d.sleep_hours).length);
  const slS = second.filter(d => d.sleep_hours).reduce((s, d) => s + (d.sleep_hours ?? 0), 0) / Math.max(1, second.filter(d => d.sleep_hours).length);
  const sleepTrend: LongevityScore['sleepTrend'] = slS - slF > 0.3 ? 'improving' : slF - slS > 0.3 ? 'declining' : 'stable';

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

export function calcRecoveryDebt(days: DayData[], workouts: WorkoutDay[]): RecoveryDebt {
  const workoutDates = new Set(workouts.map(w => w.date));
  let debt = 0;
  const trend: { date: string; debt: number }[] = [];
  const incidents: { date: string; type: 'red_workout' | 'yellow_workout' }[] = [];

  for (const day of days) {
    if (!day.status) { trend.push({ date: day.date, debt: Math.round(debt) }); continue; }
    const trained = workoutDates.has(day.date);
    if      (day.status === 'Red'    && trained)  { debt = Math.min(100, debt + 20); incidents.push({ date: day.date, type: 'red_workout' }); }
    else if (day.status === 'Yellow' && trained)  { debt = Math.min(100, debt + 5);  incidents.push({ date: day.date, type: 'yellow_workout' }); }
    else if (day.status === 'Red'    && !trained) { debt = Math.max(0, debt - 15); }
    else if (day.status === 'Green')              { debt = Math.max(0, debt - 10); }
    trend.push({ date: day.date, debt: Math.round(debt) });
  }

  const score = Math.round(debt);
  const level = score <= 15 ? 'RECOVERED' : score <= 35 ? 'MILD' : score <= 60 ? 'MODERATE' : score <= 80 ? 'HIGH' : 'CRITICAL';
  const recommendation =
    level === 'RECOVERED' ? 'Body is fresh — train at full intensity.' :
    level === 'MILD'      ? 'Monitor closely. Avoid adding extra sessions this week.' :
    level === 'MODERATE'  ? 'Scale back intensity 20–30%. Prioritize sleep and nutrition.' :
    level === 'HIGH'      ? 'Deload week recommended. Reduce volume by 50%.' :
                            'Stop training. Full rest for 3–5 days minimum. See a professional if pain persists.';

  const recentHighIdx = [...trend].reverse().findIndex(t => t.debt > 60);
  const daysSinceHigh = recentHighIdx === -1 ? null : recentHighIdx;
  const redIncidents  = incidents.filter(i => i.type === 'red_workout').slice(-5);

  return { score, level, recommendation, incidents: redIncidents, trend: trend.slice(-30), daysSinceHigh };
}

export function calcBioAge(score: LongevityScore, chronAge: number | null, bodyFatPct?: number): BioAge {
  if (!chronAge || chronAge <= 0) {
    return { bioAge: 0, chronAge: 0, delta: 0, label: 'ON TRACK', hrAdj: 0, sleepAdj: 0, greenAdj: 0, trainAdj: 0, bodyFatAdj: 0, hasAge: false, hasBodyComp: false };
  }
  if (score.totalDays < 7) {
    return { bioAge: chronAge, chronAge, delta: 0, label: 'ON TRACK', hrAdj: 0, sleepAdj: 0, greenAdj: 0, trainAdj: 0, bodyFatAdj: 0, hasAge: true, hasBodyComp: false };
  }

  const hrAdj    = score.avgHR <= 0 ? 0 : score.avgHR < 55 ? -4 : score.avgHR < 60 ? -2 : score.avgHR < 65 ? 0 : score.avgHR < 70 ? +2 : score.avgHR < 76 ? +4 : +6;
  const sleepAdj = score.avgSleep <= 0 ? 0 : score.avgSleep >= 7.5 ? -2 : score.avgSleep >= 7.0 ? -1 : score.avgSleep >= 6.5 ? 0 : score.avgSleep >= 6.0 ? +2 : +4;
  const greenAdj = score.greenRate >= 70 ? -2 : score.greenRate >= 50 ? -1 : score.greenRate >= 30 ? 0 : +2;
  const trainAdj = score.workoutsPerWeek >= 4 ? -2 : score.workoutsPerWeek >= 3 ? -1 : score.workoutsPerWeek >= 2 ? 0 : +2;

  let bodyFatAdj = 0;
  const hasBodyComp = bodyFatPct !== undefined && bodyFatPct > 0;
  if (hasBodyComp && bodyFatPct !== undefined) {
    bodyFatAdj = bodyFatPct < 10 ? -3 : bodyFatPct < 15 ? -2 : bodyFatPct < 20 ? -1 : bodyFatPct < 25 ? 0 : bodyFatPct < 30 ? +2 : +4;
  }

  const totalAdj = hrAdj + sleepAdj + greenAdj + trainAdj + bodyFatAdj;
  const bioAge   = Math.max(18, chronAge + totalAdj);
  const delta    = bioAge - chronAge;
  const label    = delta <= -2 ? 'YOUNGER' : delta >= 3 ? 'OLDER' : 'ON TRACK';

  return { bioAge, chronAge, delta, label, hrAdj, sleepAdj, greenAdj, trainAdj, bodyFatAdj, hasAge: true, hasBodyComp };
}

export function generateInsights(score: LongevityScore): Insight[] {
  const ins: Insight[] = [];
  if (score.greenTrend === 'improving')  ins.push({ type: 'positive', text: `Green day rate improving — momentum is building. Keep this consistency going.` });
  else if (score.greenTrend === 'declining') ins.push({ type: 'warning', text: `Green days declining recently. Focus on sleep and recovery to reverse the trend.` });
  if (score.sleepTrend === 'improving')  ins.push({ type: 'positive', text: `Average sleep trending up ${score.avgSleep >= 7.5 ? '— you\'re hitting the optimal range' : '— keep pushing toward 7.5h'}. Sleep is your #1 recovery lever.` });
  else if (score.avgSleep < 6.5)         ins.push({ type: 'warning',  text: `Average sleep ${score.avgSleep}h is below optimal. Each hour under 7h reduces recovery significantly. Prioritize sleep above all.` });
  if (score.consecutiveRed >= 3)         ins.push({ type: 'warning',  text: `${score.consecutiveRed} consecutive Red days detected — overtraining signal. Mandatory rest and sleep focus needed now.` });
  if (score.hrTrend === 'improving')     ins.push({ type: 'positive', text: `Resting HR trending down — cardiovascular fitness is improving. One of the strongest longevity markers.` });
  else if (score.hrTrend === 'declining') ins.push({ type: 'warning', text: `Resting HR trending up — may indicate accumulated fatigue or insufficient recovery.` });
  if (score.workoutsPerWeek < 3)         ins.push({ type: 'info',     text: `${score.workoutsPerWeek} workouts/week average. Target 4 sessions/week for optimal training consistency score.` });
  else if (score.workoutsPerWeek >= 5)   ins.push({ type: 'positive', text: `${score.workoutsPerWeek} workouts/week — strong training consistency. Ensure rest days are truly restful.` });
  if (score.greenRate >= 70)             ins.push({ type: 'positive', text: `${score.greenRate}% green days — top-tier readiness consistency. Athletes here show significantly better long-term health outcomes.` });
  return ins.slice(0, 4);
}

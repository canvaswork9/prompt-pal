import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ScatterChart, Scatter, Cell, ZAxis } from 'recharts';
import { Button } from '@/components/ui/button';
import { useGamification } from '@/hooks/useGamification';
import XPBar from '@/components/XPBar';
import ChallengeCards from '@/components/ChallengeCards';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import SkeletonLoader from '@/components/SkeletonLoader';
import WeeklyReport from '@/components/WeeklyReport';

const ProgressPage = () => {
  const gam = useGamification();
  const [chartData, setChartData] = useState<{ day: number; score: number }[]>([]);
  const [prs, setPrs] = useState<{ exercise: string; est1rm: string; best: string; date: string }[]>([]);
  const [greenDays, setGreenDays] = useState(0);
  const [workoutCount, setWorkoutCount] = useState(0);
  const [heatmapData, setHeatmapData] = useState<Record<string, { status: string; score: number }>>({});
  const [sleepData, setSleepData] = useState<{ sleep: number; score: number; status: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }

        const eighty4DaysAgo = new Date();
        eighty4DaysAgo.setDate(eighty4DaysAgo.getDate() - 84);

        const [checkinsRes, prDataRes, countRes, heatmapRes, sleepRes] = await Promise.all([
          supabase.from('daily_checkins').select('date, readiness_score, status').eq('user_id', user.id).order('date', { ascending: true }).limit(30),
          supabase.from('personal_records').select('exercise_key, estimated_1rm, weight_kg, reps, achieved_at').eq('user_id', user.id).order('estimated_1rm', { ascending: false }).limit(5),
          supabase.from('workout_sessions').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('completed', true).eq('session_type', 'strength'),
          supabase.from('daily_checkins').select('date, status, readiness_score').eq('user_id', user.id).gte('date', eighty4DaysAgo.toISOString().slice(0, 10)),
          supabase.from('daily_checkins').select('sleep_hours, readiness_score, status').eq('user_id', user.id).not('readiness_score', 'is', null).order('date', { ascending: false }).limit(60),
        ]);

        if (checkinsRes.data?.length) {
          setChartData(checkinsRes.data.map((c, i) => ({ day: i + 1, score: c.readiness_score ?? 0 })));
          setGreenDays(checkinsRes.data.filter(c => c.status === 'Green').length);
        }

        if (prDataRes.data?.length) {
          setPrs(prDataRes.data.map(p => ({
            exercise: p.exercise_key,
            est1rm: `${p.estimated_1rm} kg`,
            best: `${p.weight_kg}kg × ${p.reps}`,
            date: p.achieved_at ? new Date(p.achieved_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '-',
          })));
        }

        setWorkoutCount(countRes.count ?? 0);

        if (heatmapRes.data) {
          const map: Record<string, { status: string; score: number }> = {};
          heatmapRes.data.forEach(d => { map[d.date] = { status: d.status || '', score: d.readiness_score || 0 }; });
          setHeatmapData(map);
        }

        if (sleepRes.data) {
          setSleepData(sleepRes.data.map(d => ({
            sleep: Number(d.sleep_hours),
            score: d.readiness_score || 0,
            status: d.status || '',
          })));
        }

        setLoading(false);
      } catch (err) {
        console.error('Failed to load progress stats:', err);
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) return <SkeletonLoader />;

  const stats = [
    { label: 'Level', value: `${gam.tierEmoji} ${gam.level}`, sub: gam.tierName },
    { label: 'Total XP', value: gam.totalXP.toLocaleString(), sub: 'earned' },
    { label: 'Streak', value: `${gam.streakDays} 🔥`, sub: `best: ${gam.longestStreak}` },
    { label: 'Badges', value: `${gam.badges.length}`, sub: 'earned' },
  ];

  const generateHeatmap = () => {
    const days: { date: string; status: string; score: number }[] = [];
    const today = new Date();
    for (let i = 83; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const data = heatmapData[dateStr];
      days.push({ date: dateStr, status: data?.status || '', score: data?.score || 0 });
    }
    return days;
  };

  const heatmapDays = generateHeatmap();
  const weeks: typeof heatmapDays[] = [];
  for (let i = 0; i < heatmapDays.length; i += 7) {
    weeks.push(heatmapDays.slice(i, i + 7));
  }

  const getHeatColor = (status: string) => {
    if (status === 'Green') return 'bg-accent';
    if (status === 'Yellow') return 'bg-status-yellow';
    if (status === 'Red') return 'bg-status-red';
    return 'bg-muted';
  };

  const getScatterColor = (status: string) => {
    if (status === 'Green') return 'hsl(var(--status-green))';
    if (status === 'Yellow') return 'hsl(var(--status-yellow))';
    return 'hsl(var(--status-red))';
  };

  const getSleepInsight = () => {
    if (sleepData.length < 5) return null;
    const good = sleepData.filter(d => d.sleep >= 7.5);
    const poor = sleepData.filter(d => d.sleep < 6);
    const avgGood = good.length > 0 ? Math.round(good.reduce((s, d) => s + d.score, 0) / good.length) : 0;
    const avgPoor = poor.length > 0 ? Math.round(poor.reduce((s, d) => s + d.score, 0) / poor.length) : 0;
    if (good.length > 0 && poor.length > 0) {
      return `On days you slept 7.5h+, your average score was ${avgGood} vs ${avgPoor} on less than 6h sleep.`;
    }
    return null;
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      <WeeklyReport />
      <h1 className="text-display text-2xl">Progress Dashboard</h1>

      {!gam.loading && (
        <XPBar totalXP={gam.totalXP} level={gam.level} streakDays={gam.streakDays} tierEmoji={gam.tierEmoji} tierName={gam.tierName} />
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="bg-card rounded-xl p-4 card-shadow text-center">
            <div className="text-xs text-muted-foreground uppercase">{s.label}</div>
            <div className="font-display text-2xl font-bold mt-1">{s.value}</div>
            <div className="text-[10px] text-muted-foreground">{s.sub}</div>
          </motion.div>
        ))}
      </div>

      <ChallengeCards streakDays={gam.streakDays} badges={gam.badges} greenDays={greenDays} workoutCount={workoutCount} />

      {chartData.length === 0 && !gam.loading && (
        <div className="bg-card rounded-2xl p-6 text-center card-shadow space-y-4">
          <div className="text-4xl">📈</div>
          <h3 className="font-semibold">No data yet</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Complete your first daily check-in to start tracking your readiness, streaks, and progress.
          </p>
          <Button variant="accent" className="w-full" onClick={() => window.location.href = '/app'}>
            Start today's check-in →
          </Button>
        </div>
      )}

      {chartData.length > 0 && (
        <div className="bg-card rounded-xl p-5 card-shadow">
          <h3 className="font-semibold mb-4">Readiness Timeline</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
              <YAxis domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, color: 'hsl(var(--foreground))' }} />
              <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Training Heatmap */}
      {Object.keys(heatmapData).length > 0 && (
        <div className="bg-card rounded-xl p-5 card-shadow">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">📅 Training Heatmap (12 weeks)</h3>
            <span className="text-[10px] text-muted-foreground lg:hidden">scroll →</span>
          </div>
          <div className="flex gap-1 overflow-x-auto">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-1">
                {week.map((day) => (
                  <div
                    key={day.date}
                    title={`${day.date}: ${day.score > 0 ? `Score ${day.score} (${day.status})` : 'No data'}`}
                    className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm cursor-pointer hover:ring-1 hover:ring-foreground/30 ${getHeatColor(day.status)}`}
                  />
                ))}
              </div>
            ))}
          </div>
          <div className="flex gap-3 mt-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm bg-muted" /> No data</span>
            <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm bg-status-red" /> Red</span>
            <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm bg-status-yellow" /> Yellow</span>
            <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm bg-accent" /> Green</span>
          </div>
        </div>
      )}

      {/* Sleep vs Score Scatter */}
      {sleepData.length > 5 && (
        <div className="bg-card rounded-xl p-5 card-shadow">
          <h3 className="font-semibold mb-4">😴 Sleep vs Readiness Score</h3>
          <ResponsiveContainer width="100%" height={200}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="sleep" name="Sleep" unit="h" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
              <YAxis dataKey="score" name="Score" domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
              <ZAxis range={[40, 40]} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, color: 'hsl(var(--foreground))' }} />
              <Scatter data={sleepData}>
                {sleepData.map((entry, index) => (
                  <Cell key={index} fill={getScatterColor(entry.status)} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
          {getSleepInsight() && (
            <p className="text-xs text-muted-foreground mt-3 bg-secondary rounded-lg p-3">
              💡 {getSleepInsight()}
            </p>
          )}
        </div>
      )}

      {/* Badges */}
      {gam.badges.length > 0 && (
        <div className="bg-card rounded-xl p-5 card-shadow">
          <h3 className="font-semibold mb-4">🏅 Badges</h3>
          <div className="flex flex-wrap gap-3">
            {gam.badges.map(b => (
              <motion.div key={b.badge_key} initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary text-sm">
                <span>🏅</span>
                <span>{b.badge_name}</span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Personal Records — card list */}
      {prs.length > 0 && (
        <div className="bg-card rounded-xl p-5 card-shadow">
          <h3 className="font-semibold mb-4">Personal Records</h3>
          <div className="space-y-0 divide-y divide-border/50">
            {prs.map(pr => (
              <div key={pr.exercise} className="flex items-center justify-between py-3">
                <div>
                  <div className="text-sm font-medium capitalize">
                    {pr.exercise.replace(/_/g, ' ')}
                  </div>
                  <div className="text-xs text-muted-foreground">{pr.date}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-mono font-semibold">{pr.est1rm}</div>
                  <div className="text-xs font-mono text-muted-foreground">{pr.best}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressPage;

import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useGamification } from '@/hooks/useGamification';
import XPBar from '@/components/XPBar';
import ChallengeCards from '@/components/ChallengeCards';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const ProgressPage = () => {
  const gam = useGamification();
  const [chartData, setChartData] = useState<{ day: number; score: number }[]>([]);
  const [prs, setPrs] = useState<{ exercise: string; est1rm: string; best: string; date: string }[]>([]);
  const [greenDays, setGreenDays] = useState(0);
  const [workoutCount, setWorkoutCount] = useState(0);

  useEffect(() => {
    async function loadStats() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load last 30 checkins
      const { data: checkins } = await supabase
        .from('daily_checkins')
        .select('date, readiness_score, status')
        .eq('user_id', user.id)
        .order('date', { ascending: true })
        .limit(30);

      if (checkins?.length) {
        setChartData(checkins.map((c, i) => ({ day: i + 1, score: c.readiness_score ?? 0 })));
        setGreenDays(checkins.filter(c => c.status === 'Green').length);
      }

      // Load PRs
      const { data: prData } = await supabase
        .from('personal_records')
        .select('exercise_key, estimated_1rm, weight_kg, reps, achieved_at')
        .eq('user_id', user.id)
        .order('estimated_1rm', { ascending: false })
        .limit(5);

      if (prData?.length) {
        setPrs(prData.map(p => ({
          exercise: p.exercise_key,
          est1rm: `${p.estimated_1rm} kg`,
          best: `${p.weight_kg}kg × ${p.reps}`,
          date: p.achieved_at ? new Date(p.achieved_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '-',
        })));
      }

      // Workout count
      const { count } = await supabase
        .from('workout_sessions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('completed', true);

      setWorkoutCount(count ?? 0);
    }
    loadStats();
  }, []);

  const stats = [
    { label: 'Level', value: `${gam.tierEmoji} ${gam.level}`, sub: gam.tierName },
    { label: 'Total XP', value: gam.totalXP.toLocaleString(), sub: 'earned' },
    { label: 'Streak', value: `${gam.streakDays} 🔥`, sub: `best: ${gam.longestStreak}` },
    { label: 'Badges', value: `${gam.badges.length}`, sub: 'earned' },
  ];

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      <h1 className="text-display text-2xl">Progress Dashboard</h1>

      {/* XP Bar */}
      {!gam.loading && (
        <XPBar totalXP={gam.totalXP} level={gam.level} streakDays={gam.streakDays} tierEmoji={gam.tierEmoji} tierName={gam.tierName} />
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="bg-card rounded-xl p-4 card-shadow text-center"
          >
            <div className="text-xs text-muted-foreground uppercase">{s.label}</div>
            <div className="font-display text-2xl font-bold mt-1">{s.value}</div>
            <div className="text-[10px] text-muted-foreground">{s.sub}</div>
          </motion.div>
        ))}
      </div>

      {/* Challenges */}
      <ChallengeCards
        streakDays={gam.streakDays}
        badges={gam.badges}
        greenDays={greenDays}
        workoutCount={workoutCount}
      />

      {/* Readiness Timeline */}
      {chartData.length > 0 && (
        <div className="bg-card rounded-xl p-5 card-shadow">
          <h3 className="font-semibold mb-4">Readiness Timeline</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
              <YAxis domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
              <Tooltip
                contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, color: 'hsl(var(--foreground))' }}
              />
              <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Badges Collection */}
      {gam.badges.length > 0 && (
        <div className="bg-card rounded-xl p-5 card-shadow">
          <h3 className="font-semibold mb-4">🏅 Badges</h3>
          <div className="flex flex-wrap gap-3">
            {gam.badges.map(b => (
              <motion.div
                key={b.badge_key}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary text-sm"
              >
                <span>🏅</span>
                <span>{b.badge_name}</span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Personal Records */}
      {prs.length > 0 && (
        <div className="bg-card rounded-xl p-5 card-shadow">
          <h3 className="font-semibold mb-4">Personal Records</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground text-xs uppercase border-b border-border">
                  <th className="text-left py-2">Exercise</th>
                  <th className="text-right py-2">Est. 1RM</th>
                  <th className="text-right py-2">Best Set</th>
                  <th className="text-right py-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {prs.map(pr => (
                  <tr key={pr.exercise} className="border-b border-border/50">
                    <td className="py-2 font-medium">{pr.exercise}</td>
                    <td className="py-2 text-right font-mono">{pr.est1rm}</td>
                    <td className="py-2 text-right font-mono text-muted-foreground">{pr.best}</td>
                    <td className="py-2 text-right text-muted-foreground">{pr.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressPage;

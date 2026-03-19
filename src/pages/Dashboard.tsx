import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/lib/i18n';
import { calculateCalorieTargets } from '@/lib/tdee';
import SkeletonLoader from '@/components/SkeletonLoader';

type Period = 'today' | '7days' | '30days';

const todayStr = () => new Date().toISOString().slice(0, 10);

const DashboardPage = () => {
  const { t } = useLanguage();
  const [period, setPeriod] = useState<Period>('7days');
  const [loading, setLoading] = useState(true);

  const [avgCalories, setAvgCalories] = useState(0);
  const [caloriesBurned, setCaloriesBurned] = useState(0);
  const [avgReadiness, setAvgReadiness] = useState(0);
  const [greenDaysCount, setGreenDaysCount] = useState(0);
  const [weightChange, setWeightChange] = useState(0);
  const [workoutCount, setWorkoutCount] = useState(0);
  const [calorieChart, setCalorieChart] = useState<{ date: string; eaten: number; burned: number }[]>([]);
  const [readinessChart, setReadinessChart] = useState<{ date: string; score: number }[]>([]);
  const [weightChart, setWeightChart] = useState<{ date: string; weight_kg: number }[]>([]);
  const [macroTotals, setMacroTotals] = useState({ protein: 0, carbs: 0, fat: 0 });
  const [tdeeTarget, setTdeeTarget] = useState<{ protein: number; carbs: number; fat: number; calories: number } | null>(null);
  const [sessions, setSessions] = useState<{ date: string; split: string; duration: number; score: number }[]>([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }

        const days = period === 'today' ? 1 : period === '7days' ? 7 : 30;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days + 1);
        const startStr = startDate.toISOString().slice(0, 10);

        const [{ data: profile }, { data: meals }, { data: checkins }, { data: workouts }, { data: weights }] = await Promise.all([
          supabase.from('user_profiles').select('weight_kg, height_cm, age, sex, activity_level, fitness_goal').eq('id', user.id).maybeSingle(),
          supabase.from('meal_logs').select('date, calories, protein_g, carbs_g, fat_g, eaten').eq('user_id', user.id).gte('date', startStr).eq('eaten', true),
          supabase.from('daily_checkins').select('date, readiness_score, status').eq('user_id', user.id).gte('date', startStr).order('date', { ascending: true }),
          supabase.from('workout_sessions').select('date, split, duration_min, readiness_score, completed').eq('user_id', user.id).gte('date', startStr).eq('completed', true),
          supabase.from('weight_logs').select('date, weight_kg').eq('user_id', user.id).gte('date', startStr).order('date', { ascending: true }),
        ]);

        // TDEE
        if (profile) {
          const targets = calculateCalorieTargets(
            Number(profile.weight_kg) || 70,
            (profile as any).height_cm || 170,
            (profile as any).age || 30,
            (profile as any).sex || 'other',
            ((profile as any).activity_level as any) || 'moderate',
            (profile.fitness_goal as any) || 'general'
          );
          setTdeeTarget({ protein: targets.proteinTarget, carbs: targets.carbTarget, fat: targets.fatTarget, calories: targets.calorieTarget });
        }

        // Meals
        const totalCal = meals?.reduce((s, m) => s + (m.calories || 0), 0) || 0;
        setAvgCalories(Math.round(totalCal / Math.max(days, 1)));
        setMacroTotals({
          protein: meals?.reduce((s, m) => s + Number(m.protein_g || 0), 0) || 0,
          carbs: meals?.reduce((s, m) => s + Number(m.carbs_g || 0), 0) || 0,
          fat: meals?.reduce((s, m) => s + Number(m.fat_g || 0), 0) || 0,
        });

        // Calorie chart by day
        const calByDay: Record<string, { eaten: number; burned: number }> = {};
        meals?.forEach(m => {
          if (!calByDay[m.date]) calByDay[m.date] = { eaten: 0, burned: 0 };
          calByDay[m.date].eaten += m.calories || 0;
        });
        workouts?.forEach(w => {
          if (!calByDay[w.date]) calByDay[w.date] = { eaten: 0, burned: 0 };
          calByDay[w.date].burned += (w.duration_min || 0) * 7;
        });
        setCalorieChart(Object.entries(calByDay).sort().map(([date, v]) => ({ date: date.slice(5), ...v })));

        // Workouts
        const totalBurned = workouts?.reduce((s, w) => s + (w.duration_min || 0) * 7, 0) || 0;
        setCaloriesBurned(totalBurned);
        setWorkoutCount(workouts?.length || 0);
        setSessions(workouts?.map(w => ({
          date: w.date,
          split: w.split || '-',
          duration: w.duration_min || 0,
          score: w.readiness_score || 0,
        })) || []);

        // Readiness
        if (checkins?.length) {
          const scores = checkins.filter(c => c.readiness_score).map(c => c.readiness_score!);
          setAvgReadiness(Math.round(scores.reduce((a, b) => a + b, 0) / scores.length));
          setGreenDaysCount(checkins.filter(c => c.status === 'Green').length);
          setReadinessChart(checkins.map(c => ({ date: c.date.slice(5), score: c.readiness_score || 0 })));
        }

        // Weight
        if (weights?.length) {
          setWeightChart(weights.map(w => ({ date: w.date.slice(5), weight_kg: Number(w.weight_kg) })));
          if (weights.length >= 2) {
            setWeightChange(Number(weights[weights.length - 1].weight_kg) - Number(weights[0].weight_kg));
          }
        }

        setLoading(false);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
        setLoading(false);
      }
    }
    load();
  }, [period]);

  if (loading) return <SkeletonLoader />;

  // Empty state — no data yet
  const hasAnyData = avgCalories > 0 || workoutCount > 0 || readinessChart.length > 0 || weightChart.length > 0;
  if (!hasAnyData) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <h1 className="text-display text-2xl mb-8">{t('dashboard')}</h1>
        <div className="bg-card rounded-2xl p-8 card-shadow text-center space-y-6">
          <div className="text-5xl">📊</div>
          <div>
            <h2 className="font-semibold text-lg mb-2">Your dashboard will fill up as you use the app</h2>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Log 3 days of check-ins, meals, and workouts to unlock your full summary.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left max-w-lg mx-auto">
            {[
              { icon: '⚡', label: 'Daily Check-in', desc: 'Log sleep, HR & soreness', path: '/app' },
              { icon: '🏋️', label: 'Log Workout', desc: 'Track sets & reps', path: '/log' },
              { icon: '🍽️', label: 'Log Meals', desc: 'Mark what you ate', path: '/meal' },
            ].map(item => (
              <button
                key={item.path}
                onClick={() => window.location.href = item.path}
                className="flex items-start gap-3 bg-secondary rounded-xl p-3 hover:bg-secondary/80 transition-colors text-left"
              >
                <span className="text-xl">{item.icon}</span>
                <div>
                  <div className="text-sm font-medium">{item.label}</div>
                  <div className="text-xs text-muted-foreground">{item.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const netCalories = avgCalories - Math.round(caloriesBurned / (period === 'today' ? 1 : period === '7days' ? 7 : 30));
  const periodDays = period === 'today' ? 1 : period === '7days' ? 7 : 30;

  const statCards = [
    { label: 'Avg Calories In', value: `${avgCalories}`, sub: 'kcal/day' },
    { label: 'Calories Burned', value: `${caloriesBurned}`, sub: 'total kcal' },
    { label: 'Net Calories', value: `${netCalories}`, sub: 'avg/day' },
    { label: 'Avg Readiness', value: `${avgReadiness}`, sub: `${greenDaysCount} green days` },
    { label: 'Weight Change', value: `${weightChange > 0 ? '+' : ''}${weightChange.toFixed(1)} kg`, sub: '' },
    { label: 'Workouts', value: `${workoutCount}`, sub: 'completed' },
  ];

  const macroPercent = (consumed: number, target: number) => {
    if (target === 0) return 0;
    return Math.round((consumed / (target * periodDays)) * 100);
  };

  const macroColor = (pct: number) => {
    if (pct >= 90 && pct <= 110) return 'bg-status-green';
    if (pct >= 75 && pct < 90) return 'bg-status-yellow';
    return 'bg-status-red';
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-display text-2xl">{t('dashboard')}</h1>
        <div className="flex gap-1">
          {(['today', '7days', '30days'] as Period[]).map(p => (
            <Button key={p} variant={period === p ? 'default' : 'outline'} size="sm" onClick={() => setPeriod(p)} className="text-xs">
              {p === 'today' ? 'Today' : p === '7days' ? '7 Days' : '30 Days'}
            </Button>
          ))}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {statCards.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-card rounded-xl p-4 card-shadow text-center">
            <div className="text-[10px] text-muted-foreground uppercase">{s.label}</div>
            <div className="font-mono font-bold text-lg mt-1">{s.value}</div>
            {s.sub && <div className="text-[10px] text-muted-foreground">{s.sub}</div>}
          </motion.div>
        ))}
      </div>

      {/* Calorie Balance */}
      {calorieChart.length > 0 && (
        <div className="bg-card rounded-xl p-5 card-shadow">
          <h3 className="font-semibold mb-4">Calorie Balance</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={calorieChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
              <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, color: 'hsl(var(--foreground))' }} />
              <Bar dataKey="eaten" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Eaten" />
              <Bar dataKey="burned" fill="hsl(var(--status-green))" radius={[4, 4, 0, 0]} name="Burned" />
              {tdeeTarget && (
                <ReferenceLine y={tdeeTarget.calories} stroke="hsl(var(--accent))" strokeDasharray="5 5" label={{ value: `Target: ${tdeeTarget.calories}`, fill: 'hsl(var(--accent))', fontSize: 10 }} />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Weight Trend (only for 7 or 30 days) */}
      {period !== 'today' && weightChart.length > 1 && (
        <div className="bg-card rounded-xl p-5 card-shadow">
          <h3 className="font-semibold mb-4">Weight Trend</h3>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={weightChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
              <YAxis domain={['auto', 'auto']} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, color: 'hsl(var(--foreground))' }} />
              <Line type="monotone" dataKey="weight_kg" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Readiness Trend */}
      {readinessChart.length > 0 && (
        <div className="bg-card rounded-xl p-5 card-shadow">
          <h3 className="font-semibold mb-4">Readiness Trend</h3>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={readinessChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
              <YAxis domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, color: 'hsl(var(--foreground))' }} />
              <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              <ReferenceLine y={70} stroke="hsl(var(--status-green))" strokeDasharray="3 3" />
              <ReferenceLine y={45} stroke="hsl(var(--status-yellow))" strokeDasharray="3 3" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Workout Sessions */}
      {sessions.length > 0 && (
        <div className="bg-card rounded-xl p-5 card-shadow">
          <h3 className="font-semibold mb-4">Workout Sessions</h3>
          <div className="space-y-0 divide-y divide-border/50">
            {sessions.map((s, i) => (
              <div key={i} className="flex items-center justify-between py-3">
                <div>
                  <div className="text-sm font-medium capitalize">{s.split.replace(/_/g, ' ')}</div>
                  <div className="text-xs text-muted-foreground">{s.date}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-mono">{s.duration} min</div>
                  {s.score > 0 && <div className="text-xs text-muted-foreground">Score: {s.score}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Macro Progress */}
      {tdeeTarget && (
        <div className="bg-card rounded-xl p-5 card-shadow space-y-4">
          <h3 className="font-semibold">Macro Progress ({period === 'today' ? 'Today' : period === '7days' ? '7 Days' : '30 Days'})</h3>
          {[
            { label: 'Protein', consumed: macroTotals.protein, target: tdeeTarget.protein },
            { label: 'Carbs', consumed: macroTotals.carbs, target: tdeeTarget.carbs },
            { label: 'Fat', consumed: macroTotals.fat, target: tdeeTarget.fat },
          ].map(m => {
            const pct = macroPercent(m.consumed, m.target);
            return (
              <div key={m.label} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{m.label}</span>
                  <span className="font-mono">{Math.round(m.consumed)}g / {m.target * periodDays}g ({pct}%)</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${macroColor(pct)}`} style={{ width: `${Math.min(100, pct)}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DashboardPage;

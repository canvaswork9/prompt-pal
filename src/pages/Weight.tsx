import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLanguage } from '@/lib/i18n';
import { calculateCalorieTargets, weeksToGoal, isOnTrack, calculateVolumeCalories } from '@/lib/tdee';
import type { CalorieTargets } from '@/lib/tdee';
import SkeletonLoader from '@/components/SkeletonLoader';
import { useNavigate } from 'react-router-dom';

const todayStr = () => new Date().toISOString().slice(0, 10);

interface WeightEntry {
  date: string;
  weight_kg: number;
}

interface WeightGoal {
  id: string;
  goal_type: string;
  start_weight_kg: number;
  target_weight_kg: number;
  weekly_target_kg: number;
  start_date: string;
  is_active: boolean;
}

const WeightPage = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [currentWeight, setCurrentWeight] = useState(70);
  const [loggedToday, setLoggedToday] = useState(false);
  const [weightHistory, setWeightHistory] = useState<WeightEntry[]>([]);
  const [goal, setGoal] = useState<WeightGoal | null>(null);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [goalType, setGoalType] = useState<'lose' | 'maintain' | 'gain'>('lose');
  const [targetWeight, setTargetWeight] = useState(65);
  const [weeklyRate, setWeeklyRate] = useState(0.5);
  const [saving, setSaving] = useState(false);
  const [tdeeTargets, setTdeeTargets] = useState<CalorieTargets | null>(null);
  const [todayCaloriesIn, setTodayCaloriesIn] = useState(0);
  const [todayCaloriesBurned, setTodayCaloriesBurned] = useState(0);
  const [profileInfo, setProfileInfo] = useState({ weight: 70, height: 170, age: 30, sex: 'other', activity: 'moderate', goal: 'general' });

  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }

        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        const [{ data: profile }, { data: history }, { data: activeGoal }, { data: todayLog }, { data: todayMeals }, { data: todaySessions }] = await Promise.all([
          supabase.from('user_profiles').select('weight_kg, height_cm, age, sex, activity_level, fitness_goal').eq('id', user.id).maybeSingle(),
          supabase.from('weight_logs').select('date, weight_kg').eq('user_id', user.id).gte('date', ninetyDaysAgo.toISOString().slice(0, 10)).order('date', { ascending: true }),
          supabase.from('weight_goals').select('*').eq('user_id', user.id).eq('is_active', true).maybeSingle(),
          supabase.from('weight_logs').select('id').eq('user_id', user.id).eq('date', todayStr()).maybeSingle(),
          supabase.from('meal_logs').select('calories').eq('user_id', user.id).eq('date', todayStr()).eq('eaten', true),
          supabase.from('workout_sessions').select('id, duration_min, split').eq('user_id', user.id).eq('date', todayStr()),
        ]);

        // Fetch exercise_sets for today's sessions — volume-based calorie calculation
        const todaySessionIds = todaySessions?.map((s: any) => s.id).filter(Boolean) || [];
        const { data: todaySets } = todaySessionIds.length > 0
          ? await supabase.from('exercise_sets')
              .select('session_id, weight_kg, reps, is_warmup')
              .in('session_id', todaySessionIds)
          : { data: [] as any[] };

        if (profile) {
          const w = Number(profile.weight_kg) || 70;
          setCurrentWeight(w);
          const info = {
            weight: w,
            height: (profile as any).height_cm || 170,
            age: (profile as any).age || 30,
            sex: (profile as any).sex || 'other',
            activity: (profile as any).activity_level || 'moderate',
            goal: profile.fitness_goal || 'general',
          };
          setProfileInfo(info);
          const targets = calculateCalorieTargets(info.weight, info.height, info.age, info.sex, info.activity as any, info.goal as any);
          setTdeeTargets(targets);

          // Today's real calories IN — from marked meals
          const calsIn = todayMeals?.reduce((s: number, m: any) => s + (m.calories || 0), 0) || 0;
          setTodayCaloriesIn(calsIn);

          // Today's real calories BURNED — BMR + volume-based workout
          const bmrToday = targets.bmr;
          const workoutVolumeCals = calculateVolumeCalories(todaySets || []);
          setTodayCaloriesBurned(bmrToday + workoutVolumeCals);
        }

        if (history?.length) {
          setWeightHistory(history.map(h => ({ date: h.date, weight_kg: Number(h.weight_kg) })));
          const latest = history[history.length - 1];
          setCurrentWeight(Number(latest.weight_kg));
        }

        if (activeGoal) {
          setGoal(activeGoal as any);
          setGoalType((activeGoal as any).goal_type);
          setTargetWeight(Number((activeGoal as any).target_weight_kg));
          setWeeklyRate(Math.abs(Number((activeGoal as any).weekly_target_kg)));
        }

        setLoggedToday(!!todayLog);
        setLoading(false);
      } catch (err) {
        console.error('Failed to load weight data:', err);
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleLogWeight = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not logged in');

      const { error: upsertError } = await supabase.from('weight_logs').upsert({
        user_id: user.id,
        date: todayStr(),
        weight_kg: currentWeight,
        source: 'manual',
      }, { onConflict: 'user_id,date' });

      if (upsertError) throw upsertError;

      const { error: profileError } = await supabase.from('user_profiles').update({
        weight_kg: currentWeight,
        updated_at: new Date().toISOString(),
      }).eq('id', user.id);

      if (profileError) throw profileError;

      // Reload history so chart updates immediately
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      const { data: freshHistory } = await supabase
        .from('weight_logs')
        .select('date, weight_kg')
        .eq('user_id', user.id)
        .gte('date', ninetyDaysAgo.toISOString().slice(0, 10))
        .order('date', { ascending: true });

      if (freshHistory?.length) {
        setWeightHistory(freshHistory.map(h => ({ date: h.date, weight_kg: Number(h.weight_kg) })));
      }

      setLoggedToday(true);
      toast.success('Weight logged!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to log weight');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveGoal = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not logged in');

      // Deactivate existing goals
      const { error: deactivateError } = await supabase
        .from('weight_goals')
        .update({ is_active: false })
        .eq('user_id', user.id)
        .eq('is_active', true);
      if (deactivateError) throw deactivateError;

      const weeklyTarget = goalType === 'lose' ? -weeklyRate : goalType === 'gain' ? weeklyRate : 0;

      const { data: newGoal, error } = await supabase.from('weight_goals').insert({
        user_id: user.id,
        goal_type: goalType,
        start_weight_kg: currentWeight,
        target_weight_kg: targetWeight,
        weekly_target_kg: weeklyTarget,
        start_date: todayStr(),
        is_active: true,
      } as any).select().single();

      if (error) throw error;
      setGoal(newGoal as any);
      setShowGoalForm(false);
      toast.success('Goal saved!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save goal');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <SkeletonLoader />;

  // Stats
  const weekAgo = weightHistory.filter(w => {
    const d = new Date(w.date);
    const now = new Date();
    return (now.getTime() - d.getTime()) <= 7 * 86400000;
  });
  const weekChange = weekAgo.length >= 2 ? weekAgo[weekAgo.length - 1].weight_kg - weekAgo[0].weight_kg : 0;

  const trackStatus = goal ? isOnTrack(goal.start_weight_kg, currentWeight, goal.start_date, goal.weekly_target_kg) : null;
  const weeksEstimate = goal ? weeksToGoal(currentWeight, goal.target_weight_kg, goal.weekly_target_kg) : null;

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6">
      <h1 className="text-display text-2xl">{t('weight')}</h1>

      {/* Today's Entry */}
      <div className="bg-card rounded-xl p-5 card-shadow space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Log Today's Weight</h2>
          {loggedToday && <span className="text-xs text-status-green font-medium bg-status-green/10 px-2 py-1 rounded-full">✓ Logged today</span>}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Slider value={[currentWeight]} onValueChange={v => setCurrentWeight(v[0])} min={30} max={200} step={0.1} />
          </div>
          <Input
            type="number"
            value={currentWeight}
            onChange={e => setCurrentWeight(+e.target.value)}
            className="w-24 text-center font-mono bg-secondary"
            step={0.1}
          />
          <span className="text-sm text-muted-foreground">kg</span>
        </div>
        <Button variant="accent" onClick={handleLogWeight} disabled={saving}>
          {saving ? 'Saving...' : loggedToday ? 'Update Weight' : 'Log Weight'}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl p-4 card-shadow text-center">
          <div className="text-xs text-muted-foreground uppercase">Current</div>
          <div className="font-mono font-bold text-xl mt-1">{currentWeight} kg</div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="bg-card rounded-xl p-4 card-shadow text-center">
          <div className="text-xs text-muted-foreground uppercase">This Week</div>
          <div className={`font-mono font-bold text-xl mt-1 ${
            weekChange === 0 ? 'text-muted-foreground' :
            (goal?.goal_type === 'lose' && weekChange < 0) || (goal?.goal_type === 'gain' && weekChange > 0) ? 'text-status-green' : 'text-status-red'
          }`}>
            {weekChange > 0 ? '+' : ''}{weekChange.toFixed(1)} kg
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} className="bg-card rounded-xl p-4 card-shadow text-center">
          <div className="text-xs text-muted-foreground uppercase">Status</div>
          <div className={`font-bold text-sm mt-2 ${trackStatus?.onTrack ? 'text-status-green' : 'text-status-red'}`}>
            {goal ? (trackStatus?.onTrack ? t('on_track') : t('off_track')) : '—'}
          </div>
        </motion.div>
      </div>

      {/* Weight Chart */}
      {weightHistory.length === 0 && (
        <div className="bg-card rounded-xl p-5 card-shadow text-center space-y-2">
          <p className="text-2xl">⚖️</p>
          <p className="font-semibold text-sm">No weight data yet</p>
          <p className="text-xs text-muted-foreground">Log your weight above — the trend chart will appear after your first entry.</p>
        </div>
      )}
      {weightHistory.length === 1 && (
        <div className="bg-card rounded-xl p-5 card-shadow text-center space-y-1">
          <p className="text-xs text-muted-foreground">Log at least 2 entries to see your trend chart.</p>
        </div>
      )}
      {weightHistory.length > 1 && (
        <div className="bg-card rounded-xl p-5 card-shadow">
          <h3 className="font-semibold mb-4">Weight Trend (90 days)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={weightHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tickFormatter={d => d.slice(5)} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
              <YAxis domain={['auto', 'auto']} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, color: 'hsl(var(--foreground))' }} />
              <Line type="monotone" dataKey="weight_kg" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 2 }} />
              {goal && (
                <ReferenceLine y={Number(goal.target_weight_kg)} stroke="hsl(var(--status-green))" strokeDasharray="5 5" label={{ value: `Goal: ${goal.target_weight_kg}kg`, fill: 'hsl(var(--status-green))', fontSize: 10 }} />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Goal Settings */}
      <div className="bg-card rounded-xl p-5 card-shadow space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Weight Goal</h3>
          <Button variant="outline" size="sm" onClick={() => setShowGoalForm(!showGoalForm)}>
            {goal ? 'Edit Goal' : '+ Set Goal'}
          </Button>
        </div>

        {goal && !showGoalForm && (
          <div className="text-sm space-y-1">
            <p>Target: <span className="font-mono font-semibold">{goal.target_weight_kg} kg</span> ({goal.goal_type})</p>
            <p>Rate: <span className="font-mono">{Math.abs(goal.weekly_target_kg)} kg/week</span></p>
            {weeksEstimate && <p>Estimated: <span className="font-mono">~{weeksEstimate} weeks</span> to goal</p>}
          </div>
        )}

        {showGoalForm && (
          <div className="space-y-4 pt-2">
            <div className="flex gap-2">
              {[
                { key: 'lose' as const, icon: '🔻', label: 'Lose' },
                { key: 'maintain' as const, icon: '⚖️', label: 'Maintain' },
                { key: 'gain' as const, icon: '📈', label: 'Gain' },
              ].map(opt => (
                <Button
                  key={opt.key}
                  variant={goalType === opt.key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setGoalType(opt.key)}
                  className="flex-1"
                >
                  {opt.icon} {opt.label}
                </Button>
              ))}
            </div>

            {goalType !== 'maintain' && (
              <>
                <div>
                  <label className="text-sm text-muted-foreground block mb-1">Target Weight: <span className="font-mono text-primary">{targetWeight} kg</span></label>
                  <Slider value={[targetWeight]} onValueChange={v => setTargetWeight(v[0])} min={30} max={200} step={0.5} />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground block mb-1">Weekly Rate: <span className="font-mono text-primary">{weeklyRate} kg/week</span></label>
                  <Slider value={[weeklyRate]} onValueChange={v => setWeeklyRate(v[0])} min={0.1} max={1.0} step={0.1} />
                </div>
                {(() => {
                  const wk = goalType === 'lose' ? -weeklyRate : weeklyRate;
                  const est = weeksToGoal(currentWeight, targetWeight, wk);
                  return est ? (
                    <p className="text-xs text-muted-foreground bg-secondary rounded-lg px-3 py-2">
                      At this rate: ~{est} weeks to goal
                    </p>
                  ) : null;
                })()}
              </>
            )}

            <div className="flex gap-2">
              <Button variant="accent" onClick={handleSaveGoal} disabled={saving} className="flex-1">
                {saving ? 'Saving...' : 'Save Goal'}
              </Button>
              <Button variant="outline" onClick={() => setShowGoalForm(false)}>Cancel</Button>
            </div>
          </div>
        )}
      </div>

      {/* TDEE Summary */}
      {tdeeTargets && (
        <div className="bg-card rounded-xl p-5 card-shadow space-y-3">
          <h3 className="font-semibold">{t('tdee')}</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-muted-foreground">TDEE:</span> <span className="font-mono font-semibold">{tdeeTargets.tdee} kcal</span></div>
            <div><span className="text-muted-foreground">BMR:</span> <span className="font-mono font-semibold">{tdeeTargets.bmr} kcal</span></div>
            <div><span className="text-muted-foreground">Target:</span> <span className="font-mono font-semibold">{tdeeTargets.calorieTarget} kcal/day</span></div>
            <div>
              <span className="text-muted-foreground">Remaining today: </span>
              {todayCaloriesIn > 0 ? (() => {
                const remaining = (tdeeTargets?.calorieTarget ?? 0) - todayCaloriesIn;
                const color = remaining < -200
                  ? 'text-status-red'       // over target
                  : remaining < 200
                  ? 'text-status-yellow'    // on target ±200
                  : 'text-status-green';    // still under
                return (
                  <span className={`font-mono font-semibold ${color}`}>
                    {remaining >= 0 ? `${remaining} left` : `${Math.abs(remaining)} over`} kcal
                  </span>
                );
              })() : (
                <span className="font-mono font-semibold text-muted-foreground">— kcal</span>
              )}
            </div>
          </div>
          {/* Today's breakdown */}
          {todayCaloriesIn > 0 && (
            <div className="bg-secondary rounded-lg px-3 py-2 text-xs text-muted-foreground space-y-1.5">
              <div className="flex justify-between">
                <span>Eaten today</span>
                <span className="font-mono text-foreground">{todayCaloriesIn} kcal</span>
              </div>
              <div className="flex justify-between">
                <span>Daily target</span>
                <span className="font-mono text-foreground">{tdeeTargets?.calorieTarget ?? 0} kcal</span>
              </div>
              {todayCaloriesBurned > tdeeTargets?.bmr && (
                <div className="flex justify-between text-status-green">
                  <span>Workout bonus</span>
                  <span className="font-mono">+{todayCaloriesBurned - (tdeeTargets?.bmr ?? 0)} kcal budget</span>
                </div>
              )}
              <div className="h-px bg-border/50" />
              <div className="flex justify-between font-medium">
                <span>{(tdeeTargets?.calorieTarget ?? 0) - todayCaloriesIn >= 0 ? 'Remaining' : 'Over by'}</span>
                <span className={`font-mono ${(tdeeTargets?.calorieTarget ?? 0) - todayCaloriesIn < -200 ? 'text-status-red' : 'text-status-green'}`}>
                  {Math.abs((tdeeTargets?.calorieTarget ?? 0) - todayCaloriesIn)} kcal
                </span>
              </div>
            </div>
          )}
          <div className="text-sm">
            <span className="text-muted-foreground">Macros:</span>{' '}
            <span className="font-mono">P: {tdeeTargets.proteinTarget}g · C: {tdeeTargets.carbTarget}g · F: {tdeeTargets.fatTarget}g</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Based on: {profileInfo.weight}kg · {profileInfo.height}cm · age {profileInfo.age} · {profileInfo.activity} activity
          </p>
          <Button variant="ghost" size="sm" className="text-xs text-primary" onClick={() => navigate('/settings')}>
            Edit in Settings →
          </Button>
        </div>
      )}
    </div>
  );
};

export default WeightPage;

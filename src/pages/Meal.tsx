import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/lib/i18n';
import { calculateMacros } from '@/lib/decision-engine';
import { calculateCalorieTargets } from '@/lib/tdee';
import { MEAL_DB } from '@/lib/exercise-db';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import AddCustomMealDialog from '@/components/AddCustomMealDialog';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import DisabledFeaturePlaceholder from '@/components/DisabledFeaturePlaceholder';
import SkeletonLoader from '@/components/SkeletonLoader';
import type { Meal, MealSlot } from '@/lib/types';
import type { CalorieTargets } from '@/lib/tdee';

const todayStr = () => new Date().toISOString().slice(0, 10);

type MealSlotKey = MealSlot;

const MEAL_SLOTS: { key: MealSlotKey; icon: string; time: string; label: string }[] = [
  { key: 'breakfast', icon: '🌅', time: '07:00', label: 'Breakfast' },
  { key: 'pre_workout', icon: '🏋️', time: '11:30', label: 'Pre-Workout' },
  { key: 'lunch', icon: '☀️', time: '13:00', label: 'Lunch' },
  { key: 'dinner', icon: '🌙', time: '19:00', label: 'Dinner' },
  { key: 'snack', icon: '🍎', time: '15:00', label: 'Snack' },
];

const MealPage = () => {
  const { lang } = useLanguage();
  const mealEnabled = useFeatureFlag('meal_planner');
  const [loading, setLoading] = useState(true);
  const [weightKg, setWeightKg] = useState(75);
  const [nutritionLoad, setNutritionLoad] = useState<string>('maintenance');
  const [fitnessGoal, setFitnessGoal] = useState<string>('muscle');
  const [mealSelections, setMealSelections] = useState<Map<string, number>>(new Map());
  const [eatenSlots, setEatenSlots] = useState<Set<string>>(new Set());
  const [dbLogIds, setDbLogIds] = useState<Map<string, string>>(new Map());
  const [customMeals, setCustomMeals] = useState<Record<string, Meal[]>>({});
  const [reloadKey, setReloadKey] = useState(0);
  const [tdeeTargets, setTdeeTargets] = useState<CalorieTargets | null>(null);

  const loadCustomMeals = useCallback(async (userId: string) => {
    const { data } = await supabase.from('custom_meals').select('*').eq('user_id', userId);
    if (data && data.length > 0) {
      const grouped: Record<string, Meal[]> = {};
      data.forEach((m: any) => {
        const slot = m.meal_slot || 'snack';
        if (!grouped[slot]) grouped[slot] = [];
        grouped[slot].push({ name_th: m.name, name_en: m.name, kcal: m.kcal, protein: Number(m.protein), carbs: Number(m.carbs), fat: Number(m.fat) });
      });
      setCustomMeals(grouped);
    }
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }

        // Fetch everything in parallel — including custom_meals
        const [{ data: profile }, { data: todayCheckin }, { data: logs }, { data: rawCustomMeals }] = await Promise.all([
          supabase.from('user_profiles').select('weight_kg, fitness_goal, height_cm, age, sex, activity_level').eq('id', user.id).maybeSingle(),
          supabase.from('daily_checkins').select('nutrition_load').eq('user_id', user.id).eq('date', todayStr()).maybeSingle(),
          supabase.from('meal_logs').select('*').eq('user_id', user.id).eq('date', todayStr()),
          supabase.from('custom_meals').select('*').eq('user_id', user.id),
        ]);

        if (profile?.weight_kg) setWeightKg(Number(profile.weight_kg));
        if (profile?.fitness_goal) setFitnessGoal(profile.fitness_goal);

        // Calculate TDEE if profile has enough data
        if (profile) {
          const targets = calculateCalorieTargets(
            Number(profile.weight_kg) || 70,
            (profile as any).height_cm || 170,
            (profile as any).age || 30,
            (profile as any).sex || 'other',
            ((profile as any).activity_level as any) || 'moderate',
            (profile.fitness_goal as any) || 'general'
          );
          setTdeeTargets(targets);
        }

        let checkin = todayCheckin;
        if (!checkin?.nutrition_load) {
          const { data: latestCheckin } = await supabase
            .from('daily_checkins')
            .select('nutrition_load')
            .eq('user_id', user.id)
            .not('nutrition_load', 'is', null)
            .order('date', { ascending: false })
            .limit(1)
            .maybeSingle();
          if (latestCheckin?.nutrition_load) checkin = latestCheckin;
        }

        if (checkin?.nutrition_load) setNutritionLoad(checkin.nutrition_load);

        // Build customMeals map from raw data (not React state — state update is async)
        const freshCustomMeals: Record<string, Meal[]> = {};
        if (rawCustomMeals && rawCustomMeals.length > 0) {
          rawCustomMeals.forEach((m: any) => {
            const slot = m.meal_slot || 'snack';
            if (!freshCustomMeals[slot]) freshCustomMeals[slot] = [];
            freshCustomMeals[slot].push({
              name_th: m.name, name_en: m.name,
              kcal: m.kcal, protein: Number(m.protein),
              carbs: Number(m.carbs), fat: Number(m.fat),
            });
          });
          setCustomMeals(freshCustomMeals);
        }

        if (logs && logs.length > 0) {
          const eaten = new Set<string>();
          const ids = new Map<string, string>();
          const selections = new Map<string, number>();
          logs.forEach(log => {
            if (log.meal_slot) {
              if (log.eaten) eaten.add(log.meal_slot);
              ids.set(log.meal_slot, log.id);
              if (log.meal_name) {
                // Use freshCustomMeals (raw data) — NOT customMeals state which hasn't updated yet
                const baseMeals = MEAL_DB[log.meal_slot as MealSlotKey] || [];
                const customSlotMeals = freshCustomMeals[log.meal_slot] || [];
                const allSlotMeals = [...baseMeals, ...customSlotMeals];
                const idx = allSlotMeals.findIndex(
                  m => m.name_th === log.meal_name || (m as any).name_en === log.meal_name
                );
                if (idx >= 0) selections.set(log.meal_slot, idx);
              }
            }
          });
          setEatenSlots(eaten);
          setDbLogIds(ids);
          setMealSelections(selections);
        }
        setLoading(false);
      } catch (err) {
        console.error('Failed to load meal data:', err);
        setLoading(false);
      }
    }
    load();
  }, [reloadKey]);

  // Use TDEE targets if available, otherwise fall back to simple macros
  const macros = tdeeTargets
    ? { calories: tdeeTargets.calorieTarget, protein: tdeeTargets.proteinTarget, carbs: tdeeTargets.carbTarget, fat: tdeeTargets.fatTarget }
    : calculateMacros(weightKg, fitnessGoal as any, nutritionLoad as any);

  const getAllMealsForSlot = useCallback((slot: MealSlotKey): Meal[] => {
    const base = MEAL_DB[slot] || [];
    const custom = customMeals[slot] || [];
    return [...base, ...custom];
  }, [customMeals]);

  const getMealForSlot = useCallback((slot: MealSlotKey): Meal | null => {
    const meals = getAllMealsForSlot(slot);
    if (meals.length === 0) return null;
    const idx = mealSelections.get(slot) ?? 0;
    return meals[idx] || meals[0];
  }, [mealSelections, getAllMealsForSlot]);

  const totals = Array.from(eatenSlots).reduce(
    (acc, slot) => {
      const meal = getMealForSlot(slot as MealSlotKey);
      if (!meal) return acc;
      return { calories: acc.calories + meal.kcal, protein: acc.protein + meal.protein, carbs: acc.carbs + meal.carbs, fat: acc.fat + meal.fat };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const toggleEaten = async (slot: MealSlotKey) => {
    const meal = getMealForSlot(slot);
    if (!meal) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const nowEaten = !eatenSlots.has(slot);
    // Always save name_th as canonical key — avoids lang mismatch on restore
    const mealName = meal.name_th;
    try {
      const existingId = dbLogIds.get(slot);
      if (existingId) {
        const { error } = await supabase.from('meal_logs').update({ eaten: nowEaten, meal_name: mealName, calories: meal.kcal, protein_g: meal.protein, carbs_g: meal.carbs, fat_g: meal.fat }).eq('id', existingId);
        if (error) throw error;
      } else {
        const { data: inserted, error } = await supabase.from('meal_logs').insert({ user_id: user.id, date: todayStr(), meal_slot: slot, meal_name: mealName, eaten: nowEaten, calories: meal.kcal, protein_g: meal.protein, carbs_g: meal.carbs, fat_g: meal.fat }).select('id').single();
        if (error) throw error;
        setDbLogIds(prev => new Map(prev).set(slot, inserted.id));
      }
      setEatenSlots(prev => { const next = new Set(prev); if (nowEaten) next.add(slot); else next.delete(slot); return next; });
    } catch (err: any) {
      toast.error(err.message || 'Failed to save meal');
    }
  };

  const swapMeal = async (slot: MealSlotKey) => {
    const meals = getAllMealsForSlot(slot);
    if (meals.length <= 1) return;
    const currentIdx = mealSelections.get(slot) ?? 0;
    const nextIdx = (currentIdx + 1) % meals.length;
    setMealSelections(prev => new Map(prev).set(slot, nextIdx));

    const meal = meals[nextIdx];
    const mealName = meal.name_th; // canonical key

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const existingId = dbLogIds.get(slot);
      if (existingId) {
        // Update existing log row
        const { error: mealUpdateError } = await supabase.from('meal_logs')
          .update({ meal_name: mealName, calories: meal.kcal, protein_g: meal.protein, carbs_g: meal.carbs, fat_g: meal.fat })
          .eq('id', existingId);
        if (mealUpdateError) throw mealUpdateError;
      } else {
        // No log row yet — create one with eaten=false to persist the selection
        const { data: inserted, error } = await supabase.from('meal_logs')
          .insert({
            user_id: user.id,
            date: todayStr(),
            meal_slot: slot,
            meal_name: mealName,
            eaten: false,
            calories: meal.kcal,
            protein_g: meal.protein,
            carbs_g: meal.carbs,
            fat_g: meal.fat,
          })
          .select('id')
          .single();
        if (!error && inserted) {
          setDbLogIds(prev => new Map(prev).set(slot, inserted.id));
        }
      }
    } catch (err) {
      console.error('Failed to save meal swap:', err);
    }
  };

  if (!mealEnabled) return <DisabledFeaturePlaceholder name="Meal Planner" />;
  if (loading) return <SkeletonLoader />;

  const modeLabel = nutritionLoad === 'surplus' ? '📈 Surplus' : nutritionLoad === 'deficit' ? '📉 Deficit' : '⚖️ Maintenance';

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-display text-2xl">Today's Nutrition Plan</h1>
          <p className="text-sm text-muted-foreground">Nutrition Mode: {modeLabel} · Target: ~{macros.calories} kcal</p>
        </div>
        <AddCustomMealDialog onAdded={() => setReloadKey(k => k + 1)} />
      </div>

      <div className="bg-card rounded-xl p-5 card-shadow">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div>
            <div className="text-label">Calories</div>
            <div className="text-data text-base sm:text-xl">{totals.calories}<span className="text-xs text-muted-foreground font-normal">/{macros.calories}</span></div>
          </div>
          <div>
            <div className="text-label">Protein</div>
            <div className="text-data text-base sm:text-xl text-status-green">{totals.protein}<span className="text-xs text-muted-foreground font-normal">/{macros.protein}g</span></div>
          </div>
          <div>
            <div className="text-label">Carbs</div>
            <div className="text-data text-base sm:text-xl text-primary">{totals.carbs}<span className="text-xs text-muted-foreground font-normal">/{macros.carbs}g</span></div>
          </div>
          <div>
            <div className="text-label">Fat</div>
            <div className="text-data text-base sm:text-xl text-accent">{totals.fat}<span className="text-xs text-muted-foreground font-normal">/{macros.fat}g</span></div>
          </div>
        </div>

        {tdeeTargets && (
          <div className="text-xs text-muted-foreground bg-secondary rounded-lg px-3 py-2 mt-3">
            TDEE: {tdeeTargets.tdee} kcal ·
            Target: {tdeeTargets.calorieTarget} kcal/day
            ({tdeeTargets.deficit > 0 ? '+' : ''}{tdeeTargets.deficit} kcal
            {tdeeTargets.deficit < 0 ? ' deficit' : tdeeTargets.deficit > 0 ? ' surplus' : ''})
          </div>
        )}

        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground"><span>Calories</span><span>{totals.calories} / {macros.calories} kcal</span></div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <motion.div className="h-full bg-primary rounded-full" initial={{ width: 0 }} animate={{ width: `${Math.min(100, (totals.calories / macros.calories) * 100)}%` }} />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground"><span>Protein</span><span>{totals.protein} / {macros.protein}g</span></div>
          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
            <motion.div className="h-full bg-status-green rounded-full" initial={{ width: 0 }} animate={{ width: `${Math.min(100, (totals.protein / macros.protein) * 100)}%` }} />
          </div>
        </div>
      </div>

      {MEAL_SLOTS.map((slot, i) => {
        const meal = getMealForSlot(slot.key);
        if (!meal) return null;
        const isEaten = eatenSlots.has(slot.key);
        const totalForSlot = getAllMealsForSlot(slot.key).length;
        const currentIdxForSlot = (mealSelections.get(slot.key) ?? 0) % totalForSlot;
        return (
          <motion.div key={slot.key} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className={`bg-card rounded-xl p-4 card-shadow relative transition-all ${isEaten ? 'border border-status-green/25' : ''}`}>
            {isEaten && (
              <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-status-green/15 flex items-center justify-center">
                <span className="text-status-green text-[10px] font-bold">✓</span>
              </div>
            )}
            <div className="flex items-center justify-between mb-2 pr-6">
              <div><span className="font-semibold text-sm">{slot.icon} {slot.label}</span><span className="text-xs text-muted-foreground ml-2">({slot.time})</span></div>
              <span className="text-data-sm">{meal.kcal} kcal</span>
            </div>
            <div className={`text-sm mb-3 ${isEaten ? 'text-muted-foreground' : ''}`}>{lang === 'th' ? meal.name_th : (meal.name_en || meal.name_th)}</div>
            <div className="flex gap-2 mb-3">
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">P:{meal.protein}g</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">C:{meal.carbs}g</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">F:{meal.fat}g</span>
            </div>
            <div className="flex gap-2">
              <Button variant={isEaten ? 'secondary' : 'accent'} size="sm" className="text-xs h-8" onClick={() => toggleEaten(slot.key)}>
                {isEaten ? '↩ Undo' : '✓ Mark as Eaten'}
              </Button>
              {totalForSlot > 1 && (
                <Button variant="outline" size="sm" className="text-xs h-8 gap-1.5" onClick={() => swapMeal(slot.key)}>
                  <span>⟳</span>
                  <span className="font-mono text-[11px]">{currentIdxForSlot + 1}/{totalForSlot}</span>
                </Button>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default MealPage;

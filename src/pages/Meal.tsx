import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/lib/i18n';
import { calculateMacros } from '@/lib/decision-engine';
import { MEAL_DB } from '@/lib/exercise-db';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import AddCustomMealDialog from '@/components/AddCustomMealDialog';
import type { Meal, MealSlot } from '@/lib/types';

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
  const [loading, setLoading] = useState(true);
  const [weightKg, setWeightKg] = useState(75);
  const [nutritionLoad, setNutritionLoad] = useState<string>('maintenance');
  const [fitnessGoal, setFitnessGoal] = useState<string>('muscle');
  const [mealSelections, setMealSelections] = useState<Map<string, number>>(new Map()); // slot -> index in MEAL_DB
  const [eatenSlots, setEatenSlots] = useState<Set<string>>(new Set());
  const [dbLogIds, setDbLogIds] = useState<Map<string, string>>(new Map()); // slot -> db id

  // Load user profile + today's meal logs
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const [{ data: profile }, { data: checkin }, { data: logs }] = await Promise.all([
        supabase.from('user_profiles').select('weight_kg, fitness_goal').eq('id', user.id).maybeSingle(),
        supabase.from('daily_checkins').select('nutrition_load').eq('user_id', user.id).eq('date', todayStr()).maybeSingle(),
        supabase.from('meal_logs').select('*').eq('user_id', user.id).eq('date', todayStr()),
      ]);

      if (profile?.weight_kg) setWeightKg(Number(profile.weight_kg));
      if (profile?.fitness_goal) setFitnessGoal(profile.fitness_goal);
      if (checkin?.nutrition_load) setNutritionLoad(checkin.nutrition_load);

      // Restore eaten state from DB
      if (logs && logs.length > 0) {
        const eaten = new Set<string>();
        const ids = new Map<string, string>();
        const selections = new Map<string, number>();
        logs.forEach(log => {
          if (log.meal_slot) {
            if (log.eaten) eaten.add(log.meal_slot);
            ids.set(log.meal_slot, log.id);
            // Find matching meal index
            const slotMeals = MEAL_DB[log.meal_slot as MealSlotKey];
            if (slotMeals && log.meal_name) {
              const idx = slotMeals.findIndex(m => m.name_th === log.meal_name || m.name_en === log.meal_name);
              if (idx >= 0) selections.set(log.meal_slot, idx);
            }
          }
        });
        setEatenSlots(eaten);
        setDbLogIds(ids);
        setMealSelections(selections);
      }
      setLoading(false);
    }
    load();
  }, []);

  const macros = calculateMacros(weightKg, fitnessGoal as any, nutritionLoad as any);

  const getMealForSlot = useCallback((slot: MealSlotKey): Meal | null => {
    const meals = MEAL_DB[slot];
    if (!meals || meals.length === 0) return null;
    const idx = mealSelections.get(slot) ?? 0;
    return meals[idx] || meals[0];
  }, [mealSelections]);

  // Calculate totals from eaten meals
  const totals = Array.from(eatenSlots).reduce(
    (acc, slot) => {
      const meal = getMealForSlot(slot as MealSlotKey);
      if (!meal) return acc;
      return {
        calories: acc.calories + meal.kcal,
        protein: acc.protein + meal.protein,
        carbs: acc.carbs + meal.carbs,
        fat: acc.fat + meal.fat,
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const toggleEaten = async (slot: MealSlotKey) => {
    const meal = getMealForSlot(slot);
    if (!meal) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const nowEaten = !eatenSlots.has(slot);
    const mealName = lang === 'th' ? meal.name_th : (meal.name_en || meal.name_th);

    try {
      const existingId = dbLogIds.get(slot);
      if (existingId) {
        // Update existing
        const { error } = await supabase.from('meal_logs').update({
          eaten: nowEaten,
          meal_name: mealName,
          calories: meal.kcal,
          protein_g: meal.protein,
          carbs_g: meal.carbs,
          fat_g: meal.fat,
        }).eq('id', existingId);
        if (error) throw error;
      } else {
        // Insert new
        const { data: inserted, error } = await supabase.from('meal_logs').insert({
          user_id: user.id,
          date: todayStr(),
          meal_slot: slot,
          meal_name: mealName,
          eaten: nowEaten,
          calories: meal.kcal,
          protein_g: meal.protein,
          carbs_g: meal.carbs,
          fat_g: meal.fat,
        }).select('id').single();
        if (error) throw error;
        setDbLogIds(prev => new Map(prev).set(slot, inserted.id));
      }

      setEatenSlots(prev => {
        const next = new Set(prev);
        if (nowEaten) next.add(slot); else next.delete(slot);
        return next;
      });
    } catch (err: any) {
      toast.error(err.message || 'Failed to save meal');
    }
  };

  const swapMeal = async (slot: MealSlotKey) => {
    const meals = MEAL_DB[slot];
    if (!meals || meals.length <= 1) return;

    const currentIdx = mealSelections.get(slot) ?? 0;
    const nextIdx = (currentIdx + 1) % meals.length;

    setMealSelections(prev => new Map(prev).set(slot, nextIdx));

    // If already logged, update in DB
    const existingId = dbLogIds.get(slot);
    if (existingId) {
      const meal = meals[nextIdx];
      const mealName = lang === 'th' ? meal.name_th : (meal.name_en || meal.name_th);
      await supabase.from('meal_logs').update({
        meal_name: mealName,
        calories: meal.kcal,
        protein_g: meal.protein,
        carbs_g: meal.carbs,
        fat_g: meal.fat,
      }).eq('id', existingId);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[50vh] text-muted-foreground">Loading...</div>;

  const modeLabel = nutritionLoad === 'surplus' ? '📈 Surplus' : nutritionLoad === 'deficit' ? '📉 Deficit' : '⚖️ Maintenance';

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-display text-2xl">Today's Nutrition Plan</h1>
        <p className="text-sm text-muted-foreground">
          Nutrition Mode: {modeLabel} · Target: ~{macros.calories} kcal
        </p>
      </div>

      {/* Macro Summary */}
      <div className="bg-card rounded-xl p-5 card-shadow">
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-xs text-muted-foreground uppercase">Calories</div>
            <div className="font-mono font-bold text-lg">{totals.calories}<span className="text-xs text-muted-foreground font-normal">/{macros.calories}</span></div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground uppercase">Protein</div>
            <div className="font-mono font-bold text-lg text-status-green">{totals.protein}<span className="text-xs text-muted-foreground font-normal">/{macros.protein}g</span></div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground uppercase">Carbs</div>
            <div className="font-mono font-bold text-lg text-primary">{totals.carbs}<span className="text-xs text-muted-foreground font-normal">/{macros.carbs}g</span></div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground uppercase">Fat</div>
            <div className="font-mono font-bold text-lg text-accent">{totals.fat}<span className="text-xs text-muted-foreground font-normal">/{macros.fat}g</span></div>
          </div>
        </div>

        {/* Progress Bars */}
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Calories</span>
            <span>{totals.calories} / {macros.calories} kcal</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <motion.div className="h-full bg-primary rounded-full" initial={{ width: 0 }} animate={{ width: `${Math.min(100, (totals.calories / macros.calories) * 100)}%` }} />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Protein</span>
            <span>{totals.protein} / {macros.protein}g</span>
          </div>
          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
            <motion.div className="h-full bg-status-green rounded-full" initial={{ width: 0 }} animate={{ width: `${Math.min(100, (totals.protein / macros.protein) * 100)}%` }} />
          </div>
        </div>
      </div>

      {/* Meal Cards */}
      {MEAL_SLOTS.map((slot, i) => {
        const meal = getMealForSlot(slot.key);
        if (!meal) return null;
        const isEaten = eatenSlots.has(slot.key);

        return (
          <motion.div
            key={slot.key}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className={`bg-card rounded-xl p-4 card-shadow transition-opacity ${isEaten ? 'opacity-60' : ''}`}
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="font-semibold">{slot.icon} {slot.label}</span>
                <span className="text-xs text-muted-foreground ml-2">({slot.time})</span>
              </div>
              <span className="font-mono text-sm">{meal.kcal} kcal</span>
            </div>
            <div className="text-sm mb-2">{lang === 'th' ? meal.name_th : (meal.name_en || meal.name_th)}</div>
            <div className="flex gap-3 text-xs text-muted-foreground mb-3">
              <span>P:{meal.protein}g</span>
              <span>C:{meal.carbs}g</span>
              <span>F:{meal.fat}g</span>
            </div>
            <div className="flex gap-2">
              <Button
                variant={isEaten ? 'secondary' : 'accent'}
                size="sm"
                className="text-xs"
                onClick={() => toggleEaten(slot.key)}
              >
                {isEaten ? '↩ Undo' : '✓ Mark as Eaten'}
              </Button>
              <Button variant="outline" size="sm" className="text-xs" onClick={() => swapMeal(slot.key)}>
                🔄 Swap
              </Button>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default MealPage;

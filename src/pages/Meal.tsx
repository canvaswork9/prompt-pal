import { useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/lib/i18n';
import { calculateMacros } from '@/lib/decision-engine';
import { MEAL_DB } from '@/lib/exercise-db';
import { Button } from '@/components/ui/button';

const MealPage = () => {
  const { lang } = useLanguage();
  const macros = calculateMacros(75, 'muscle', 'maintenance');
  const [eaten, setEaten] = useState<Set<string>>(new Set());

  const mealSlots = [
    { key: 'breakfast', icon: '🌅', time: '07:00', label: 'Breakfast' },
    { key: 'pre_workout', icon: '🏋️', time: '11:30', label: 'Pre-Workout' },
    { key: 'lunch', icon: '☀️', time: '13:00', label: 'Lunch' },
    { key: 'dinner', icon: '🌙', time: '19:00', label: 'Dinner' },
  ] as const;

  const totalEaten = Array.from(eaten).reduce((sum, key) => {
    const [slot] = key.split('-');
    const meals = MEAL_DB[slot as keyof typeof MEAL_DB];
    return sum + (meals?.[0]?.kcal || 0);
  }, 0);

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-display text-2xl">Today's Nutrition Plan</h1>
        <p className="text-sm text-muted-foreground">
          Nutrition Mode: ⚖️ Maintenance · Target: ~{macros.calories} kcal
        </p>
      </div>

      {/* Macro Summary */}
      <div className="bg-card rounded-xl p-5 card-shadow">
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-xs text-muted-foreground uppercase">Calories</div>
            <div className="font-mono font-bold text-lg">{macros.calories}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground uppercase">Protein</div>
            <div className="font-mono font-bold text-lg text-status-green">{macros.protein}g</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground uppercase">Carbs</div>
            <div className="font-mono font-bold text-lg text-primary">{macros.carbs}g</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground uppercase">Fat</div>
            <div className="font-mono font-bold text-lg text-accent">{macros.fat}g</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Daily Progress</span>
            <span>{totalEaten} / {macros.calories} kcal</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (totalEaten / macros.calories) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Meal Cards */}
      {mealSlots.map((slot, i) => {
        const meals = MEAL_DB[slot.key];
        if (!meals || meals.length === 0) return null;
        const meal = meals[0];
        const mealKey = `${slot.key}-0`;
        const isEaten = eaten.has(mealKey);

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
                onClick={() => {
                  const next = new Set(eaten);
                  if (isEaten) next.delete(mealKey);
                  else next.add(mealKey);
                  setEaten(next);
                }}
              >
                {isEaten ? '↩ Undo' : '✓ Mark as Eaten'}
              </Button>
              <Button variant="outline" size="sm" className="text-xs">🔄 Swap Meal</Button>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default MealPage;

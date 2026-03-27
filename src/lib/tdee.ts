export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type GoalType = 'muscle' | 'fat_loss' | 'strength' | 'general';

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary:   1.2,
  light:       1.375,
  moderate:    1.55,
  active:      1.725,
  very_active: 1.9,
};

export function calculateBMR(
  weightKg: number, heightCm: number, age: number, sex: string
): number {
  const base = (10 * weightKg) + (6.25 * heightCm) - (5 * age);
  if (sex === 'male')   return Math.round(base + 5);
  if (sex === 'female') return Math.round(base - 161);
  return Math.round(base - 78);
}

export function calculateTDEE(
  weightKg: number, heightCm: number, age: number,
  sex: string, activityLevel: ActivityLevel
): number {
  return Math.round(calculateBMR(weightKg, heightCm, age, sex)
    * ACTIVITY_MULTIPLIERS[activityLevel]);
}

export interface CalorieTargets {
  tdee: number;
  bmr: number;
  calorieTarget: number;
  proteinTarget: number;
  carbTarget: number;
  fatTarget: number;
  deficit: number;
}

export function calculateCalorieTargets(
  weightKg: number, heightCm: number, age: number,
  sex: string, activityLevel: ActivityLevel, goal: GoalType
): CalorieTargets {
  const tdee = calculateTDEE(weightKg, heightCm, age, sex, activityLevel);
  const bmr  = calculateBMR(weightKg, heightCm, age, sex);

  let calorieTarget: number;
  let deficit: number;

  switch (goal) {
    case 'fat_loss':
      calorieTarget = tdee - 500; deficit = -500; break;
    case 'muscle':
    case 'strength':
      calorieTarget = tdee + 250; deficit = 250; break;
    default:
      calorieTarget = tdee; deficit = 0;
  }

  const proteinMultiplier = (goal === 'fat_loss' || goal === 'strength') ? 2.4 : 2.0;
  const proteinTarget = Math.round(weightKg * proteinMultiplier);
  const fatTarget     = Math.round((calorieTarget * 0.25) / 9);
  const carbTarget    = Math.max(0,
    Math.round((calorieTarget - proteinTarget * 4 - fatTarget * 9) / 4)
  );

  return {
    tdee, bmr,
    calorieTarget: Math.max(calorieTarget, 1200),
    proteinTarget, carbTarget, fatTarget, deficit,
  };
}

// ─── Calculate targets from actual weight goal (weekly_target_kg) ────────────
// Used by Meal.tsx when user has an active weight_goals entry
// weeklyTargetKg: negative = lose (e.g. -0.5), positive = gain, 0 = maintain
export function calculateCalorieTargetsFromGoal(
  weightKg: number, heightCm: number, age: number,
  sex: string, activityLevel: ActivityLevel,
  weeklyTargetKg: number  // from weight_goals.weekly_target_kg
): CalorieTargets {
  const tdee = calculateTDEE(weightKg, heightCm, age, sex, activityLevel);
  const bmr  = calculateBMR(weightKg, heightCm, age, sex);

  // 1 kg of body weight ≈ 7,700 kcal
  // Weekly deficit/surplus = weeklyTargetKg × 7700 / 7
  const dailyDelta   = Math.round((weeklyTargetKg * 7700) / 7);
  const calorieTarget = Math.max(tdee + dailyDelta, 1200);
  const deficit      = dailyDelta; // negative = deficit, positive = surplus

  // Protein: higher when cutting to preserve muscle
  const proteinMultiplier = weeklyTargetKg < 0 ? 2.4 : 2.0;
  const proteinTarget = Math.round(weightKg * proteinMultiplier);
  const fatTarget     = Math.round((calorieTarget * 0.25) / 9);
  const carbTarget    = Math.max(
    0,
    Math.round((calorieTarget - proteinTarget * 4 - fatTarget * 9) / 4)
  );

  return { tdee, bmr, calorieTarget, proteinTarget, carbTarget, fatTarget, deficit };
}

export function weeksToGoal(
  currentWeight: number, targetWeight: number, weeklyChangeKg: number
): number | null {
  if (weeklyChangeKg === 0) return null;
  const diff = targetWeight - currentWeight;
  if (Math.sign(diff) !== Math.sign(weeklyChangeKg)) return null;
  return Math.ceil(Math.abs(diff / weeklyChangeKg));
}

export function isOnTrack(
  startWeight: number, currentWeight: number,
  startDate: string, weeklyTargetKg: number
): { onTrack: boolean; actualWeeklyChange: number } {
  const days = Math.max(1,
    (Date.now() - new Date(startDate).getTime()) / 86400000
  );
  const weeks = days / 7;
  const actual = currentWeight - startWeight;
  const expected = weeklyTargetKg * weeks;
  const tolerance = Math.abs(expected) * 0.25;
  const onTrack = weeklyTargetKg < 0
    ? actual <= expected + tolerance
    : actual >= expected - tolerance;
  return {
    onTrack,
    actualWeeklyChange: Math.round((actual / weeks) * 10) / 10,
  };
}

// Volume-based calorie burn from weight training
// Formula: Total Volume (kg × reps) × 0.1 kcal/kg
// Based on research showing ~1 kcal per 10 kg·rep of mechanical work
// Warmup sets excluded — they inflate volume without metabolic cost

export interface SetVolume {
  weight_kg: number | null;
  reps: number | null;
  is_warmup: boolean | null;
}

export function calculateVolumeCalories(sets: SetVolume[]): number {
  const workingSets = sets.filter(s => !s.is_warmup && s.weight_kg && s.reps);
  const totalVolume = workingSets.reduce(
    (sum, s) => sum + (Number(s.weight_kg) * Number(s.reps)),
    0
  );
  // 0.1 kcal per kg·rep is conservative — real value varies by exercise
  // Compound lifts (squat, deadlift) ~0.12, isolation ~0.08
  return Math.round(totalVolume * 0.1);
}

// ─── Nutrition Load Modifier ──────────────────────────────────────────────────
// Adjusts daily calorie target based on today's check-in nutrition intent
// and readiness score. Applied on top of the long-term TDEE goal target.
//
// Design principles:
//  • Protein stays fixed — muscle retention is non-negotiable
//  • Low readiness (Red day) soft-caps surplus & reduces deficit severity
//    because: training harder when depleted worsens recovery, and aggressive
//    cutting when already fatigued accelerates muscle loss
//  • Carbs absorb all the calorie delta — they are the energy lever
//  • Fat stays at 25% of adjusted calories

export type NutritionLoadType = 'surplus' | 'deficit' | 'maintenance';

export interface NutritionLoadAdjustment {
  adjustedTargets: CalorieTargets;
  loadPct: number;         // e.g. +0.12, -0.15, 0
  readinessModified: boolean; // true if readiness capped the adjustment
  note: string;
}

export function applyNutritionLoad(
  base: CalorieTargets,
  nutritionLoad: NutritionLoadType,
  readinessScore: number
): NutritionLoadAdjustment {
  const isLowReadiness  = readinessScore < 55;  // Red zone
  const isHighReadiness = readinessScore >= 75;  // Green zone

  // Base adjustment percentages
  let loadPct: number;
  let readinessModified = false;
  let note: string;

  if (nutritionLoad === 'surplus') {
    if (isHighReadiness) {
      loadPct = 0.12;   // Green + surplus: full +12% — training is productive
      note = 'High readiness — full surplus applied to fuel performance';
    } else if (isLowReadiness) {
      loadPct = 0.05;   // Red + surplus: soft cap at +5% — body isn't using fuel efficiently
      readinessModified = true;
      note = 'Low readiness — surplus reduced to +5% (body absorbs less when fatigued)';
    } else {
      loadPct = 0.08;   // Yellow: moderate +8%
      note = 'Moderate readiness — partial surplus applied';
    }
  } else if (nutritionLoad === 'deficit') {
    if (isLowReadiness) {
      loadPct = -0.08;  // Red + deficit: ease up — aggressive cut when fatigued = muscle loss
      readinessModified = true;
      note = 'Low readiness — deficit softened to -8% to protect muscle mass';
    } else if (isHighReadiness) {
      loadPct = -0.15;  // Green + deficit: full cut, body can handle it
      note = 'High readiness — full deficit applied';
    } else {
      loadPct = -0.12;  // Yellow: moderate cut
      note = 'Moderate readiness — standard deficit applied';
    }
  } else {
    loadPct = 0;
    note = 'Maintenance — TDEE target unchanged';
  }

  const adjustedCalories = Math.max(
    Math.round(base.calorieTarget * (1 + loadPct)),
    1200  // hard floor — never go below 1200 kcal regardless of settings
  );

  // Protein locked — it's the anchor
  const proteinTarget = base.proteinTarget;
  // Fat stays at 25% of adjusted calories
  const fatTarget = Math.round((adjustedCalories * 0.25) / 9);
  // Carbs absorb all remaining — they are the energy lever
  const carbTarget = Math.max(
    0,
    Math.round((adjustedCalories - proteinTarget * 4 - fatTarget * 9) / 4)
  );

  return {
    adjustedTargets: {
      ...base,
      calorieTarget: adjustedCalories,
      fatTarget,
      carbTarget,
      deficit: adjustedCalories - base.tdee,
    },
    loadPct,
    readinessModified,
    note,
  };
}

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

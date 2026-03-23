export type FitnessGoal = 'muscle' | 'fat_loss' | 'strength' | 'general';
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';
export type SleepQuality = 'good' | 'ok' | 'poor';
export type YesterdayTraining = 'none' | 'cardio' | 'upper' | 'lower' | 'full';
export type MuscleSoreness = 'none' | 'upper' | 'lower' | 'full';
export type NutritionLoad = 'surplus' | 'maintenance' | 'deficit';
export type ReadinessStatus = 'Green' | 'Yellow' | 'Red';
export type Sex = 'male' | 'female' | 'other';
export type MealSlot = 'breakfast' | 'pre_workout' | 'lunch' | 'dinner' | 'snack';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

export interface UserProfile {
  id: string;
  display_name: string;
  age: number;
  sex: Sex;
  weight_kg: number;
  height_cm: number;
  activity_level: ActivityLevel;
  fitness_goal: FitnessGoal;
  experience: ExperienceLevel;
  baseline_hr: number;
  language: 'th' | 'en';
  created_at: string;
}

export interface CheckinData {
  sleep_hours: number;
  sleep_quality: SleepQuality;
  resting_hr: number;
  yesterday_training: YesterdayTraining;
  muscle_soreness: MuscleSoreness;
  nutrition_load: NutritionLoad;
}

export interface ReadinessResult {
  score: number;
  status: ReadinessStatus;
  decision: string;
  training_split: string;
  cardio_zone: string;
  coach_message: string;
  score_breakdown: ScoreBreakdown;
  skip_reasons: string[];
  intensity_note: string;
}

export interface ScoreBreakdown {
  sleep_duration: number;
  sleep_quality: number;
  heart_rate: number;
  recovery: number;
  soreness: number;
  nutrition: number;
}

export interface Exercise {
  key: string;
  name_en: string;
  name_th: string;
  muscles: string;
  split: 'lower' | 'upper_chest' | 'upper_back' | 'upper_shoulders' | 'upper_arms' | 'full_body';
  type: 'compound' | 'isolation';
  green_sets: string;
  yellow_sets: string;
  min_level: ExperienceLevel;
  avoid_when?: MuscleSoreness;
  form_tips_th: string[];
  form_tips_en: string[];
}

export interface SetData {
  set_number: number;
  weight_kg: number;
  reps: number;
  rpe: number;
  is_warmup: boolean;
}

export interface Meal {
  name_th: string;
  name_en?: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface OnboardingData {
  display_name: string;
  age: number;
  sex: Sex;
  fitness_goal: FitnessGoal;
  experience: ExperienceLevel;
  height_cm?: number;
  weight_kg?: number;
}

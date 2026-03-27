import type { CheckinData, ReadinessResult, ReadinessStatus, ScoreBreakdown } from './types';

function scoreSleepDuration(hours: number): number {
  if (hours >= 8) return 95;
  if (hours >= 7.5) return 85;
  if (hours >= 7) return 75;
  if (hours >= 6.5) return 65;
  if (hours >= 6) return 50;
  if (hours >= 5) return 35;
  return 20;
}

function scoreSleepQuality(quality: string): number {
  if (quality === 'good') return 90;
  if (quality === 'ok') return 60;
  return 30;
}

function scoreHeartRate(hr: number, baseline: number): number {
  const dev = hr - baseline;
  if (dev <= 0) return 95;
  if (dev <= 3) return 85;
  if (dev <= 5) return 70;
  if (dev <= 8) return 55;
  if (dev <= 12) return 40;
  return 25;
}

function scoreHRV(hrv: number | null): number {
  if (!hrv || hrv <= 0) return 70; // neutral when not provided
  if (hrv >= 90) return 100;
  if (hrv >= 70) return 90;
  if (hrv >= 50) return 75;
  if (hrv >= 35) return 55;
  if (hrv >= 20) return 35;
  return 20;
}

function scoreRecovery(yesterday: string): number {
  if (yesterday === 'none') return 95;
  if (yesterday === 'cardio') return 80;
  if (yesterday === 'upper' || yesterday === 'lower') return 65;
  return 45; // full
}

function scoreSoreness(soreness: string): number {
  if (soreness === 'none') return 95;
  if (soreness === 'upper' || soreness === 'lower') return 55;
  return 30; // full
}

function scoreNutrition(load: string): number {
  if (load === 'surplus') return 90;
  if (load === 'maintenance') return 80;
  return 60; // deficit
}

export function calculateReadiness(data: CheckinData, baselineHR: number = 60): ReadinessResult {
  const breakdown: ScoreBreakdown = {
    sleep_duration: scoreSleepDuration(data.sleep_hours),
    sleep_quality: scoreSleepQuality(data.sleep_quality),
    heart_rate: scoreHeartRate(data.resting_hr, baselineHR),
    hrv: scoreHRV(data.hrv_ms ?? null),
    recovery: scoreRecovery(data.yesterday_training),
    soreness: scoreSoreness(data.muscle_soreness),
    nutrition: scoreNutrition(data.nutrition_load),
  };

  // Weighted average
  // HRV weight is conditional — if user didn't enter HRV, redistribute its weight to heart_rate
  const hasHRV = data.hrv_ms && data.hrv_ms > 0;
  const weights = hasHRV
    ? { sleep_duration: 0.20, sleep_quality: 0.12, heart_rate: 0.13, hrv: 0.18, recovery: 0.17, soreness: 0.12, nutrition: 0.08 }
    : { sleep_duration: 0.22, sleep_quality: 0.13, heart_rate: 0.20, hrv: 0,    recovery: 0.18, soreness: 0.15, nutrition: 0.12 };
  const score = Math.round(
    breakdown.sleep_duration * weights.sleep_duration +
    breakdown.sleep_quality * weights.sleep_quality +
    breakdown.heart_rate * weights.heart_rate +
    breakdown.hrv * weights.hrv +
    breakdown.recovery * weights.recovery +
    breakdown.soreness * weights.soreness +
    breakdown.nutrition * weights.nutrition
  );

  let status: ReadinessStatus;
  if (score >= 75) status = 'Green';
  else if (score >= 50) status = 'Yellow';
  else status = 'Red';

  // Determine split
  let training_split = '';
  const skip_reasons: string[] = [];

  if (status === 'Red') {
    training_split = 'Recovery';
  } else {
    if (data.yesterday_training === 'upper' || data.muscle_soreness === 'upper') {
      training_split = 'Lower Body';
      skip_reasons.push('Upper body — soreness/yesterday\'s session');
    } else if (data.yesterday_training === 'lower' || data.muscle_soreness === 'lower') {
      training_split = 'Upper Body';
      skip_reasons.push('Lower body — soreness/yesterday\'s session');
    } else if (data.yesterday_training === 'full' || data.muscle_soreness === 'full') {
      training_split = status === 'Green' ? 'Light Full Body' : 'Recovery';
      skip_reasons.push('Full body fatigue from yesterday');
    } else {
      training_split = 'Full Body';
    }
  }

  let decision = '';
  let intensity_note = '';
  let cardio_zone = '';

  if (score >= 85) {
    decision = 'TRAIN — Push Hard';
    intensity_note = 'Push for PRs — your body is ready';
    cardio_zone = 'Zone 3–4';
  } else if (score >= 70) {
    decision = 'TRAIN — Normal';
    intensity_note = 'Normal intensity — solid session';
    cardio_zone = 'Zone 2–3';
  } else if (score >= 55) {
    decision = 'TRAIN — Moderate';
    intensity_note = 'Reduce load 15–20% — quality over weight';
    cardio_zone = 'Zone 2 optional';
  } else if (score >= 45) {
    decision = 'LIGHT — Technique Only';
    intensity_note = 'Technique work only — no max effort';
    cardio_zone = 'Zone 1–2';
  } else {
    decision = 'REST — Recovery Day';
    intensity_note = 'Rest or mobility only';
    cardio_zone = 'Zone 1 only';
  }

  return {
    score,
    status,
    decision,
    training_split,
    cardio_zone,
    coach_message: '', // Will be filled by AI
    score_breakdown: breakdown,
    skip_reasons,
    intensity_note,
  };
}

export function estimated1RM(weight: number, reps: number): number {
  return Math.round(weight * (1 + reps / 30));
}

export function calculateMacros(weight: number, goal: string, nutritionLoad: string) {
  const proteinMultiplier = goal === 'fat_loss' ? 2.4 : goal === 'strength' ? 2.2 : 2.0;
  const protein = weight * proteinMultiplier;
  const calorieBase = weight * 30;
  const calories =
    nutritionLoad === 'surplus' ? calorieBase * 1.15 :
    nutritionLoad === 'maintenance' ? calorieBase :
    calorieBase * 0.85;

  const fat = calories * 0.25 / 9;
  const carbs = (calories - protein * 4 - fat * 9) / 4;

  return {
    calories: Math.round(calories),
    protein: Math.round(protein),
    carbs: Math.round(carbs),
    fat: Math.round(fat),
  };
}

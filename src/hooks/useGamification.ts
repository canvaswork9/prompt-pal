import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

// ─── XP & Level Formulas (Exponential) ───
const TIER_THRESHOLDS = [
  { level: 1, name: 'Seedling', emoji: '🌱' },
  { level: 5, name: 'Sprout', emoji: '🌿' },
  { level: 10, name: 'Warrior', emoji: '⚔️' },
  { level: 20, name: 'Champion', emoji: '🏆' },
  { level: 30, name: 'Legend', emoji: '👑' },
  { level: 50, name: 'Immortal', emoji: '💎' },
];

export function getTierForLevel(level: number) {
  let tier = TIER_THRESHOLDS[0];
  for (const t of TIER_THRESHOLDS) {
    if (level >= t.level) tier = t;
  }
  return tier;
}

// XP required to reach level N: 200 * (N-1)^2
export function xpForLevel(level: number): number {
  return 200 * Math.pow(level - 1, 2);
}

export function getLevelFromXP(xp: number): number {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level++;
  return Math.min(level, 50);
}

export function getXPProgress(xp: number) {
  const level = getLevelFromXP(xp);
  const currentFloor = xpForLevel(level);
  const nextFloor = xpForLevel(level + 1);
  const current = xp - currentFloor;
  const needed = nextFloor - currentFloor;
  return { current, needed, pct: needed > 0 ? (current / needed) * 100 : 0 };
}

// ─── XP Award amounts ───
export const XP_AWARDS = {
  checkin: 50,
  workout_complete: 100,
  green_day: 30,
  streak_3: 75,
  streak_7: 150,
  streak_14: 300,
  streak_30: 500,
  new_pr: 200,
} as const;

// ─── Challenges ───
export interface Challenge {
  key: string;
  title_en: string;
  title_th: string;
  desc_en: string;
  desc_th: string;
  target: number;
  xp_reward: number;
  icon: string;
}

export const CHALLENGES: Challenge[] = [
  { key: 'streak_3', title_en: '3-Day Streak', title_th: 'เช็คอิน 3 วัน', desc_en: 'Check in 3 days in a row', desc_th: 'เช็คอินติดต่อกัน 3 วัน', target: 3, xp_reward: 75, icon: '🔥' },
  { key: 'streak_7', title_en: 'Week Warrior', title_th: 'นักรบ 7 วัน', desc_en: 'Check in 7 days in a row', desc_th: 'เช็คอินติดต่อกัน 7 วัน', target: 7, xp_reward: 150, icon: '⚔️' },
  { key: 'streak_14', title_en: 'Two-Week Titan', title_th: 'ไททัน 2 สัปดาห์', desc_en: 'Maintain a 14-day streak', desc_th: 'เช็คอินติดต่อกัน 14 วัน', target: 14, xp_reward: 300, icon: '🏋️' },
  { key: 'green_5', title_en: 'Green Machine', title_th: 'เครื่องจักรสีเขียว', desc_en: 'Get 5 Green readiness days', desc_th: 'ได้วันสีเขียว 5 วัน', target: 5, xp_reward: 100, icon: '💚' },
  { key: 'workouts_10', title_en: 'Iron Ten', title_th: 'เหล็ก 10 ครั้ง', desc_en: 'Complete 10 workouts', desc_th: 'ออกกำลังกายครบ 10 ครั้ง', target: 10, xp_reward: 250, icon: '🎯' },
];

// ─── Gamification State ───
export interface GamificationState {
  totalXP: number;
  level: number;
  tierName: string;
  tierEmoji: string;
  streakDays: number;
  longestStreak: number;
  badges: { badge_key: string; badge_name: string; earned_at: string }[];
  loading: boolean;
}

export function useGamification() {
  const [state, setState] = useState<GamificationState>({
    totalXP: 0, level: 1, tierName: 'Seedling', tierEmoji: '🌱',
    streakDays: 0, longestStreak: 0, badges: [], loading: true,
  });
  const [levelUpTo, setLevelUpTo] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setState(s => ({ ...s, loading: false })); return; }

      const [gamRes, badgeRes] = await Promise.all([
        supabase.from('user_gamification').select('*').eq('id', user.id).maybeSingle(),
        supabase.from('user_badges').select('badge_key, badge_name, earned_at').eq('user_id', user.id),
      ]);

      const g = gamRes.data;
      if (g) {
        const level = getLevelFromXP(g.total_xp ?? 0);
        const tier = getTierForLevel(level);
        setState({
          totalXP: g.total_xp ?? 0,
          level,
          tierName: tier.name,
          tierEmoji: tier.emoji,
          streakDays: g.streak_days ?? 0,
          longestStreak: g.longest_streak ?? 0,
          badges: (badgeRes.data ?? []).map(b => ({
            badge_key: b.badge_key,
            badge_name: b.badge_name,
            earned_at: b.earned_at ?? '',
          })),
          loading: false,
        });
      } else {
        setState(s => ({ ...s, loading: false }));
      }
    } catch (err) {
      console.error('Failed to load gamification:', err);
      setState(s => ({ ...s, loading: false }));
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const awardXP = async (amount: number, reason: string, description?: string): Promise<{ xpEarned: number; didLevelUp: boolean; newLevel: number } | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const today = new Date().toISOString().slice(0, 10);

    // Check if this reason was already awarded today
    const { data: existing } = await supabase
      .from('xp_transactions')
      .select('id')
      .eq('user_id', user.id)
      .eq('reason', reason)
      .gte('created_at', today + 'T00:00:00Z')
      .maybeSingle();

    if (existing) return null; // Already awarded today

    // Use atomic RPC
    const { data, error } = await supabase.rpc('add_xp', {
      p_user_id: user.id,
      p_amount: amount,
      p_reason: reason,
      p_description: description ?? null,
    });

    if (error) {
      console.error('Failed to award XP:', error);
      return null;
    }

    const result = Array.isArray(data) ? data[0] : data;
    if (!result) return null;

    const newLevel = result.new_level;
    const newTier = getTierForLevel(newLevel);

    setState(s => ({
      ...s,
      totalXP: result.new_total,
      level: newLevel,
      tierName: newTier.name,
      tierEmoji: newTier.emoji,
    }));

    if (result.did_level_up) {
      setLevelUpTo(newLevel);
    }

    return { xpEarned: amount, didLevelUp: result.did_level_up, newLevel };
  };

  const updateStreak = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Use atomic DB function to avoid race conditions from multiple devices
    const { data, error } = await supabase.rpc('update_streak', { p_user_id: user.id });
    if (error) { console.error('updateStreak RPC error:', error); return; }

    const result = Array.isArray(data) ? data[0] : data;
    if (!result) return;

    const newStreak     = result.new_streak as number;
    const longestStreak = result.longest_streak as number;
    const milestoneXP   = result.milestone_xp as number;

    setState(s => ({ ...s, streakDays: newStreak, longestStreak }));

    // Award milestone XP + badge if the DB function says a milestone was hit
    if (milestoneXP > 0) {
      const milestoneKey = `streak_${newStreak}`;
      const existing = state.badges.find(b => b.badge_key === milestoneKey);
      if (!existing) {
        // Check before insert to avoid onConflict dependency
        const { data: existingBadge } = await supabase
          .from('user_badges')
          .select('id')
          .eq('user_id', user.id)
          .eq('badge_key', milestoneKey)
          .maybeSingle();

        if (!existingBadge) {
          const { error: badgeError } = await supabase.from('user_badges').insert({
            user_id: user.id,
            badge_key: milestoneKey,
            badge_name: `${newStreak}-Day Streak`,
          });
          if (badgeError) { console.error('Failed to save badge:', badgeError); }
          else { await awardXP(milestoneXP, 'streak_milestone', `${newStreak}-day streak`); }
        }
      }
    }

    return newStreak;
  };

  const dismissLevelUp = () => setLevelUpTo(null);

  return { ...state, awardXP, updateStreak, levelUpTo, dismissLevelUp, reload: load };
}

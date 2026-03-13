import { motion } from 'framer-motion';
import { CHALLENGES, type Challenge, type GamificationState } from '@/hooks/useGamification';
import { useLanguage } from '@/lib/i18n';

interface ChallengeCardsProps {
  streakDays: number;
  badges: GamificationState['badges'];
  greenDays?: number;
  workoutCount?: number;
}

const ChallengeCards = ({ streakDays, badges, greenDays = 0, workoutCount = 0 }: ChallengeCardsProps) => {
  const { lang } = useLanguage();

  const getProgress = (c: Challenge): number => {
    if (c.key.startsWith('streak_')) return Math.min(streakDays, c.target);
    if (c.key === 'green_5') return Math.min(greenDays, c.target);
    if (c.key === 'workouts_10') return Math.min(workoutCount, c.target);
    return 0;
  };

  const isCompleted = (c: Challenge) => badges.some(b => b.badge_key === c.key);

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-sm flex items-center gap-2">🎯 Challenges</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {CHALLENGES.map((c, i) => {
          const completed = isCompleted(c);
          const progress = getProgress(c);
          const pct = Math.min((progress / c.target) * 100, 100);

          return (
            <motion.div
              key={c.key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className={`bg-card rounded-xl p-4 card-shadow relative overflow-hidden ${completed ? 'ring-1 ring-status-green/30' : ''}`}
            >
              {completed && (
                <div className="absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full bg-status-green-dim text-status-green font-medium">
                  ✓ Done
                </div>
              )}
              <div className="flex items-start gap-3">
                <span className="text-2xl">{c.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{lang === 'th' ? c.title_th : c.title_en}</div>
                  <div className="text-xs text-muted-foreground">{lang === 'th' ? c.desc_th : c.desc_en}</div>
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
                      <span>{progress}/{c.target}</span>
                      <span className="text-accent">+{c.xp_reward} XP</span>
                    </div>
                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${completed ? 'bg-status-green' : 'bg-primary'}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6, delay: i * 0.06 + 0.2 }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default ChallengeCards;

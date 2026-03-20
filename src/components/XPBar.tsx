import { motion } from 'framer-motion';
import { getXPProgress, getTierForLevel } from '@/hooks/useGamification';

interface XPBarProps {
  totalXP: number;
  level: number;
  streakDays: number;
  tierEmoji: string;
  tierName: string;
  compact?: boolean;
}

const XPBar = ({ totalXP, level, streakDays, tierEmoji, tierName, compact }: XPBarProps) => {
  const progress = getXPProgress(totalXP);

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-xs">
        <span>{tierEmoji}</span>
        <span className="font-mono text-primary">Lv.{level}</span>
        {streakDays > 0 && <span className="text-status-yellow">🔥{streakDays}</span>}
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl p-3 sm:p-4 card-shadow">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xl leading-none flex-shrink-0">⚡</span>
          <div className="min-w-0">
            <div className="text-display-sm truncate">LV.{level} {tierName.toUpperCase()}</div>
            <div className="text-label mt-0.5">{totalXP.toLocaleString()} XP · {progress.needed - progress.current} TO NEXT</div>
          </div>
        </div>
        {streakDays > 0 && (
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 2.5 }}
            className="reward-pill flex-shrink-0 ml-2"
          >
            🔥 {streakDays}
          </motion.div>
        )}
      </div>
      <div className="flex justify-between text-label mb-1.5">
        <span>{progress.current} / {progress.needed} XP</span>
        <span>LEVEL {level + 1}</span>
      </div>
      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: 'linear-gradient(90deg, hsl(245 100% 70%), hsl(77 100% 58%))' }}
          initial={{ width: 0 }}
          animate={{ width: `${progress.pct}%` }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
};

export default XPBar;

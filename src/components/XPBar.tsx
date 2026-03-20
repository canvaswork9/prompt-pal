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
    <div className="bg-card rounded-xl p-4 card-shadow space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">{tierEmoji}</span>
          <div>
            <div className="font-semibold text-sm tracking-tight">Level {level} · {tierName}</div>
            <div className="text-label mt-0.5">{totalXP.toLocaleString()} XP</div>
          </div>
        </div>
        {streakDays > 0 && (
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 2.5 }}
            className="reward-pill"
          >
            🔥 {streakDays}
          </motion.div>
        )}
      </div>
      <div className="space-y-1.5">
        <div className="flex justify-between text-label">
          <span>{progress.current} / {progress.needed} XP</span>
          <span>Level {level + 1}</span>
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
    </div>
  );
};

export default XPBar;

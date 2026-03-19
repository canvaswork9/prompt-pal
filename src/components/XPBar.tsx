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
        <div className="flex items-center gap-2">
          <span className="text-2xl">{tierEmoji}</span>
          <div>
            <div className="font-semibold text-sm">Level {level} · {tierName}</div>
            <div className="text-xs text-muted-foreground font-mono">{totalXP} XP total</div>
          </div>
        </div>
        {streakDays > 0 && (
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 2 }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-status-yellow-dim text-status-yellow text-sm font-semibold"
          >
            🔥 {streakDays}
          </motion.div>
        )}
      </div>

      {/* XP Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
          <span>{progress.current} / {progress.needed} XP</span>
          <span>Level {level + 1}</span>
        </div>
        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)))' }}
            initial={{ width: 0 }}
            animate={{ width: `${progress.pct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      </div>
    </div>
  );
};

export default XPBar;

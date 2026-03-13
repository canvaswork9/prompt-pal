import { motion, AnimatePresence } from 'framer-motion';
import { getTierForLevel, getXPProgress } from '@/hooks/useGamification';

interface LevelUpOverlayProps {
  level: number | null;
  onDismiss: () => void;
}

const LevelUpOverlay = ({ level, onDismiss }: LevelUpOverlayProps) => {
  if (!level) return null;
  const tier = getTierForLevel(level);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm"
        onClick={onDismiss}
      >
        <motion.div
          initial={{ scale: 0.3, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.3, opacity: 0 }}
          transition={{ type: 'spring', damping: 15, stiffness: 200 }}
          className="bg-card rounded-2xl p-8 card-shadow text-center space-y-4 max-w-sm mx-4"
          onClick={e => e.stopPropagation()}
        >
          {/* Confetti particles */}
          <div className="relative h-20 overflow-hidden">
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  left: `${10 + Math.random() * 80}%`,
                  backgroundColor: ['hsl(var(--status-green))', 'hsl(var(--accent))', 'hsl(var(--primary))', 'hsl(var(--status-yellow))'][i % 4],
                }}
                initial={{ y: 80, opacity: 0, scale: 0 }}
                animate={{
                  y: [80, -20 - Math.random() * 60],
                  x: [0, (Math.random() - 0.5) * 100],
                  opacity: [0, 1, 0],
                  scale: [0, 1.2, 0.5],
                }}
                transition={{ duration: 1.5, delay: i * 0.05, ease: 'easeOut' }}
              />
            ))}
          </div>

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.3, damping: 10, stiffness: 200 }}
            className="text-6xl"
          >
            {tier.emoji}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="text-xs uppercase tracking-widest text-primary font-mono">Level Up!</div>
            <div className="text-display text-3xl mt-1">Level {level}</div>
            <div className="text-muted-foreground text-sm mt-1">{tier.name}</div>
          </motion.div>

          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            onClick={onDismiss}
            className="px-6 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity"
          >
            Let's go! 🚀
          </motion.button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default LevelUpOverlay;

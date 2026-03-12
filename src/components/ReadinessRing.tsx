import { motion } from 'framer-motion';

interface ReadinessRingProps {
  score: number;
  status: 'Green' | 'Yellow' | 'Red';
  size?: number;
}

const ReadinessRing = ({ score, status, size = 200 }: ReadinessRingProps) => {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const colorMap = {
    Green: 'hsl(var(--status-green))',
    Yellow: 'hsl(var(--status-yellow))',
    Red: 'hsl(var(--status-red))',
  };

  const glowMap = {
    Green: 'var(--glow-green)',
    Yellow: 'var(--glow-yellow)',
    Red: 'var(--glow-red)',
  };

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="transform -rotate-90" style={{ width: size, height: size, filter: `drop-shadow(${glowMap[status]})` }}>
        {/* Background ring */}
        <circle
          cx="50" cy="50" r={radius}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth="6"
        />
        {/* Score ring */}
        <motion.circle
          cx="50" cy="50" r={radius}
          fill="none"
          stroke={colorMap[status]}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <motion.span
          className="font-display text-4xl font-bold tabular-nums"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
          style={{ color: colorMap[status] }}
        >
          {score}
        </motion.span>
        <span className="text-xs text-muted-foreground font-medium tracking-wider uppercase">READINESS</span>
      </div>
    </div>
  );
};

export default ReadinessRing;

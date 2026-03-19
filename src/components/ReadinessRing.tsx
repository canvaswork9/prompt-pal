import { motion } from 'framer-motion';

interface ReadinessRingProps {
  score: number;
  status: 'Green' | 'Yellow' | 'Red';
  size?: number;
}

const ReadinessRing = ({ score, status, size = 200 }: ReadinessRingProps) => {
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  // Apex Dark: Green=lime, Yellow=amber, Red=red
  const colorMap = {
    Green:  'hsl(77 100% 58%)',   // Neon Lime — peak condition
    Yellow: 'hsl(38 88% 58%)',
    Red:    'hsl(2 84% 60%)',
  };

  const glowMap = {
    Green:  'var(--glow-lime)',
    Yellow: 'var(--glow-yellow)',
    Red:    'var(--glow-red)',
  };

  const labelMap = {
    Green:  'PEAK',
    Yellow: 'MODERATE',
    Red:    'REST',
  };

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="transform -rotate-90" style={{ width: size, height: size, filter: `drop-shadow(${glowMap[status]})` }}>
        <circle cx="50" cy="50" r={radius} fill="none" stroke="hsl(var(--border))" strokeWidth="7" />
        <motion.circle
          cx="50" cy="50" r={radius}
          fill="none"
          stroke={colorMap[status]}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <motion.span
          className="font-display tabular-nums"
          style={{ fontSize: size * 0.2, color: colorMap[status], lineHeight: 1 }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          {score}
        </motion.span>
        <span className="text-muted-foreground font-medium tracking-widest uppercase" style={{ fontSize: size * 0.045 }}>
          READINESS
        </span>
        <span className="font-semibold tracking-wider uppercase mt-0.5" style={{ fontSize: size * 0.038, color: colorMap[status] }}>
          {labelMap[status]}
        </span>
      </div>
    </div>
  );
};

export default ReadinessRing;

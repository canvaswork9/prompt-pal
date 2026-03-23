import { motion } from 'framer-motion';
import type { LongevityScore } from './longevity-utils';
import { GRADE_CONFIG, BC, MONO } from './longevity-utils';

interface Props {
  score: LongevityScore;
}

export function LongevityScoreHero({ score }: Props) {
  const gc   = GRADE_CONFIG[score.grade];
  const R    = 44;
  const CIRC = 2 * Math.PI * R;
  const offset = CIRC - (score.total / 100) * CIRC;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-5 text-center"
      style={{ background: '#0d0d1f', border: `1px solid ${gc.ring}30`, boxShadow: score.grade !== 'NEW' ? `0 0 40px ${gc.glow}` : 'none' }}
    >
      <div className="flex justify-center mb-3">
        <svg width="148" height="148" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={R} fill="none" stroke="#111125" strokeWidth="7" />
          {score.grade !== 'NEW' && (
            <motion.circle cx="50" cy="50" r={R}
              fill="none" stroke={gc.ring} strokeWidth="7"
              strokeLinecap="round" strokeDasharray={CIRC}
              initial={{ strokeDashoffset: CIRC }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              transform="rotate(-90 50 50)"
            />
          )}
          {score.grade !== 'NEW' ? (
            <>
              <text x="50" y="42" textAnchor="middle" fill="#ffffff"
                style={{ fontFamily: BC, fontWeight: 800, fontSize: 26 }}>{score.total}</text>
              <text x="50" y="52" textAnchor="middle" fill="#2a2a50" fontSize="6" letterSpacing="2">/ 100</text>
              <text x="50" y="63" textAnchor="middle" fontSize="8" letterSpacing="2"
                style={{ fontFamily: BC, fontWeight: 700, fill: gc.color }}>{score.grade}</text>
            </>
          ) : (
            <text x="50" y="55" textAnchor="middle" fill="#2a2a50" fontSize="7" letterSpacing="1">CHECK IN DAILY</text>
          )}
        </svg>
      </div>
      <p style={{ fontFamily: BC, fontSize: 15, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: gc.color }}>
        {gc.desc}
      </p>
      <p style={{ fontFamily: BC, fontSize: 12, color: '#404070', marginTop: 4, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        BASED ON {score.totalDays} DAYS OF DATA
      </p>
    </motion.div>
  );
}

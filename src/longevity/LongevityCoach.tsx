import { motion } from 'framer-motion';
import type { LongevityScore } from './longevity-utils';
import { BC, DM, BODY, SEC_LABEL } from './longevity-utils';

interface Props {
  score: LongevityScore;
  coachMsg: string;
  coachLoading: boolean;
  onGenerate: () => void;
}

export function LongevityCoach({ score, coachMsg, coachLoading, onGenerate }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
      className="rounded-xl p-4"
      style={{ background: '#0d0d1f', border: '1px solid rgba(108,99,255,0.3)' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <p style={SEC_LABEL}>LONGEVITY COACH</p>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'hsl(245 100% 70%)', flexShrink: 0 }} />
      </div>

      {score.totalDays < 7 ? (
        <p style={{ ...BODY, color: '#404070' }}>
          Check in for at least 7 days to unlock personalized longevity coaching.
        </p>
      ) : coachLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[75, 55, 65].map((w, i) => (
            <div key={i} className="animate-pulse"
              style={{ height: 12, background: '#111125', borderRadius: 6, width: `${w}%` }} />
          ))}
        </div>
      ) : coachMsg ? (
        <p style={BODY}>{coachMsg}</p>
      ) : (
        <button onClick={onGenerate}
          style={{
            width: '100%', padding: '12px', borderRadius: 10, border: 'none',
            background: 'rgba(108,99,255,0.15)', color: 'hsl(245 100% 72%)',
            fontFamily: BC, fontWeight: 700, fontSize: 14,
            letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer',
          }}>
          GENERATE COACHING PLAN
        </button>
      )}
    </motion.div>
  );
}

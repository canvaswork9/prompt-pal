import { motion } from 'framer-motion';
import type { Insight } from './longevity-utils';
import { BODY, INSIGHT_DOT, SEC_LABEL } from './longevity-utils';

interface Props { insights: Insight[]; }

export function LongevityInsights({ insights }: Props) {
  if (!insights.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
      className="rounded-xl p-4"
      style={{ background: '#0d0d1f', border: '1px solid #16162a' }}
    >
      <p style={SEC_LABEL}>INSIGHTS</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {insights.map((ins, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: INSIGHT_DOT[ins.type], flexShrink: 0, marginTop: 5 }} />
            <p style={BODY}>{ins.text}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

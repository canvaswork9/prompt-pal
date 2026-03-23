import { motion } from 'framer-motion';
import type { DayData } from './longevity-utils';
import { BC, DOT_COLOR, SEC_LABEL } from './longevity-utils';

interface Props { days: DayData[]; }

const LEGEND: [string, string][] = [
  ['Green',   'hsl(77 100% 58%)'],
  ['Yellow',  'hsl(38 88% 58%)'],
  ['Red',     'hsl(2 84% 60%)'],
  ['No data', '#1e1e3a'],
];

export function LongevityDotGrid({ days }: Props) {
  const firstDataIdx = days.findIndex(d => d.status !== null);
  const daysWithData = days.filter(d => d.status !== null).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
      className="rounded-xl p-4"
      style={{ background: '#0d0d1f', border: '1px solid #16162a' }}
    >
      <p style={SEC_LABEL}>90-DAY READINESS MAP</p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        {days.map((d, i) => (
          <div key={i}
            title={d.status ? `${d.date}: ${d.status}` : `${d.date}: No check-in`}
            style={{
              width: 8, height: 8, borderRadius: 2,
              background: DOT_COLOR[d.status ?? 'null'],
              opacity: d.status === null ? 0.25 : 1,
            }}
          />
        ))}
      </div>

      {firstDataIdx > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, padding: '5px 10px', background: '#07070f', borderRadius: 7, border: '1px solid #16162a' }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'hsl(245 100% 70%)', flexShrink: 0 }} />
          <span style={{ fontFamily: BC, fontSize: 11, color: '#404070', letterSpacing: '0.04em' }}>
            Tracking started {new Date(days[firstDataIdx].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {daysWithData} days logged
          </span>
        </div>
      )}

      <div style={{ display: 'flex', gap: 14, marginTop: 10, flexWrap: 'wrap' }}>
        {LEGEND.map(([label, color]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: color, flexShrink: 0 }} />
            <span style={{ fontFamily: BC, fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#606090' }}>
              {label}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

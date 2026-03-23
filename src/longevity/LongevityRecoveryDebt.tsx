import { motion } from 'framer-motion';
import type { RecoveryDebt } from './longevity-utils';
import { BC, DM, MONO, DEBT_CONFIG, SEC_LABEL, BODY } from './longevity-utils';

interface Props { recovDebt: RecoveryDebt; }

export function LongevityRecoveryDebt({ recovDebt }: Props) {
  const dc = DEBT_CONFIG[recovDebt.level];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
      className="rounded-xl p-4"
      style={{ background: '#0d0d1f', border: `1px solid ${dc.border}`, boxShadow: `0 0 28px ${dc.bg}` }}
    >
      <p style={SEC_LABEL}>RECOVERY DEBT</p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14 }}>
        <div style={{ position: 'relative', flexShrink: 0, width: 108, height: 62 }}>
          <svg width="108" height="62" viewBox="0 0 108 62" style={{ overflow: 'visible' }}>
            <defs>
              <clipPath id="semi-clip">
                <rect x="0" y="0" width="108" height="54" />
              </clipPath>
            </defs>
            <circle cx="54" cy="54" r="40" fill="none" stroke="#111125" strokeWidth="10" clipPath="url(#semi-clip)" />
            <motion.circle cx="54" cy="54" r="40"
              fill="none" stroke={dc.color} strokeWidth="10" strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 40}`}
              strokeDashoffset={`${2 * Math.PI * 40 * (1 - (recovDebt.score / 100) * 0.5)}`}
              transform="rotate(-180 54 54)"
              clipPath="url(#semi-clip)"
              initial={{ strokeDashoffset: `${2 * Math.PI * 40}` }}
              animate={{ strokeDashoffset: `${2 * Math.PI * 40 * (1 - (recovDebt.score / 100) * 0.5)}` }}
              transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
            />
            <text x="54" y="46" textAnchor="middle" fill="#ffffff"
              style={{ fontFamily: MONO, fontWeight: 700, fontSize: 20 }}>
              {recovDebt.score}
            </text>
            <text x="54" y="57" textAnchor="middle" fill="#2a2a50" fontSize="8" letterSpacing="1">/ 100</text>
          </svg>
          <span style={{ position: 'absolute', left: 2, bottom: 0, fontFamily: BC, fontSize: 10, color: '#2a2a50' }}>0</span>
          <span style={{ position: 'absolute', right: 2, bottom: 0, fontFamily: BC, fontSize: 10, color: '#2a2a50' }}>100</span>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: 20, background: dc.bg, border: `1px solid ${dc.border}`, marginBottom: 7 }}>
            <span style={{ fontFamily: BC, fontSize: 13, fontWeight: 800, letterSpacing: '0.06em', color: dc.color }}>
              {dc.label}
            </span>
          </div>
          <p style={{ fontFamily: DM, fontSize: 13, color: '#c0c0e0', lineHeight: 1.55 }}>
            {recovDebt.recommendation}
          </p>
        </div>
      </div>

      {/* 30-day trend sparkline */}
      {recovDebt.trend.length > 5 && (() => {
        const vals = recovDebt.trend.map(t => t.debt);
        const max  = Math.max(...vals, 1);
        const W = 280, H = 52;
        const pts = vals.map((v, i) => {
          const x = (i / (vals.length - 1)) * W;
          const y = H - (v / max) * (H - 4);
          return `${x},${y}`;
        }).join(' ');
        const last = vals[vals.length - 1];
        const lastY = H - (last / max) * (H - 4);

        return (
          <div style={{ borderTop: '1px solid #16162a', paddingTop: 12, marginBottom: 12 }}>
            <p style={{ fontFamily: BC, fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#2a2a50', marginBottom: 8 }}>
              30-DAY TREND
            </p>
            <svg width="100%" height={H + 8} viewBox={`0 0 ${W} ${H + 8}`} preserveAspectRatio="none" style={{ display: 'block' }}>
              <line x1="0" y1={H * 0.5} x2={W} y2={H * 0.5} stroke="#0d0d1f" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="0" y1={H} x2={W} y2={H} stroke="#16162a" strokeWidth="1" />
              <polyline points={`0,${H} ${pts} ${W},${H}`} fill={`${dc.color}15`} stroke="none" />
              <polyline points={pts} fill="none" stroke={dc.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx={W} cy={lastY} r="5" fill={dc.color} opacity="0.25" />
              <circle cx={W} cy={lastY} r="3" fill={dc.color} />
            </svg>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              <span style={{ fontFamily: BC, fontSize: 11, color: '#2a2a50' }}>30 days ago</span>
              <span style={{ fontFamily: BC, fontSize: 11, color: '#2a2a50' }}>Today</span>
            </div>
          </div>
        );
      })()}

      {/* Red-day incidents */}
      {recovDebt.incidents.length > 0 && (
        <div style={{ borderTop: '1px solid #16162a', paddingTop: 12, marginBottom: 12 }}>
          <p style={{ fontFamily: BC, fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#2a2a50', marginBottom: 7 }}>
            RED DAY WORKOUTS — RECENT
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {recovDebt.incidents.slice(-4).reverse().map((inc, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 8, padding: '7px 10px' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'hsl(2 84% 60%)', flexShrink: 0 }} />
                <span style={{ fontFamily: DM, fontSize: 12, color: '#c06060', flex: 1 }}>
                  Trained on Red day — {new Date(inc.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
                <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: 'hsl(2 84% 60%)' }}>+20pts</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {recovDebt.daysSinceHigh !== null && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#07070f', borderRadius: 8, padding: '8px 12px' }}>
          <span style={{ fontFamily: BC, fontSize: 12, color: '#404070' }}>Last HIGH debt period:</span>
          <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700, color: recovDebt.daysSinceHigh < 7 ? 'hsl(2 84% 60%)' : 'hsl(77 100% 58%)' }}>
            {recovDebt.daysSinceHigh === 0 ? 'Today' : `${recovDebt.daysSinceHigh}d ago`}
          </span>
        </div>
      )}
    </motion.div>
  );
}

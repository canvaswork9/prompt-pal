import { motion } from 'framer-motion';
import type { LongevityScore } from './longevity-utils';
import { BC, MONO, PILLAR_LABEL, PILLAR_VAL, STAT_LABEL, TREND_LABEL, TREND_COLOR, TREND_ICON, SEC_LABEL } from './longevity-utils';

interface Props { score: LongevityScore; }

export function LongevityBreakdown({ score }: Props) {
  const pillars = [
    { label: 'GREEN DAYS', value: score.greenRate,    color: 'hsl(77 100% 58%)' },
    { label: 'SLEEP',      value: score.sleepScore,   color: 'hsl(245 100% 70%)' },
    { label: 'TRAINING',   value: score.trainingRate, color: 'hsl(38 88% 58%)' },
    { label: 'HEART RATE', value: score.hrScore,      color: 'hsl(158 70% 55%)' },
  ];

  return (
    <>
      {/* Stats grid */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <p style={{ ...SEC_LABEL, marginBottom: 10 }}>BREAKDOWN</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
          <div className="rounded-xl p-3.5" style={{ background: '#0d0d1f', border: '1px solid #16162a' }}>
            <p style={STAT_LABEL}>GREEN DAYS</p>
            <p style={{ fontFamily: MONO, fontWeight: 700, fontSize: 26, color: 'hsl(77 100% 58%)', letterSpacing: '-0.02em', marginTop: 4 }}>
              {score.greenRate}<span style={{ fontSize: 14 }}>%</span>
            </p>
            <p style={{ ...TREND_LABEL, color: TREND_COLOR[score.greenTrend] }}>
              {TREND_ICON[score.greenTrend]} {score.greenDays}G · {score.yellowDays}Y · {score.redDays}R
            </p>
          </div>
          <div className="rounded-xl p-3.5" style={{ background: '#0d0d1f', border: '1px solid #16162a' }}>
            <p style={STAT_LABEL}>AVG SLEEP</p>
            <p style={{ fontFamily: MONO, fontWeight: 700, fontSize: 26, color: 'hsl(245 100% 70%)', letterSpacing: '-0.02em', marginTop: 4 }}>
              {score.avgSleep}<span style={{ fontSize: 14 }}>h</span>
            </p>
            <p style={{ ...TREND_LABEL, color: TREND_COLOR[score.sleepTrend] }}>
              {TREND_ICON[score.sleepTrend]} {score.sleepTrend}
            </p>
          </div>
          <div className="rounded-xl p-3.5" style={{ background: '#0d0d1f', border: '1px solid #16162a' }}>
            <p style={STAT_LABEL}>RESTING HR</p>
            <p style={{ fontFamily: MONO, fontWeight: 700, fontSize: 26, color: 'hsl(158 70% 55%)', letterSpacing: '-0.02em', marginTop: 4 }}>
              {score.avgHR > 0 ? <>{score.avgHR}<span style={{ fontSize: 14 }}>bpm</span></> : '—'}
            </p>
            <p style={{ ...TREND_LABEL, color: TREND_COLOR[score.hrTrend] }}>
              {TREND_ICON[score.hrTrend]} {score.hrTrend}
            </p>
          </div>
          <div className="rounded-xl p-3.5" style={{ background: '#0d0d1f', border: '1px solid #16162a' }}>
            <p style={STAT_LABEL}>TRAINING</p>
            <p style={{ fontFamily: MONO, fontWeight: 700, fontSize: 26, color: 'hsl(38 88% 58%)', letterSpacing: '-0.02em', marginTop: 4 }}>
              {score.workoutsPerWeek}<span style={{ fontSize: 14 }}>/wk</span>
            </p>
            <p style={{ ...TREND_LABEL, color: '#404070' }}>target: 4 sessions</p>
          </div>
        </div>
      </motion.div>

      {/* Score pillars */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="rounded-xl p-4"
        style={{ background: '#0d0d1f', border: '1px solid #16162a' }}
      >
        <p style={SEC_LABEL}>SCORE PILLARS</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {pillars.map(({ label, value, color }) => (
            <div key={label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={PILLAR_LABEL}>{label}</span>
                <span style={{ ...PILLAR_VAL, color }}>{value}</span>
              </div>
              <div style={{ height: 6, background: '#111125', borderRadius: 3, overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: 0 }} animate={{ width: `${value}%` }}
                  transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
                  style={{ height: 6, background: color, borderRadius: 3 }}
                />
              </div>
            </div>
          ))}
        </div>
        <p style={{ fontFamily: BC, fontSize: 11, color: '#2a2a50', marginTop: 12, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          WEIGHTED: GREEN 40% · SLEEP 30% · TRAINING 20% · HR 10%
        </p>
      </motion.div>
    </>
  );
}

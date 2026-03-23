import { motion } from 'framer-motion';
import type { BioAge } from './longevity-utils';
import { BC, DM, MONO, SEC_LABEL } from './longevity-utils';

interface Props { bioAge: BioAge; bodyFatPct?: number; }

export function LongevityBioAge({ bioAge, bodyFatPct }: Props) {
  const deltaAbs   = Math.abs(bioAge.delta);
  const isYounger  = bioAge.delta < 0;
  const isOlder    = bioAge.delta > 0;
  const accentColor = isYounger ? 'hsl(77 100% 58%)' : isOlder ? 'hsl(2 84% 60%)' : 'hsl(245 100% 70%)';
  const bgGlow      = isYounger ? 'rgba(186,255,41,0.06)' : isOlder ? 'rgba(239,68,68,0.06)' : 'rgba(108,99,255,0.06)';

  const factors = [
    { label: 'Resting HR', adj: bioAge.hrAdj,      icon: '❤️' },
    { label: 'Sleep',      adj: bioAge.sleepAdj,   icon: '😴' },
    { label: 'Resilience', adj: bioAge.greenAdj,   icon: '⚡' },
    { label: 'Training',   adj: bioAge.trainAdj,   icon: '🏋️' },
    ...(bioAge.hasBodyComp ? [{ label: 'Body Fat', adj: bioAge.bodyFatAdj, icon: '📊' }] : []),
  ];

  const biomarkers = [
    { label: 'HRV — Heart Rate Variability',      source: 'Whoop · Oura · Garmin',  unlocked: false },
    { label: 'VO2max',                             source: 'Apple Watch · Garmin',   unlocked: false },
    { label: 'Body composition (muscle / fat %)',  source: bodyFatPct ? `${bodyFatPct}% body fat logged ✓` : 'Settings → Body Composition', unlocked: !!bodyFatPct },
    { label: 'Metabolic markers (glucose, HbA1c)', source: 'Blood panel',            unlocked: false },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
      className="rounded-xl p-4"
      style={{ background: '#0d0d1f', border: `1px solid ${accentColor}30`, boxShadow: `0 0 32px ${bgGlow}` }}
    >
      <p style={SEC_LABEL}>FITNESS AGE ESTIMATE</p>

      {/* Main numbers row */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <p style={{ fontFamily: BC, fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#404070', marginBottom: 2 }}>FITNESS AGE</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontFamily: MONO, fontWeight: 700, fontSize: 48, color: accentColor, letterSpacing: '-0.03em', lineHeight: 1 }}>{bioAge.bioAge}</span>
            <span style={{ fontFamily: BC, fontSize: 14, fontWeight: 600, color: accentColor }}>yrs</span>
          </div>
        </div>

        <div style={{ textAlign: 'center', paddingBottom: 6 }}>
          <p style={{ fontFamily: BC, fontSize: 11, color: '#2a2a50', letterSpacing: '0.06em', marginBottom: 2 }}>VS</p>
          <div style={{ padding: '4px 12px', borderRadius: 20, background: isYounger ? 'rgba(186,255,41,0.1)' : isOlder ? 'rgba(239,68,68,0.1)' : 'rgba(108,99,255,0.1)', border: `1px solid ${accentColor}40` }}>
            <span style={{ fontFamily: BC, fontWeight: 800, fontSize: 14, letterSpacing: '0.04em', color: accentColor }}>
              {isYounger ? `${deltaAbs}Y YOUNGER` : isOlder ? `${deltaAbs}Y OLDER` : 'ON TRACK'}
            </span>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <p style={{ fontFamily: BC, fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#404070', marginBottom: 2 }}>CALENDAR AGE</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, justifyContent: 'flex-end' }}>
            <span style={{ fontFamily: MONO, fontWeight: 700, fontSize: 32, color: '#404070', letterSpacing: '-0.03em', lineHeight: 1 }}>{bioAge.chronAge}</span>
            <span style={{ fontFamily: BC, fontSize: 13, fontWeight: 600, color: '#404070' }}>yrs</span>
          </div>
        </div>
      </div>

      {/* Factor breakdown */}
      <div style={{ borderTop: '1px solid #16162a', paddingTop: 12 }}>
        <p style={{ fontFamily: BC, fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#2a2a50', marginBottom: 8 }}>FACTORS USED</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {factors.map(({ label, adj, icon }) => {
            const adjColor = adj < 0 ? 'hsl(77 100% 58%)' : adj > 0 ? 'hsl(2 84% 60%)' : 'hsl(245 100% 70%)';
            return (
              <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#07070f', borderRadius: 8, padding: '7px 10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 13 }}>{icon}</span>
                  <span style={{ fontFamily: BC, fontSize: 12, fontWeight: 600, color: '#606090', letterSpacing: '0.02em' }}>{label}</span>
                </div>
                <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700, color: adjColor }}>
                  {adj === 0 ? '±0' : adj > 0 ? `+${adj}` : `${adj}`}y
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Unlock fuller picture */}
      <div style={{ borderTop: '1px solid #16162a', paddingTop: 12, marginTop: 12 }}>
        <p style={{ fontFamily: BC, fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#2a2a50', marginBottom: 8 }}>UNLOCK FULLER PICTURE</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {biomarkers.map(({ label, source, unlocked }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: unlocked ? 'rgba(186,255,41,0.05)' : '#07070f', borderRadius: 8, border: unlocked ? '1px solid rgba(186,255,41,0.2)' : '1px solid #111125' }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: unlocked ? 'hsl(77 100% 58%)' : '#1e1e3a', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <span style={{ fontFamily: DM, fontSize: 12, color: unlocked ? '#c0c0e0' : '#404070' }}>{label}</span>
                <span style={{ fontFamily: BC, fontSize: 10, color: unlocked ? 'hsl(77 100% 58%)' : '#2a2a50', letterSpacing: '0.04em', marginLeft: 6 }}>— {source}</span>
              </div>
              <span style={{ fontFamily: BC, fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: unlocked ? 'hsl(77 100% 58%)' : '#2a2a50', background: unlocked ? 'rgba(186,255,41,0.1)' : '#111125', padding: '2px 7px', borderRadius: 10 }}>
                {unlocked ? 'ACTIVE' : 'SOON'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <p style={{ fontFamily: DM, fontSize: 11, color: '#2a2a50', marginTop: 12, lineHeight: 1.6 }}>
        Based on cardiovascular and recovery markers only — resting HR, sleep, resilience, and training consistency. True biological age requires body composition, HRV, VO2max, and blood markers. This is a fitness-based estimate, not a medical assessment.
      </p>
    </motion.div>
  );
}

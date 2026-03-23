import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { OnboardingData, Sex, FitnessGoal, ExperienceLevel } from '@/lib/types';

/* ─────────────────────────────────────────
   ONBOARDING — Apex Dark Premium
   6 steps · animated · full-screen
───────────────────────────────────────── */

interface Props {
  onComplete: (data: OnboardingData) => void;
}

const BC   = "'Barlow Condensed', sans-serif";
const DM   = "'DM Sans', sans-serif";
const MONO = "'JetBrains Mono', monospace";

const TOTAL = 7;

const OnboardingPage = ({ onComplete }: Props) => {
  const [step, setStep]   = useState(0);
  const [dir,  setDir]    = useState(1);

  const [name,       setName]   = useState('');
  const [age,        setAge]    = useState(28);
  const [sex,        setSex]    = useState<Sex>('other');
  const [height,     setHeight] = useState(170);
  const [weight,     setWeight] = useState(70);
  const [goal,       setGoal]   = useState<FitnessGoal>('general');
  const [experience, setExp]    = useState<ExperienceLevel>('intermediate');

  const go   = (n: number) => { setDir(n > step ? 1 : -1); setStep(n); };
  const next = () => go(step + 1);
  const back = () => go(step - 1);

  const finish = () => onComplete({
    display_name: name.trim() || 'Athlete',
    age, sex, fitness_goal: goal, experience, height_cm: height, weight_kg: weight,
  });

  const slide = {
    enter:  (d: number) => ({ opacity: 0, x: d > 0 ? 48 : -48 }),
    center: { opacity: 1, x: 0 },
    exit:   (d: number) => ({ opacity: 0, x: d > 0 ? -48 : 48 }),
  };

  const progress = ((step + 1) / TOTAL) * 100;

  // Shared option button
  const Opt = ({
    active, onClick, icon, label, sub, accentColor,
  }: {
    active: boolean; onClick: () => void;
    icon: string; label: string; sub?: string; accentColor?: string;
  }) => {
    const color = accentColor ?? 'hsl(245 100% 70%)';
    return (
      <button onClick={onClick} style={{
        width: '100%', padding: '13px 16px',
        borderRadius: 12, border: active ? `1px solid ${color}60` : '1px solid #16162a',
        background: active ? `${color}12` : '#0d0d1f',
        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12,
        boxShadow: active ? `0 0 16px ${color}12` : 'none',
        transition: 'all 0.15s',
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: active ? `${color}20` : '#111125',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18,
        }}>{icon}</div>
        <div style={{ flex: 1, textAlign: 'left' }}>
          <div style={{ fontFamily: BC, fontWeight: 700, fontSize: 15, letterSpacing: '0.02em', color: active ? '#ffffff' : '#c0c0e0' }}>{label}</div>
          {sub && <div style={{ fontSize: 12, color: '#404070', marginTop: 1 }}>{sub}</div>}
        </div>
        {active && <div style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0 }} />}
      </button>
    );
  };

  // Stepper label
  const StepLabel = ({ n }: { n: number }) => (
    <p style={{ fontFamily: BC, fontSize: 12, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#404070', marginBottom: 10 }}>
      STEP {n} OF {TOTAL - 1}
    </p>
  );

  // Section heading
  const H = ({ children }: { children: React.ReactNode }) => (
    <h2 style={{ fontFamily: BC, fontWeight: 800, fontSize: 'clamp(28px,8vw,42px)', color: '#ffffff', letterSpacing: '0.01em', lineHeight: 0.92, textTransform: 'uppercase', marginBottom: 8 }}>
      {children}
    </h2>
  );

  // Sub text
  const Sub = ({ children }: { children: React.ReactNode }) => (
    <p style={{ fontSize: 14, color: '#404070', marginBottom: 28, lineHeight: 1.5 }}>{children}</p>
  );

  // Spinner input (age/height)
  const Spinner = ({ label, val, min, max, color, unit, onChange }: {
    label: string; val: number; min: number; max: number;
    color: string; unit: string; onChange: (v: number) => void;
  }) => (
    <div style={{ background: '#0d0d1f', border: '1px solid #16162a', borderRadius: 12, padding: '14px 16px' }}>
      <p style={{ fontFamily: BC, fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#404070', marginBottom: 10 }}>{label}</p>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <button onClick={() => onChange(Math.max(min, val - 1))}
          style={{ width: 36, height: 36, borderRadius: 8, background: '#111125', border: '1px solid #16162a', color: color, fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>−</button>
        <span style={{ fontFamily: MONO, fontWeight: 700, fontSize: 30, color, letterSpacing: '-0.02em' }}>
          {val}<span style={{ fontSize: 14, color: '#404070', fontFamily: DM, fontWeight: 400 }}> {unit}</span>
        </span>
        <button onClick={() => onChange(Math.min(max, val + 1))}
          style={{ width: 36, height: 36, borderRadius: 8, background: '#111125', border: '1px solid #16162a', color: color, fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>+</button>
      </div>
      <input type="range" min={min} max={max} value={val} onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: color }} />
    </div>
  );

  return (
    <div style={{ minHeight: '100dvh', background: '#06060c', display: 'flex', flexDirection: 'column', fontFamily: DM }}>

      {/* Progress bar */}
      <div style={{ height: 3, background: '#111125', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50 }}>
        <motion.div style={{ height: 3, background: 'linear-gradient(90deg, hsl(245 100% 70%), hsl(77 100% 58%))' }}
          animate={{ width: `${progress}%` }} transition={{ duration: 0.4, ease: 'easeOut' }} />
      </div>

      {/* Header */}
      <div style={{ padding: '22px 24px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: 480, margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ fontSize: 18 }}>⚡</span>
          <span style={{ fontFamily: BC, fontWeight: 800, fontSize: 15, color: '#ffffff', letterSpacing: '0.04em', textTransform: 'uppercase' }}>FitDecide</span>
        </div>
        <span style={{ fontFamily: MONO, fontSize: 11, color: '#2a2a50' }}>{step + 1} / {TOTAL}</span>
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '28px 24px 16px', maxWidth: 480, margin: '0 auto', width: '100%' }}>
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div key={step} custom={dir} variants={slide}
            initial="enter" animate="center" exit="exit"
            transition={{ duration: 0.22, ease: 'easeOut' }}>

            {/* ── STEP 0: WELCOME ── */}
            {step === 0 && (
              <div>
                <p style={{ fontFamily: BC, fontSize: 12, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#404070', marginBottom: 14 }}>WELCOME</p>
                <h1 style={{ fontFamily: BC, fontWeight: 800, fontSize: 'clamp(38px,11vw,58px)', color: '#ffffff', letterSpacing: '0.01em', lineHeight: 0.88, textTransform: 'uppercase', marginBottom: 18 }}>
                  KNOW BEFORE<br />
                  <span style={{ color: 'hsl(245 100% 72%)' }}>YOU TRAIN</span>
                </h1>
                <p style={{ fontSize: 15, color: '#606090', lineHeight: 1.65, marginBottom: 32 }}>
                  Every day your body sends signals — sleep, heart rate, soreness. FitDecide reads them and tells you exactly how hard to train today.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { icon: '⚡', text: 'Daily readiness score in 60 seconds' },
                    { icon: '🧬', text: 'Longevity tracking — fitness age & recovery debt' },
                    { icon: '🤖', text: 'AI coach that knows your body data' },
                  ].map(({ icon, text }) => (
                    <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#0d0d1f', borderRadius: 10, border: '1px solid #16162a' }}>
                      <span style={{ fontSize: 16, flexShrink: 0 }}>{icon}</span>
                      <span style={{ fontSize: 13, color: '#c0c0e0' }}>{text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── STEP 1: NAME ── */}
            {step === 1 && (
              <div>
                <StepLabel n={1} />
                <H>WHAT'S YOUR<br />NAME?</H>
                <Sub>We'll personalise your experience.</Sub>
                <input
                  type="text" value={name} onChange={e => setName(e.target.value)}
                  placeholder="Your name or nickname" autoFocus
                  style={{
                    width: '100%', padding: '16px 18px',
                    background: '#0d0d1f', border: '1px solid rgba(108,99,255,0.4)',
                    borderRadius: 12, outline: 'none',
                    fontFamily: BC, fontWeight: 700, fontSize: 20,
                    color: '#ffffff', letterSpacing: '0.02em',
                  }}
                  onKeyDown={e => e.key === 'Enter' && name.trim() && next()}
                />
                {name.trim() && (
                  <motion.p initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                    style={{ fontFamily: BC, fontSize: 14, color: 'hsl(77 100% 58%)', marginTop: 10, letterSpacing: '0.04em' }}>
                    Let's go, {name.trim().toUpperCase()} ⚡
                  </motion.p>
                )}
              </div>
            )}

            {/* ── STEP 2: AGE + HEIGHT ── */}
            {step === 2 && (
              <div>
                <StepLabel n={2} />
                <H>YOUR BODY<br />BASICS</H>
                <Sub>Used to calculate TDEE and longevity metrics.</Sub>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <Spinner label="Age" val={age} min={16} max={80} color="hsl(245 100% 70%)" unit="yrs" onChange={setAge} />
                  <Spinner label="Height" val={height} min={140} max={220} color="hsl(77 100% 58%)" unit="cm" onChange={setHeight} />
                </div>
              </div>
            )}

            {/* ── STEP 3: WEIGHT ── */}
            {step === 3 && (
              <div>
                <StepLabel n={3} />
                <H>CURRENT<br />WEIGHT</H>
                <Sub>Used to calculate your calorie targets and macros.</Sub>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <Spinner label="Weight" val={weight} min={30} max={250} color="hsl(38 88% 58%)" unit="kg" onChange={setWeight} />
                </div>
              </div>
            )}

            {/* ── STEP 4: SEX ── */}
            {step === 4 && (
              <div>
                <StepLabel n={3} />
                <H>BIOLOGICAL<br />SEX</H>
                <Sub>Used to calculate accurate BMR and calorie targets.</Sub>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {([
                    { val: 'male',   icon: '♂', label: 'Male',   sub: 'Higher BMR baseline' },
                    { val: 'female', icon: '♀', label: 'Female', sub: 'Adjusted hormonal factors' },
                    { val: 'other',  icon: '◎', label: 'Prefer not to say', sub: 'Average estimate used' },
                  ] as { val: Sex; icon: string; label: string; sub: string }[]).map(o => (
                    <Opt key={o.val} active={sex === o.val} onClick={() => setSex(o.val)}
                      icon={o.icon} label={o.label} sub={o.sub} />
                  ))}
                </div>
              </div>
            )}

            {/* ── STEP 5: GOAL ── */}
            {step === 5 && (
              <div>
                <StepLabel n={4} />
                <H>PRIMARY<br />GOAL</H>
                <Sub>Shapes your calorie targets and training style.</Sub>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {([
                    { val: 'muscle',   icon: '💪', label: 'Build Muscle',    sub: 'Surplus calories · progressive overload', color: 'hsl(245 100% 70%)' },
                    { val: 'fat_loss', icon: '🔥', label: 'Lose Fat',        sub: 'Calorie deficit · preserve lean mass',    color: 'hsl(2 84% 60%)' },
                    { val: 'strength', icon: '🏋️', label: 'Get Stronger',   sub: 'Max strength · low rep heavy training',   color: 'hsl(38 88% 58%)' },
                    { val: 'general',  icon: '⚡', label: 'General Fitness', sub: 'Balanced performance & health',           color: 'hsl(77 100% 58%)' },
                  ] as { val: FitnessGoal; icon: string; label: string; sub: string; color: string }[]).map(o => (
                    <Opt key={o.val} active={goal === o.val} onClick={() => setGoal(o.val)}
                      icon={o.icon} label={o.label} sub={o.sub} accentColor={o.color} />
                  ))}
                </div>
              </div>
            )}

            {/* ── STEP 6: EXPERIENCE ── */}
            {step === 6 && (
              <div>
                <StepLabel n={6} />
                <H>TRAINING<br />EXPERIENCE</H>
                <Sub>Sets exercise selection and volume.</Sub>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                  {([
                    { val: 'beginner',     icon: '🌱', label: 'Beginner',     sub: 'Under 1 year · learning the basics' },
                    { val: 'intermediate', icon: '⚡', label: 'Intermediate', sub: '1–3 years · comfortable with major lifts' },
                    { val: 'advanced',     icon: '🏆', label: 'Advanced',     sub: '3+ years · optimising performance' },
                  ] as { val: ExperienceLevel; icon: string; label: string; sub: string }[]).map(o => (
                    <Opt key={o.val} active={experience === o.val} onClick={() => setExp(o.val)}
                      icon={o.icon} label={o.label} sub={o.sub} />
                  ))}
                </div>
                {/* Profile summary */}
                <div style={{ background: '#0d0d1f', border: '1px solid rgba(108,99,255,0.2)', borderRadius: 12, padding: '12px 16px' }}>
                  <p style={{ fontFamily: BC, fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#2a2a50', marginBottom: 10 }}>YOUR PROFILE</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {[
                      { label: 'Name',    val: (name.trim() || 'Athlete').toUpperCase() },
                      { label: 'Age',     val: `${age} YRS` },
                      { label: 'Height',  val: `${height} CM` },
                      { label: 'Weight',  val: `${weight} KG` },
                      { label: 'Goal',    val: goal.replace('_', ' ').toUpperCase() },
                    ].map(({ label, val }) => (
                      <div key={label}>
                        <div style={{ fontFamily: BC, fontSize: 10, color: '#2a2a50', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</div>
                        <div style={{ fontFamily: BC, fontWeight: 700, fontSize: 13, color: '#e8e8ff', marginTop: 2, letterSpacing: '0.02em' }}>{val}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer buttons */}
      <div style={{
        padding: '12px 24px',
        paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
        maxWidth: 480, margin: '0 auto', width: '100%',
        display: 'flex', gap: 10,
      }}>
        {step > 0 && (
          <button onClick={back} style={{
            flex: 1, padding: '14px', borderRadius: 12,
            border: '1px solid #16162a', background: '#0d0d1f',
            color: '#404070', fontFamily: BC, fontWeight: 700,
            fontSize: 13, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer',
          }}>← BACK</button>
        )}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={step === TOTAL - 1 ? finish : next}
          disabled={step === 1 && !name.trim()}
          style={{
            flex: step > 0 ? 2 : 1, padding: '16px', borderRadius: 12, border: 'none',
            background: step === TOTAL - 1 ? 'hsl(77 100% 58%)' : 'hsl(245 100% 70%)',
            color: step === TOTAL - 1 ? 'hsl(240 60% 3%)' : '#ffffff',
            fontFamily: BC, fontWeight: 800, fontSize: 15,
            letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer',
            opacity: step === 1 && !name.trim() ? 0.35 : 1,
            boxShadow: step === TOTAL - 1
              ? '0 4px 24px rgba(186,255,41,0.3)'
              : '0 4px 20px rgba(108,99,255,0.22)',
          }}
        >
          {step === 0 ? "LET'S GO →" : step === TOTAL - 1 ? '⚡ START FITDECIDE' : 'CONTINUE →'}
        </motion.button>
      </div>
    </div>
  );
};

export default OnboardingPage;

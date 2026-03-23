import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import SkeletonLoader from '@/components/SkeletonLoader';

import {
  calcLongevityScore,
  calcRecoveryDebt,
  calcBioAge,
  generateInsights,
  type DayData,
  type WorkoutDay,
  type UserProfile,
  BC,
} from '@/components/longevity/longevity-utils';
import { LongevityScoreHero }    from '@/components/longevity/LongevityScoreHero';
import { LongevityBioAge }       from '@/components/longevity/LongevityBioAge';
import { LongevityRecoveryDebt } from '@/components/longevity/LongevityRecoveryDebt';
import { LongevityDotGrid }      from '@/components/longevity/LongevityDotGrid';
import { LongevityBreakdown }    from '@/components/longevity/LongevityBreakdown';
import { LongevityInsights }     from '@/components/longevity/LongevityInsights';
import { LongevityCoach }        from '@/components/longevity/LongevityCoach';

const LongevityPage = () => {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const [loading, setLoading]         = useState(true);
  const [days, setDays]               = useState<DayData[]>([]);
  const [workouts, setWorkouts]       = useState<WorkoutDay[]>([]);
  const [profile, setProfile]         = useState<UserProfile>({ age: null });
  const [bodyFatPct, setBodyFatPct]   = useState<number | undefined>(undefined);
  const [coachMsg, setCoachMsg]       = useState('');
  const [coachLoading, setCoachLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const ago   = new Date(); ago.setDate(ago.getDate() - 90);
    const since = ago.toISOString().slice(0, 10);

    const [cRes, wRes, pRes] = await Promise.all([
      supabase.from('daily_checkins')
        .select('date, status, readiness_score, sleep_hours, resting_hr')
        .eq('user_id', user.id).gte('date', since).order('date', { ascending: true }),
      supabase.from('workout_sessions')
        .select('date').eq('user_id', user.id).gte('date', since),
      supabase.from('user_profiles')
        .select('age, body_fat_pct').eq('id', user.id).maybeSingle(),
    ]);

    const map = new Map<string, DayData>();
    for (const c of cRes.data ?? [])
      map.set(c.date, { date: c.date, status: c.status as any, readiness_score: c.readiness_score, sleep_hours: c.sleep_hours, resting_hr: c.resting_hr });

    const allDays: DayData[] = [];
    for (let i = 89; i >= 0; i--) {
      const d   = new Date(); d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      allDays.push(map.get(key) ?? { date: key, status: null, readiness_score: null, sleep_hours: null, resting_hr: null });
    }

    setDays(allDays);
    setWorkouts((wRes.data ?? []).map(w => ({ date: w.date })));
    setProfile({ age: (pRes.data as any)?.age ?? null });

    const bf = (pRes.data as any)?.body_fat_pct;
    if (bf && Number(bf) > 0) setBodyFatPct(Number(bf));

    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const loadCoach = useCallback(async (sc: ReturnType<typeof calcLongevityScore>) => {
    if (!user || sc.totalDays < 7) return;
    setCoachLoading(true);
    try {
      const prompt = `My 90-day longevity data: Score ${sc.total}/100 (${sc.grade}), Green days: ${sc.greenRate}%, Avg sleep: ${sc.avgSleep}h, Avg resting HR: ${sc.avgHR}bpm, Training: ${sc.workoutsPerWeek}/week, Sleep trend: ${sc.sleepTrend}, HR trend: ${sc.hrTrend}. Give me 3 specific, actionable recommendations to improve my longevity score over the next 30 days. Be direct and specific, no generic advice. Max 120 words.`;

      const { data, error } = await supabase.functions.invoke('ai-coach', {
        body: { messages: [{ role: 'user', content: prompt }], userId: user.id },
      });

      if (error) throw error;

      const text = data?.message ?? data?.choices?.[0]?.message?.content ?? data?.content?.[0]?.text ?? data?.response ?? data?.reply ?? '';
      setCoachMsg(text || 'Coaching plan ready. Check back after a few more check-ins for more personalized advice.');
    } catch (err) {
      console.error('Longevity coach error:', err);
      setCoachMsg('');
    }
    setCoachLoading(false);
  }, [user]);

  const score     = calcLongevityScore(days, workouts);
  const bioAge    = calcBioAge(score, profile.age, bodyFatPct);
  const recovDebt = calcRecoveryDebt(days, workouts);
  const insights  = generateInsights(score);

  useEffect(() => {
    if (!loading && score.totalDays >= 7) loadCoach(score);
  }, [loading]); // eslint-disable-line

  if (loading) return <SkeletonLoader />;

  return (
    <div className="min-h-screen max-w-lg mx-auto flex flex-col pb-28">
      <div className="px-4 sm:px-5 pt-4 sm:pt-5 space-y-4">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 style={{ fontFamily: BC, fontWeight: 800, fontSize: 'clamp(32px,9vw,48px)', letterSpacing: '0.01em', textTransform: 'uppercase', color: '#ffffff', lineHeight: 0.95 }}>
              Longevity
            </h1>
            <p style={{ fontFamily: BC, fontSize: 12, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#404070', marginTop: 5 }}>
              90-DAY CONSISTENCY REPORT
            </p>
          </div>
          <button onClick={() => navigate(-1)}
            style={{ fontFamily: BC, fontSize: 13, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#404070', marginTop: 4 }}>
            ← BACK
          </button>
        </div>

        <LongevityScoreHero score={score} />

        {bioAge.hasAge && score.totalDays >= 7 && (
          <LongevityBioAge bioAge={bioAge} bodyFatPct={bodyFatPct} />
        )}

        {score.totalDays >= 3 && (
          <LongevityRecoveryDebt recovDebt={recovDebt} />
        )}

        <LongevityDotGrid days={days} />

        <LongevityBreakdown score={score} />

        <LongevityInsights insights={insights} />

        <LongevityCoach
          score={score}
          coachMsg={coachMsg}
          coachLoading={coachLoading}
          onGenerate={() => loadCoach(score)}
        />

        {/* CTA */}
        <button
          onClick={() => navigate('/app')}
          style={{
            width: '100%', padding: '16px', borderRadius: 14, border: 'none',
            background: 'hsl(77 100% 58%)', color: 'hsl(240 60% 3%)',
            fontFamily: BC, fontWeight: 800, fontSize: 16,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            cursor: 'pointer', boxShadow: '0 4px 24px rgba(186,255,41,0.25)',
          }}>
          ⚡ LOG TODAY'S CHECK-IN
        </button>

      </div>
    </div>
  );
};

export default LongevityPage;

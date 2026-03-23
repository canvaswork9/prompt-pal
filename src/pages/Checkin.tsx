import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import type { SleepQuality, YesterdayTraining, MuscleSoreness, NutritionLoad } from '@/lib/types';
import ReadinessRing from '@/components/ReadinessRing';
import ResultCard from '@/components/ResultCard';
import { useCheckin } from '@/hooks/useCheckin';
import { useAuth } from '@/hooks/useAuth';
import { useGamification, XP_AWARDS } from '@/hooks/useGamification';
import XPBar from '@/components/XPBar';
import XPToast from '@/components/XPToast';
import LevelUpOverlay from '@/components/LevelUpOverlay';

// ── Streak Card ─────────────────────────────────────────────────
const StreakCard = ({
  streakDays,
  longestStreak,
  checkedInToday,
}: {
  streakDays: number;
  longestStreak: number;
  checkedInToday: boolean;
}) => {
  if (streakDays === 0 && checkedInToday) return null;

  // Milestone thresholds for next goal
  const milestones  = [3, 7, 14, 30, 60, 100];
  const nextMile    = milestones.find(m => m > streakDays) ?? streakDays + 1;
  const pct         = Math.min(100, Math.round((streakDays / nextMile) * 100));
  const isAtRisk    = !checkedInToday && streakDays > 0;
  const isPR        = streakDays > 0 && streakDays >= longestStreak;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-4 card-shadow"
      style={{
        background: isAtRisk
          ? 'rgba(239,68,68,0.08)'
          : streakDays >= 7
          ? 'rgba(251,191,36,0.08)'
          : 'rgba(108,99,255,0.08)',
        border: isAtRisk
          ? '1px solid rgba(239,68,68,0.3)'
          : streakDays >= 7
          ? '1px solid rgba(251,191,36,0.3)'
          : '1px solid rgba(108,99,255,0.25)',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* Flame icon — pulses if at risk */}
          <motion.span
            animate={isAtRisk ? { scale: [1, 1.15, 1] } : {}}
            transition={{ duration: 0.8, repeat: Infinity }}
            style={{ fontSize: 28, lineHeight: 1 }}
          >
            🔥
          </motion.span>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono font-bold text-2xl leading-none"
                style={{ color: isAtRisk ? 'hsl(2 84% 60%)' : streakDays >= 7 ? 'hsl(38 88% 58%)' : 'hsl(245 100% 72%)' }}>
                {streakDays}
              </span>
              <span className="text-xs text-muted-foreground font-medium">
                day{streakDays !== 1 ? 's' : ''} streak
              </span>
              {isPR && streakDays > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded font-bold"
                  style={{ background: 'rgba(186,255,41,0.15)', color: 'hsl(77 100% 58%)' }}>
                  🏆 PR
                </span>
              )}
            </div>
            {isAtRisk ? (
              <p className="text-[11px] text-status-red font-medium mt-0.5">
                ⚠️ Check in today to keep your streak!
              </p>
            ) : checkedInToday ? (
              <p className="text-[11px] text-muted-foreground mt-0.5">
                ✓ Checked in today
              </p>
            ) : (
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Next goal: {nextMile} days
              </p>
            )}
          </div>
        </div>

        {/* Best streak badge */}
        {longestStreak > 0 && (
          <div className="text-right">
            <div className="text-[10px] text-muted-foreground">Best</div>
            <div className="font-mono font-bold text-sm">{longestStreak}</div>
          </div>
        )}
      </div>

      {/* Progress bar to next milestone */}
      {!checkedInToday && streakDays > 0 && (
        <div>
          <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
            <span>{streakDays} days</span>
            <span>{nextMile} days</span>
          </div>
          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{
                background: isAtRisk
                  ? 'hsl(2 84% 60%)'
                  : streakDays >= 7
                  ? 'hsl(38 88% 58%)'
                  : 'hsl(245 100% 70%)',
              }}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
};

// ── Main Page ────────────────────────────────────────────────────
const CheckinPage = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const {
    data, setData, result, submitted, setSubmitted,
    loading, saving, save, existingId, displayName,
  } = useCheckin();
  const gam = useGamification();
  const [xpToast, setXpToast]       = useState<{ amount: number; reason: string } | null>(null);
  const [expandedCard, setExpandedCard] = useState<number | null>(0);

  const handleSave = async () => {
    const isNew = !existingId;
    const ok = await save();
    if (ok && isNew) {
      await gam.awardXP(XP_AWARDS.checkin, 'checkin', 'Daily check-in');
      setXpToast({ amount: XP_AWARDS.checkin, reason: 'Daily Check-in' });
      await gam.updateStreak();
      if (result.status === 'Green') {
        await gam.awardXP(XP_AWARDS.green_day, 'green_day', 'Green readiness day');
      }
      await gam.reload();
    }
  };

  const cardDelay = (i: number) => ({
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { delay: i * 0.08, duration: 0.4 },
  });

  const OptionButton = ({
    active, onClick, children,
  }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
    <Button variant="status" data-active={active} onClick={onClick} className="flex-1 text-xs sm:text-sm">
      {children}
    </Button>
  );

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="h-8 bg-muted rounded-lg animate-pulse w-48" />
        <div className="h-20 bg-muted rounded-2xl animate-pulse" />
        <div className="h-32 bg-muted rounded-xl animate-pulse" />
        <div className="h-32 bg-muted rounded-xl animate-pulse" />
      </div>
    );
  }

  if (submitted) {
    return <ResultCard result={result} data={data} onBack={() => setSubmitted(false)} />;
  }

  const now     = new Date();
  const dayName = now.toLocaleDateString('en-US', { weekday: 'long' });
  const dateStr = now.toLocaleDateString('en-US', { day: 'numeric', month: 'long' });

  const checkedInToday = !!existingId;

  const cards = [
    {
      i: 0, icon: '😴', label: t('sleep_label'),
      summary: `${data.sleep_hours.toFixed(1)}h`,
      summaryColor: data.sleep_hours < 6 ? 'text-status-red' : data.sleep_hours < 7.5 ? 'text-status-yellow' : 'text-accent',
      content: (
        <div className="space-y-2 pt-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">4h</span>
            <span className="font-mono text-primary">{data.sleep_hours.toFixed(1)} {t('hrs')}</span>
            <span className="text-muted-foreground">12h</span>
          </div>
          <Slider value={[data.sleep_hours]}
            onValueChange={v => setData(d => ({ ...d, sleep_hours: v[0] }))}
            min={4} max={12} step={0.5} />
        </div>
      ),
    },
    {
      i: 1, icon: '💤', label: t('sleep_quality_label'),
      summary: data.sleep_quality,
      summaryColor: data.sleep_quality === 'poor' ? 'text-status-red' : data.sleep_quality === 'ok' ? 'text-status-yellow' : 'text-accent',
      content: (
        <div className="flex gap-2 pt-1">
          {(['poor', 'ok', 'good'] as SleepQuality[]).map(q => (
            <OptionButton key={q} active={data.sleep_quality === q}
              onClick={() => { setData(d => ({ ...d, sleep_quality: q })); setExpandedCard(2); }}>
              {q === 'poor' ? '😣' : q === 'ok' ? '😐' : '😊'} {t(q === 'good' ? 'great' : q)}
            </OptionButton>
          ))}
        </div>
      ),
    },
    {
      i: 2, icon: '❤️', label: t('hr_label'),
      summary: `${data.resting_hr} bpm`,
      summaryColor: '',
      content: (
        <div className="space-y-2 pt-1">
          <div className="flex justify-between text-sm items-center">
            <span className="text-[10px] text-muted-foreground">40<br/>low</span>
            <span className="font-mono text-primary text-base">{data.resting_hr} bpm
              <span className="ml-1.5 text-[10px] font-normal text-muted-foreground">
                {data.resting_hr <= 55 ? '✓ athlete' : data.resting_hr <= 65 ? '✓ normal' : data.resting_hr <= 75 ? '⚡ elevated' : '⚠ high'}
              </span>
            </span>
            <span className="text-[10px] text-muted-foreground">100<br/>high</span>
          </div>
          <Slider value={[data.resting_hr]}
            onValueChange={v => setData(d => ({ ...d, resting_hr: v[0] }))}
            min={40} max={100} step={1} />
          <div className="flex justify-between text-[9px] text-muted-foreground/60 px-0.5">
            <span>≤55 athlete</span><span>56–65 normal</span><span>66–75 elevated</span><span>76+ high</span>
          </div>
        </div>
      ),
    },
    {
      i: 3, icon: '🏃', label: t('yesterday_label'),
      summary: data.yesterday_training,
      summaryColor: '',
      content: (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 pt-1">
          {(['none', 'cardio', 'upper', 'lower', 'full'] as YesterdayTraining[]).map(v => (
            <OptionButton key={v} active={data.yesterday_training === v}
              onClick={() => { setData(d => ({ ...d, yesterday_training: v })); setExpandedCard(4); }}>
              {t(v)}
            </OptionButton>
          ))}
        </div>
      ),
    },
    {
      i: 4, icon: '💢', label: t('soreness_label'),
      summary: data.muscle_soreness,
      summaryColor: data.muscle_soreness === 'full' ? 'text-status-red' : data.muscle_soreness === 'none' ? 'text-accent' : 'text-status-yellow',
      content: (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          {(['none', 'upper', 'lower', 'full'] as MuscleSoreness[]).map(v => (
            <OptionButton key={v} active={data.muscle_soreness === v}
              onClick={() => { setData(d => ({ ...d, muscle_soreness: v })); setExpandedCard(5); }}>
              {t(v)}
            </OptionButton>
          ))}
        </div>
      ),
    },
    {
      i: 5, icon: '🍽️', label: t('nutrition_label'),
      summary: data.nutrition_load,
      summaryColor: '',
      content: (
        <div className="grid grid-cols-3 gap-2 pt-1">
          {(['deficit', 'maintenance', 'surplus'] as NutritionLoad[]).map(v => (
            <OptionButton key={v} active={data.nutrition_load === v}
              onClick={() => { setData(d => ({ ...d, nutrition_load: v })); setExpandedCard(null); }}>
              {v === 'deficit' ? '🔻' : v === 'maintenance' ? '⚖️' : '📈'} {t(v)}
            </OptionButton>
          ))}
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      <LevelUpOverlay level={gam.levelUpTo} onDismiss={gam.dismissLevelUp} />
      <XPToast amount={xpToast?.amount ?? null} reason={xpToast?.reason ?? ''} onDone={() => setXpToast(null)} />

      {/* XP Bar */}
      {!gam.loading && (
        <XPBar totalXP={gam.totalXP} level={gam.level} streakDays={gam.streakDays}
          tierEmoji={gam.tierEmoji} tierName={gam.tierName} />
      )}

      {/* Streak Card — prominently above the form */}
      {!gam.loading && (
        <StreakCard
          streakDays={gam.streakDays}
          longestStreak={gam.longestStreak}
          checkedInToday={checkedInToday}
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-display-hero text-foreground leading-none">
            {t('greeting')},<br />
            <span style={{ color: 'hsl(var(--primary))' }}>
              {displayName || user?.email?.split('@')[0] || 'You'}
            </span>
          </h1>
          <p className="text-sub mt-2">{dayName}, {dateStr}</p>
          <div className="mt-3">
            {result.status === 'Green' ? (
              <span className="reward-pill text-[10px]">● GREEN — TRAIN HARD</span>
            ) : result.status === 'Yellow' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wide"
                style={{ background: 'hsl(38 88% 58% / 0.12)', color: 'hsl(38 88% 58%)', border: '1px solid hsl(38 88% 58% / 0.25)' }}>
                ● MODERATE — TRAIN SMART
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wide bg-status-red-dim text-status-red"
                style={{ border: '1px solid hsl(var(--status-red) / 0.25)' }}>
                ● REST — RECOVERY DAY
              </span>
            )}
          </div>
        </div>
        <div className="flex-shrink-0">
          <ReadinessRing
            score={result.score} status={result.status}
            size={typeof window !== 'undefined' && window.innerWidth < 400 ? 80 : 96}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input cards */}
        <div className="space-y-2">
          {cards.map(({ i, icon, label, summary, summaryColor, content }) => (
            <motion.div key={i} {...cardDelay(i)} className="bg-card rounded-xl card-shadow overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 text-left"
                onClick={() => setExpandedCard(expandedCard === i ? null : i)}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base leading-none">{icon}</span>
                  <span className="font-semibold text-sm">{label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {expandedCard !== i && (
                    <span className={`text-data-sm ${summaryColor || ''}`}>{summary}</span>
                  )}
                  <span className="text-muted-foreground text-[10px] ml-1">{expandedCard === i ? '▲' : '▼'}</span>
                </div>
              </button>
              <AnimatePresence>
                {expandedCard === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="px-4 pb-4 overflow-hidden"
                  >
                    {content}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* Desktop preview */}
        <div className="hidden lg:flex flex-col items-center justify-start pt-8 sticky top-8">
          <ReadinessRing score={result.score} status={result.status} size={220} />
          <div className="mt-4 text-center">
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
              result.status === 'Green' ? 'bg-status-green-dim text-status-green' :
              result.status === 'Yellow' ? 'bg-status-yellow-dim text-status-yellow' :
              'bg-status-red-dim text-status-red'
            }`}>
              ● {result.status} — {result.decision.split(' — ')[1] || result.decision}
            </div>
          </div>
        </div>
      </div>

      {/* Submit */}
      <Button variant="accent" size="xl" className="w-full"
        disabled={saving || submitted} onClick={handleSave}>
        {saving ? '...' : submitted ? t('analyze') + ' ✓' : t('analyze')}
      </Button>
    </div>
  );
};

export default CheckinPage;

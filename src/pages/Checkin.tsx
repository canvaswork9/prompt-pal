import { useState, useCallback } from 'react';
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

const CheckinPage = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { data, setData, result, submitted, setSubmitted, loading, saving, save, existingId, displayName } = useCheckin();
  const gam = useGamification();
  const [xpToast, setXpToast] = useState<{ amount: number; reason: string } | null>(null);
  const [expandedCard, setExpandedCard] = useState<number | null>(0);

  const handleSave = async () => {
    const isNew = !existingId;
    const ok = await save();
    if (ok && isNew) {
      // Award XP for check-in
      await gam.awardXP(XP_AWARDS.checkin, 'checkin', 'Daily check-in');
      setXpToast({ amount: XP_AWARDS.checkin, reason: 'Daily Check-in' });
      // Update streak
      await gam.updateStreak();
      // Bonus for green day
      if (result.status === 'Green') {
        await gam.awardXP(XP_AWARDS.green_day, 'green_day', 'Green readiness day');
      }
      await gam.reload();
    }
  };

  const cardDelay = (i: number) => ({ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.08, duration: 0.4 } });

  const OptionButton = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
    <Button variant="status" data-active={active} onClick={onClick} className="flex-1 text-xs sm:text-sm">
      {children}
    </Button>
  );

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="h-8 bg-muted rounded-lg animate-pulse w-48" />
        <div className="h-32 bg-muted rounded-xl animate-pulse" />
        <div className="h-32 bg-muted rounded-xl animate-pulse" />
        <div className="h-32 bg-muted rounded-xl animate-pulse" />
      </div>
    );
  }

  if (submitted) {
    return <ResultCard result={result} data={data} onBack={() => setSubmitted(false)} />;
  }

  const now = new Date();
  const dayName = now.toLocaleDateString('en-US', { weekday: 'long' });
  const dateStr = now.toLocaleDateString('en-US', { day: 'numeric', month: 'long' });

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      <LevelUpOverlay level={gam.levelUpTo} onDismiss={gam.dismissLevelUp} />
      <XPToast amount={xpToast?.amount ?? null} reason={xpToast?.reason ?? ''} onDone={() => setXpToast(null)} />

      {/* XP Bar */}
      {!gam.loading && (
        <XPBar totalXP={gam.totalXP} level={gam.level} streakDays={gam.streakDays} tierEmoji={gam.tierEmoji} tierName={gam.tierName} />
      )}

      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-display text-2xl sm:text-3xl">{t('greeting')}, {displayName || user?.email?.split('@')[0] || 'User'} 👋</h1>
        <p className="text-muted-foreground">{dayName}, {dateStr} · {t('time_to_checkin')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Column */}
        <div className="space-y-2">
          {[
            {
              i: 0, icon: '😴', label: t('sleep_label'),
              summary: `${data.sleep_hours.toFixed(1)}h`,
              summaryColor: data.sleep_hours < 6 ? 'text-status-red' : data.sleep_hours < 7.5 ? 'text-status-yellow' : 'text-status-green',
              content: (
                <div className="space-y-2 pt-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">4h</span>
                    <span className="text-data-sm">{data.sleep_hours.toFixed(1)} {t('hrs')}</span>
                    <span className="text-muted-foreground">12h</span>
                  </div>
                  <Slider value={[data.sleep_hours]} onValueChange={v => setData(d => ({ ...d, sleep_hours: v[0] }))} min={4} max={12} step={0.5} />
                </div>
              ),
            },
            {
              i: 1, icon: '💤', label: t('sleep_quality_label'),
              summary: data.sleep_quality,
              summaryColor: data.sleep_quality === 'poor' ? 'text-status-red' : data.sleep_quality === 'ok' ? 'text-status-yellow' : 'text-status-green',
              content: (
                <div className="flex gap-2 pt-1">
                  {(['poor', 'ok', 'good'] as SleepQuality[]).map(q => (
                    <OptionButton key={q} active={data.sleep_quality === q} onClick={() => { setData(d => ({ ...d, sleep_quality: q })); setExpandedCard(2); }}>
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
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">40</span>
                    <span className="text-data-sm">{data.resting_hr} {t('bpm')}</span>
                    <span className="text-muted-foreground">100</span>
                  </div>
                  <Slider value={[data.resting_hr]} onValueChange={v => setData(d => ({ ...d, resting_hr: v[0] }))} min={40} max={100} step={1} />
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
                    <OptionButton key={v} active={data.yesterday_training === v} onClick={() => { setData(d => ({ ...d, yesterday_training: v })); setExpandedCard(4); }}>
                      {t(v)}
                    </OptionButton>
                  ))}
                </div>
              ),
            },
            {
              i: 4, icon: '💢', label: t('soreness_label'),
              summary: data.muscle_soreness,
              summaryColor: data.muscle_soreness === 'full' ? 'text-status-red' : data.muscle_soreness === 'none' ? 'text-status-green' : 'text-status-yellow',
              content: (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  {(['none', 'upper', 'lower', 'full'] as MuscleSoreness[]).map(v => (
                    <OptionButton key={v} active={data.muscle_soreness === v} onClick={() => { setData(d => ({ ...d, muscle_soreness: v })); setExpandedCard(5); }}>
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
                    <OptionButton key={v} active={data.nutrition_load === v} onClick={() => { setData(d => ({ ...d, nutrition_load: v })); setExpandedCard(null); }}>
                      {v === 'deficit' ? '🔻' : v === 'maintenance' ? '⚖️' : '📈'} {t(v)}
                    </OptionButton>
                  ))}
                </div>
              ),
            },
          ].map(({ i, icon, label, summary, summaryColor, content }) => (
            <motion.div key={i} {...cardDelay(i)} className="bg-card rounded-xl card-shadow overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 text-left"
                onClick={() => setExpandedCard(expandedCard === i ? null : i)}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base leading-none">{icon}</span>
                  <span className="font-semibold text-sm tracking-tight">{label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {expandedCard !== i && (
                    <span className={`text-data-sm ${summaryColor || 'text-muted-foreground'}`}>
                      {summary}
                    </span>
                  )}
                  <span className="text-muted-foreground text-[10px]">{expandedCard === i ? '▲' : '▼'}</span>
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

        {/* Preview Column (desktop) */}
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
      <Button
        variant="accent"
        size="xl"
        className="w-full"
        disabled={saving || submitted}
        onClick={handleSave}
      >
        {saving ? '...' : submitted ? t('analyze') + ' ✓' : t('analyze')}
      </Button>
    </div>
  );
};

export default CheckinPage;

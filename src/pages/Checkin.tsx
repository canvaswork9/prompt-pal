import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
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
        <div className="space-y-4">
          {/* Sleep Duration */}
          <motion.div {...cardDelay(0)} className="bg-card rounded-xl p-4 card-shadow space-y-3">
            <div>
              <div className="flex items-center gap-2 font-semibold">😴 {t('sleep_label')}</div>
              <p className="text-xs text-muted-foreground">{t('sleep_note')}</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>4h</span>
                <span className="font-mono text-primary">{data.sleep_hours.toFixed(1)} {t('hrs')}</span>
                <span>12h</span>
              </div>
              <Slider value={[data.sleep_hours]} onValueChange={v => setData(d => ({ ...d, sleep_hours: v[0] }))} min={4} max={12} step={0.5} />
              <div className="flex gap-1 justify-center">
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${data.sleep_hours < 6 ? 'bg-status-red-dim text-status-red' : data.sleep_hours < 7.5 ? 'bg-status-yellow-dim text-status-yellow' : 'bg-status-green-dim text-status-green'}`}>
                  {data.sleep_hours < 6 ? '🔴' : data.sleep_hours < 7.5 ? '🟡' : '🟢'}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Sleep Quality */}
          <motion.div {...cardDelay(1)} className="bg-card rounded-xl p-4 card-shadow space-y-3">
            <div>
              <div className="flex items-center gap-2 font-semibold">💤 {t('sleep_quality_label')}</div>
              <p className="text-xs text-muted-foreground">{t('sleep_quality_note')}</p>
            </div>
            <div className="flex gap-2">
              {(['poor', 'ok', 'good'] as SleepQuality[]).map(q => (
                <OptionButton key={q} active={data.sleep_quality === q} onClick={() => setData(d => ({ ...d, sleep_quality: q }))}>
                  {q === 'poor' ? '😣' : q === 'ok' ? '😐' : '😊'} {t(q === 'good' ? 'great' : q)}
                </OptionButton>
              ))}
            </div>
          </motion.div>

          {/* Resting HR */}
          <motion.div {...cardDelay(2)} className="bg-card rounded-xl p-4 card-shadow space-y-3">
            <div>
              <div className="flex items-center gap-2 font-semibold">❤️ {t('hr_label')}</div>
              <p className="text-xs text-muted-foreground">{t('hr_note')}</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>40</span>
                <span className="font-mono text-primary">{data.resting_hr} {t('bpm')}</span>
                <span>100</span>
              </div>
              <Slider value={[data.resting_hr]} onValueChange={v => setData(d => ({ ...d, resting_hr: v[0] }))} min={40} max={100} step={1} />
            </div>
          </motion.div>

          {/* Yesterday Training */}
          <motion.div {...cardDelay(3)} className="bg-card rounded-xl p-4 card-shadow space-y-3">
            <div>
              <div className="flex items-center gap-2 font-semibold">🏃 {t('yesterday_label')}</div>
              <p className="text-xs text-muted-foreground">{t('yesterday_note')}</p>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {(['none', 'cardio', 'upper', 'lower', 'full'] as YesterdayTraining[]).map(v => (
                <OptionButton key={v} active={data.yesterday_training === v} onClick={() => setData(d => ({ ...d, yesterday_training: v }))}>
                  {t(v)}
                </OptionButton>
              ))}
            </div>
          </motion.div>

          {/* Soreness */}
          <motion.div {...cardDelay(4)} className="bg-card rounded-xl p-4 card-shadow space-y-3">
            <div>
              <div className="flex items-center gap-2 font-semibold">💢 {t('soreness_label')}</div>
              <p className="text-xs text-muted-foreground">{t('soreness_note')}</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['none', 'upper', 'lower', 'full'] as MuscleSoreness[]).map(v => (
                <OptionButton key={v} active={data.muscle_soreness === v} onClick={() => setData(d => ({ ...d, muscle_soreness: v }))}>
                  {t(v)}
                </OptionButton>
              ))}
            </div>
          </motion.div>

          {/* Nutrition */}
          <motion.div {...cardDelay(5)} className="bg-card rounded-xl p-4 card-shadow space-y-3">
            <div>
              <div className="flex items-center gap-2 font-semibold">🍽️ {t('nutrition_label')}</div>
              <p className="text-xs text-muted-foreground">{t('nutrition_note')}</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(['deficit', 'maintenance', 'surplus'] as NutritionLoad[]).map(v => (
                <OptionButton key={v} active={data.nutrition_load === v} onClick={() => setData(d => ({ ...d, nutrition_load: v }))}>
                  {v === 'deficit' ? '🔻' : v === 'maintenance' ? '⚖️' : '📈'} {t(v)}
                </OptionButton>
              ))}
            </div>
          </motion.div>
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
        disabled={saving}
        onClick={handleSave}
      >
        {saving ? '...' : t('analyze')}
      </Button>
    </div>
  );
};

export default CheckinPage;

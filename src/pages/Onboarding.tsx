import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import type { OnboardingData, FitnessGoal, ExperienceLevel, Sex } from '@/lib/types';

interface OnboardingPageProps {
  onComplete: (data: OnboardingData) => void;
}

const OnboardingPage = ({ onComplete }: OnboardingPageProps) => {
  const { t } = useLanguage();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<OnboardingData>({
    display_name: '',
    age: 28,
    sex: 'male',
    fitness_goal: 'muscle',
    experience: 'intermediate',
    height_cm: 170,
  });

  const goals: { key: FitnessGoal; label: string; desc: string }[] = [
    { key: 'muscle', label: t('muscle'), desc: t('muscle_desc') },
    { key: 'fat_loss', label: t('fat_loss'), desc: t('fat_loss_desc') },
    { key: 'strength', label: t('strength'), desc: t('strength_desc') },
    { key: 'general', label: t('general'), desc: t('general_desc') },
  ];

  const levels: { key: ExperienceLevel; label: string; desc: string }[] = [
    { key: 'beginner', label: t('beginner'), desc: t('beginner_desc') },
    { key: 'intermediate', label: t('intermediate'), desc: t('intermediate_desc') },
    { key: 'advanced', label: t('advanced'), desc: t('advanced_desc') },
  ];

  const sexOptions: { key: Sex; label: string }[] = [
    { key: 'male', label: t('male') },
    { key: 'female', label: t('female') },
    { key: 'other', label: t('prefer_not') },
  ];

  const canNext = step === 0 ? data.display_name.length > 0 : true;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center gap-2 mb-8">
          {[0, 1, 2].map(i => (
            <div key={i} className={`w-2.5 h-2.5 rounded-full transition-colors duration-300 ${i === step ? 'bg-primary' : i < step ? 'bg-primary/50' : 'bg-secondary'}`} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {step === 0 && (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <h1 className="text-display text-2xl">{t('welcome')}</h1>
                  <p className="text-muted-foreground">{t('lets_setup')}</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">{t('display_name')}</label>
                    <Input
                      value={data.display_name}
                      onChange={e => setData(d => ({ ...d, display_name: e.target.value }))}
                      placeholder="Alex"
                      className="bg-card border-border"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">{t('age')}: <span className="font-mono text-primary">{data.age}</span></label>
                    <Slider value={[data.age]} onValueChange={v => setData(d => ({ ...d, age: v[0] }))} min={16} max={65} step={1} className="py-2" />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      {t('height')}: <span className="font-mono text-primary">{data.height_cm ?? 170} cm</span>
                    </label>
                    <Slider
                      value={[data.height_cm ?? 170]}
                      onValueChange={v => setData(d => ({ ...d, height_cm: v[0] }))}
                      min={140} max={220} step={1} className="py-2"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">{t('bio_sex')}</label>
                    <p className="text-xs text-muted-foreground mb-2">{t('bio_sex_note')}</p>
                    <div className="grid grid-cols-3 gap-2">
                      {sexOptions.map(opt => (
                        <Button
                          key={opt.key}
                          variant="status"
                          data-active={data.sex === opt.key}
                          onClick={() => setData(d => ({ ...d, sex: opt.key }))}
                          className="w-full"
                        >
                          {opt.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-6">
                <h2 className="text-display text-2xl text-center">{t('whats_goal')}</h2>
                <div className="space-y-3">
                  {goals.map(g => (
                    <button
                      key={g.key}
                      onClick={() => setData(d => ({ ...d, fitness_goal: g.key }))}
                      className={`w-full p-4 rounded-xl text-left transition-all duration-200 card-shadow ${
                        data.fitness_goal === g.key
                          ? 'bg-primary/10 border border-primary'
                          : 'bg-card border border-transparent hover:bg-secondary'
                      }`}
                    >
                      <div className="font-semibold">{g.label}</div>
                      <div className="text-sm text-muted-foreground">{g.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <h2 className="text-display text-2xl text-center">{t('experience_q')}</h2>
                <div className="space-y-3">
                  {levels.map(l => (
                    <button
                      key={l.key}
                      onClick={() => setData(d => ({ ...d, experience: l.key }))}
                      className={`w-full p-4 rounded-xl text-left transition-all duration-200 card-shadow ${
                        data.experience === l.key
                          ? 'bg-primary/10 border border-primary'
                          : 'bg-card border border-transparent hover:bg-secondary'
                      }`}
                    >
                      <div className="font-semibold">{l.label}</div>
                      <div className="text-sm text-muted-foreground">{l.desc}</div>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground text-center">Don't worry — you can change this anytime.</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="flex gap-3 mt-8">
          {step > 0 && (
            <Button variant="outline" onClick={() => setStep(s => s - 1)} className="flex-1">
              {t('back')}
            </Button>
          )}
          <Button
            variant="accent"
            disabled={!canNext}
            onClick={() => {
              if (step < 2) setStep(s => s + 1);
              else onComplete(data);
            }}
            className="flex-1"
          >
            {step < 2 ? t('next') : t('finish')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;

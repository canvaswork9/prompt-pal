import { useLanguage } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { useState } from 'react';

const SettingsPage = () => {
  const { t, lang, setLang } = useLanguage();
  const [name, setName] = useState('Alex');
  const [weight, setWeight] = useState(75);
  const [baselineHR, setBaselineHR] = useState(60);

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
      <h1 className="text-display text-2xl">{t('settings')}</h1>

      {/* Profile */}
      <div className="bg-card rounded-xl p-5 card-shadow space-y-4">
        <h2 className="font-semibold">Profile</h2>

        <div>
          <label className="text-sm text-muted-foreground block mb-1">{t('display_name')}</label>
          <Input value={name} onChange={e => setName(e.target.value)} className="bg-secondary" />
        </div>

        <div>
          <label className="text-sm text-muted-foreground block mb-1">Weight (kg): <span className="font-mono text-primary">{weight}</span></label>
          <Slider value={[weight]} onValueChange={v => setWeight(v[0])} min={40} max={150} step={0.5} />
        </div>

        <div>
          <label className="text-sm text-muted-foreground block mb-1">Baseline HR: <span className="font-mono text-primary">{baselineHR} bpm</span></label>
          <Slider value={[baselineHR]} onValueChange={v => setBaselineHR(v[0])} min={40} max={90} step={1} />
        </div>
      </div>

      {/* Language */}
      <div className="bg-card rounded-xl p-5 card-shadow space-y-4">
        <h2 className="font-semibold">Language / ภาษา</h2>
        <div className="flex gap-2">
          <Button variant={lang === 'en' ? 'default' : 'outline'} onClick={() => setLang('en')}>English</Button>
          <Button variant={lang === 'th' ? 'default' : 'outline'} onClick={() => setLang('th')}>ไทย</Button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-card rounded-xl p-5 card-shadow space-y-4">
        <h2 className="font-semibold text-destructive">{t('logout')}</h2>
        <Button variant="destructive">{t('logout')}</Button>
      </div>
    </div>
  );
};

export default SettingsPage;

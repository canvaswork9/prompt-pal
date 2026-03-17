import { useLanguage } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

const ACTIVITY_OPTIONS: { key: ActivityLevel; label: string; sub: string }[] = [
  { key: 'sedentary',   label: 'Sedentary',   sub: 'Desk job, no exercise' },
  { key: 'light',       label: 'Light',        sub: '1–3x per week' },
  { key: 'moderate',    label: 'Moderate',     sub: '3–5x per week' },
  { key: 'active',      label: 'Active',       sub: '6–7x per week' },
  { key: 'very_active', label: 'Very Active',  sub: 'Athlete / 2x per day' },
];

const SettingsPage = () => {
  const { t, lang, setLang } = useLanguage();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [age, setAge] = useState(25);
  const [weight, setWeight] = useState(75);
  const [height, setHeight] = useState(170);
  const [baselineHR, setBaselineHR] = useState(60);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderate');
  const [savedName, setSavedName] = useState('');
  const [savedAge, setSavedAge] = useState(25);
  const [savedWeight, setSavedWeight] = useState(75);
  const [savedHeight, setSavedHeight] = useState(170);
  const [savedHR, setSavedHR] = useState(60);
  const [savedActivity, setSavedActivity] = useState<ActivityLevel>('moderate');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const isDirty = name !== savedName
    || age !== savedAge
    || weight !== savedWeight
    || baselineHR !== savedHR
    || height !== savedHeight
    || activityLevel !== savedActivity;

  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }
        const { data } = await supabase
          .from('user_profiles')
          .select('display_name, age, weight_kg, baseline_hr, language, height_cm, activity_level')
          .eq('id', user.id)
          .maybeSingle();
        if (data) {
          const n  = data.display_name || '';
          const a  = (data as any).age || 25;
          const w  = Number(data.weight_kg) || 75;
          const hr = data.baseline_hr || 60;
          const h  = (data as any).height_cm || 170;
          const al = (data as any).activity_level || 'moderate';
          setName(n);  setAge(a);   setWeight(w);  setBaselineHR(hr);
          setHeight(h); setActivityLevel(al as ActivityLevel);
          setSavedName(n); setSavedAge(a); setSavedWeight(w); setSavedHR(hr);
          setSavedHeight(h); setSavedActivity(al as ActivityLevel);
          if (data.language === 'th' || data.language === 'en') setLang(data.language);
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      }
      setLoading(false);
    }
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not logged in');
      const { error } = await supabase.from('user_profiles').update({
        display_name: name,
        age: age,
        weight_kg: weight,
        baseline_hr: baselineHR,
        height_cm: height,
        activity_level: activityLevel,
        language: lang,
        updated_at: new Date().toISOString(),
      } as any).eq('id', user.id);
      if (error) throw error;
      toast.success('Settings saved!');
      setSavedName(name);
      setSavedAge(age);
      setSavedWeight(weight);
      setSavedHR(baselineHR);
      setSavedHeight(height);
      setSavedActivity(activityLevel);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleLangChange = async (newLang: 'en' | 'th') => {
    setLang(newLang);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from('user_profiles').update({
        language: newLang,
        updated_at: new Date().toISOString(),
      }).eq('id', user.id);
      toast.success(newLang === 'th' ? 'เปลี่ยนภาษาแล้ว' : 'Language changed');
    } catch (err) {
      console.error('Failed to save language:', err);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  if (loading) return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="h-8 bg-muted rounded-lg animate-pulse w-32" />
      <div className="h-48 bg-muted rounded-xl animate-pulse" />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
      <h1 className="text-display text-2xl">{t('settings')}</h1>

      <div className="bg-card rounded-xl p-5 card-shadow space-y-4">
        <h2 className="font-semibold">Profile</h2>

        {/* Display name */}
        <div>
          <label className="text-sm text-muted-foreground block mb-1">{t('display_name')}</label>
          <Input value={name} onChange={e => setName(e.target.value)} className="bg-secondary" />
        </div>

        {/* Age */}
        <div>
          <label className="text-sm text-muted-foreground block mb-1">
            Age: <span className="font-mono text-primary">{age}</span>
          </label>
          <Slider value={[age]} onValueChange={v => setAge(v[0])} min={16} max={65} step={1} />
        </div>

        {/* Weight */}
        <div>
          <label className="text-sm text-muted-foreground block mb-1">
            Weight (kg): <span className="font-mono text-primary">{weight}</span>
          </label>
          <Slider value={[weight]} onValueChange={v => setWeight(v[0])} min={40} max={150} step={0.5} />
        </div>

        {/* Height */}
        <div>
          <label className="text-sm text-muted-foreground block mb-1">
            {t('height')} (cm): <span className="font-mono text-primary">{height}</span>
          </label>
          <Slider value={[height]} onValueChange={v => setHeight(v[0])} min={140} max={220} step={1} />
        </div>

        {/* Baseline HR */}
        <div>
          <label className="text-sm text-muted-foreground block mb-1">
            Baseline HR: <span className="font-mono text-primary">{baselineHR} bpm</span>
          </label>
          <Slider value={[baselineHR]} onValueChange={v => setBaselineHR(v[0])} min={40} max={90} step={1} />
        </div>

        {/* Activity Level */}
        <div>
          <label className="text-sm text-muted-foreground block mb-2">Activity Level</label>
          <div className="space-y-2">
            {ACTIVITY_OPTIONS.map(opt => (
              <button
                key={opt.key}
                onClick={() => setActivityLevel(opt.key)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
                  activityLevel === opt.key
                    ? 'bg-primary/10 border border-primary text-primary'
                    : 'bg-secondary border border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <span className="font-medium">{opt.label}</span>
                <span className="text-xs opacity-70">{opt.sub}</span>
              </button>
            ))}
          </div>
        </div>

        <Button
          onClick={handleSave}
          disabled={saving || !isDirty}
          className={isDirty ? 'ring-2 ring-primary ring-offset-2 ring-offset-card' : ''}
        >
          {saving ? 'Saving...' : isDirty ? 'Save Changes ●' : 'Saved ✓'}
        </Button>
      </div>

      {/* Language */}
      <div className="bg-card rounded-xl p-5 card-shadow space-y-4">
        <h2 className="font-semibold">Language / ภาษา</h2>
        <div className="flex gap-2">
          <Button variant={lang === 'en' ? 'default' : 'outline'} onClick={() => handleLangChange('en')}>English</Button>
          <Button variant={lang === 'th' ? 'default' : 'outline'} onClick={() => handleLangChange('th')}>ไทย</Button>
        </div>
      </div>

      {/* Logout */}
      <div className="bg-card rounded-xl p-5 card-shadow space-y-4">
        <h2 className="font-semibold text-destructive">{t('logout')}</h2>
        <Button variant="destructive" onClick={handleLogout}>{t('logout')}</Button>
      </div>
    </div>
  );
};

export default SettingsPage;

import { useLanguage } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const SettingsPage = () => {
  const { t, lang, setLang } = useLanguage();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [weight, setWeight] = useState(75);
  const [baselineHR, setBaselineHR] = useState(60);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }
        const { data } = await supabase.from('user_profiles').select('display_name, weight_kg, baseline_hr, language').eq('id', user.id).maybeSingle();
        if (data) {
          if (data.display_name) setName(data.display_name);
          if (data.weight_kg) setWeight(Number(data.weight_kg));
          if (data.baseline_hr) setBaselineHR(data.baseline_hr);
          if (data.language === 'th' || data.language === 'en') setLang(data.language);
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      }
      setLoading(false);
    }
    load();
  }, [setLang]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not logged in');
      const { error } = await supabase.from('user_profiles').update({
        display_name: name,
        weight_kg: weight,
        baseline_hr: baselineHR,
        language: lang,
        updated_at: new Date().toISOString(),
      }).eq('id', user.id);
      if (error) throw error;
      toast.success('Settings saved!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  if (loading) return <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6"><div className="h-8 bg-muted rounded-lg animate-pulse w-32" /><div className="h-48 bg-muted rounded-xl animate-pulse" /></div>;

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
      <h1 className="text-display text-2xl">{t('settings')}</h1>

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
        <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Profile'}</Button>
      </div>

      <div className="bg-card rounded-xl p-5 card-shadow space-y-4">
        <h2 className="font-semibold">Language / ภาษา</h2>
        <div className="flex gap-2">
          <Button variant={lang === 'en' ? 'default' : 'outline'} onClick={() => setLang('en')}>English</Button>
          <Button variant={lang === 'th' ? 'default' : 'outline'} onClick={() => setLang('th')}>ไทย</Button>
        </div>
      </div>

      <div className="bg-card rounded-xl p-5 card-shadow space-y-4">
        <h2 className="font-semibold text-destructive">{t('logout')}</h2>
        <Button variant="destructive" onClick={handleLogout}>{t('logout')}</Button>
      </div>
    </div>
  );
};

export default SettingsPage;

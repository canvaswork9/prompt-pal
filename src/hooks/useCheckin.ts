import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { calculateReadiness } from '@/lib/decision-engine';
import type { CheckinData, ReadinessResult } from '@/lib/types';
import { toast } from 'sonner';

const todayStr = () => new Date().toISOString().slice(0, 10);

export function useCheckin() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [existingId, setExistingId] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [data, setData] = useState<CheckinData>({
    sleep_hours: 7,
    sleep_quality: 'ok',
    resting_hr: 62,
    yesterday_training: 'none',
    muscle_soreness: 'none',
    nutrition_load: 'maintenance',
  });

  // Load today's checkin if it exists
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data: checkin } = await supabase
        .from('daily_checkins')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', todayStr())
        .maybeSingle();

      if (checkin) {
        setData({
          sleep_hours: Number(checkin.sleep_hours),
          sleep_quality: (checkin.sleep_quality as CheckinData['sleep_quality']) || 'ok',
          resting_hr: checkin.resting_hr ?? 62,
          yesterday_training: (checkin.yesterday_training as CheckinData['yesterday_training']) || 'none',
          muscle_soreness: (checkin.muscle_soreness as CheckinData['muscle_soreness']) || 'none',
          nutrition_load: (checkin.nutrition_load as CheckinData['nutrition_load']) || 'maintenance',
        });
        setExistingId(checkin.id);
        if (checkin.readiness_score) setSubmitted(true);
      }
      setLoading(false);
    }
    load();
  }, []);

  const result: ReadinessResult = calculateReadiness(data);

  const save = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not logged in');

      const row = {
        user_id: user.id,
        date: todayStr(),
        sleep_hours: data.sleep_hours,
        sleep_quality: data.sleep_quality,
        resting_hr: data.resting_hr,
        yesterday_training: data.yesterday_training,
        muscle_soreness: data.muscle_soreness,
        nutrition_load: data.nutrition_load,
        readiness_score: result.score,
        status: result.status,
        decision: result.decision,
        training_split: result.training_split,
        cardio_zone: result.cardio_zone,
        coach_message: result.coach_message,
        score_breakdown: result.score_breakdown as any,
      };

      if (existingId) {
        const { error } = await supabase.from('daily_checkins').update(row).eq('id', existingId);
        if (error) throw error;
      } else {
        const { data: inserted, error } = await supabase.from('daily_checkins').insert(row).select('id').single();
        if (error) throw error;
        setExistingId(inserted.id);
      }

      setSubmitted(true);
      toast.success('Check-in saved!');
      return true;
    } catch (err: any) {
      toast.error(err.message || 'Failed to save');
      return false;
    } finally {
      setSaving(false);
    }
  };

  return { data, setData, result, submitted, setSubmitted, loading, saving, save, existingId };
}

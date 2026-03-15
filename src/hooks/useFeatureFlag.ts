import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const flagCache: Record<string, boolean> = {};

export function useFeatureFlag(key: string): boolean {
  const [enabled, setEnabled] = useState<boolean>(flagCache[key] ?? true);

  useEffect(() => {
    supabase
      .from('feature_flags')
      .select('enabled')
      .eq('feature_key', key)
      .maybeSingle()
      .then(({ data }) => {
        const value = data?.enabled ?? true;
        flagCache[key] = value;
        setEnabled(value);
      });
  }, [key]);

  return enabled;
}

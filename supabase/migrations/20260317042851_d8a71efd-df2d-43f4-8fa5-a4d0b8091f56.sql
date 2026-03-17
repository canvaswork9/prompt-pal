
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS height_cm integer DEFAULT 170,
  ADD COLUMN IF NOT EXISTS activity_level text DEFAULT 'moderate';

CREATE TABLE IF NOT EXISTS public.weight_logs (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL,
  date       date NOT NULL,
  weight_kg  numeric(5,2) NOT NULL,
  note       text,
  source     text DEFAULT 'manual',
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);
ALTER TABLE public.weight_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own weight" ON public.weight_logs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS weight_logs_user_date ON public.weight_logs(user_id, date DESC);

CREATE TABLE IF NOT EXISTS public.weight_goals (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL,
  goal_type        text NOT NULL,
  start_weight_kg  numeric(5,2) NOT NULL,
  target_weight_kg numeric(5,2) NOT NULL,
  target_date      date,
  weekly_target_kg numeric(4,2) NOT NULL DEFAULT -0.5,
  start_date       date NOT NULL DEFAULT CURRENT_DATE,
  is_active        boolean DEFAULT true,
  created_at       timestamptz DEFAULT now()
);
ALTER TABLE public.weight_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own goals" ON public.weight_goals
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- User profiles
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  age INTEGER,
  sex TEXT CHECK (sex IN ('male','female','other')),
  weight_kg NUMERIC,
  fitness_goal TEXT CHECK (fitness_goal IN ('muscle','fat_loss','strength','general')),
  experience TEXT CHECK (experience IN ('beginner','intermediate','advanced')),
  baseline_hr INTEGER DEFAULT 60,
  language TEXT DEFAULT 'en' CHECK (language IN ('th','en')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- User roles (separate table for security)
CREATE TYPE public.app_role AS ENUM ('admin', 'user');
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

-- Feature flags
CREATE TABLE public.feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  enabled BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Daily check-ins
CREATE TABLE public.daily_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  sleep_hours NUMERIC NOT NULL,
  sleep_quality TEXT CHECK (sleep_quality IN ('good','ok','poor')),
  resting_hr INTEGER,
  yesterday_training TEXT CHECK (yesterday_training IN ('none','cardio','upper','lower','full')),
  muscle_soreness TEXT CHECK (muscle_soreness IN ('none','upper','lower','full')),
  nutrition_load TEXT CHECK (nutrition_load IN ('surplus','maintenance','deficit')),
  readiness_score INTEGER,
  status TEXT CHECK (status IN ('Green','Yellow','Red')),
  decision TEXT,
  training_split TEXT,
  cardio_zone TEXT,
  coach_message TEXT,
  score_breakdown JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Workout sessions
CREATE TABLE public.workout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  checkin_id UUID REFERENCES public.daily_checkins(id),
  date DATE NOT NULL,
  split TEXT,
  duration_min INTEGER,
  readiness_score INTEGER,
  notes TEXT,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Exercise sets
CREATE TABLE public.exercise_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.workout_sessions(id) ON DELETE CASCADE NOT NULL,
  exercise_key TEXT NOT NULL,
  exercise_name TEXT NOT NULL,
  set_number INTEGER NOT NULL,
  weight_kg NUMERIC,
  reps INTEGER,
  rpe INTEGER CHECK (rpe BETWEEN 1 AND 10),
  is_warmup BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Personal records
CREATE TABLE public.personal_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  exercise_key TEXT NOT NULL,
  weight_kg NUMERIC,
  reps INTEGER,
  estimated_1rm NUMERIC,
  achieved_at DATE,
  session_id UUID REFERENCES public.workout_sessions(id),
  UNIQUE(user_id, exercise_key)
);

-- Exercise videos
CREATE TABLE public.exercise_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_key TEXT UNIQUE NOT NULL,
  exercise_name TEXT NOT NULL,
  youtube_url TEXT,
  thumbnail_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Meal logs
CREATE TABLE public.meal_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  meal_slot TEXT CHECK (meal_slot IN ('breakfast','pre_workout','lunch','dinner','snack')),
  meal_name TEXT,
  calories INTEGER,
  protein_g NUMERIC,
  carbs_g NUMERIC,
  fat_g NUMERIC,
  eaten BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Gamification
CREATE TABLE public.user_gamification (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_xp INTEGER DEFAULT 0,
  current_level INTEGER DEFAULT 1,
  tier_name TEXT DEFAULT 'Seedling',
  active_title TEXT,
  streak_days INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_checkin DATE,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  badge_key TEXT NOT NULL,
  badge_name TEXT NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, badge_key)
);

CREATE TABLE public.xp_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  xp_amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  description TEXT,
  multiplier NUMERIC DEFAULT 1.0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_gamification ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile" ON public.user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.user_profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Anyone can read flags" ON public.feature_flags FOR SELECT USING (true);
CREATE POLICY "Admins can update flags" ON public.feature_flags FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users see own checkins" ON public.daily_checkins FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users see own sessions" ON public.workout_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users see own sets" ON public.exercise_sets FOR ALL USING (session_id IN (SELECT id FROM public.workout_sessions WHERE user_id = auth.uid()));
CREATE POLICY "Users see own PRs" ON public.personal_records FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Anyone can read videos" ON public.exercise_videos FOR SELECT USING (true);
CREATE POLICY "Admins can manage videos" ON public.exercise_videos FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users see own meals" ON public.meal_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users see own gamification" ON public.user_gamification FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users see own badges" ON public.user_badges FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users see own xp" ON public.xp_transactions FOR ALL USING (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id) VALUES (NEW.id);
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  INSERT INTO public.user_gamification (id) VALUES (NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Seed feature flags
INSERT INTO public.feature_flags (feature_key, label, description, enabled) VALUES
  ('ai_coach', 'AI Coach', 'AI-powered chat coach', true),
  ('workout_videos', 'Workout Videos', 'Embedded form guide videos', true),
  ('meal_planner', 'Meal Planner', 'Daily nutrition planning tool', true),
  ('progressive_overload', 'Progressive Overload Log', 'Set/weight tracker with progression', true),
  ('progress_analytics', 'Progress Analytics', 'Charts, trends, PRs', true),
  ('export_data', 'Export Data', 'CSV/PDF data export', true),
  ('push_notifications', 'Push Notifications', 'Daily check-in reminders', false);

-- Indexes
CREATE INDEX idx_checkins_user_date ON public.daily_checkins(user_id, date DESC);
CREATE INDEX idx_sessions_user ON public.workout_sessions(user_id, date DESC);
CREATE INDEX idx_xp_user ON public.xp_transactions(user_id, created_at DESC);

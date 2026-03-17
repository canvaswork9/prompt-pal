import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation, Navigate, useNavigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { OnboardingData } from "@/lib/types";
import LandingPage from "./pages/Landing";
import OnboardingPage from "./pages/Onboarding";
import AuthPage from "./pages/Auth";
import ResetPasswordPage from "./pages/ResetPassword";
import CheckinPage from "./pages/Checkin";
import WorkoutPage from "./pages/Workout";
import LogPage from "./pages/Log";
import MealPage from "./pages/Meal";
import ProgressPage from "./pages/Progress";
import CoachPage from "./pages/Coach";
import AdminPage from "./pages/Admin";
import SettingsPage from "./pages/Settings";
import NotFound from "./pages/NotFound";
import AppSidebar from "./components/AppSidebar";
import BottomNav from "./components/BottomNav";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Loading...</div>;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

const OnboardingWrapper = () => {
  const navigate = useNavigate();

  const handleComplete = async (data: OnboardingData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/auth'); return; }

      const { error } = await supabase.from('user_profiles').upsert({
        id: user.id,
        display_name: data.display_name,
        age: data.age,
        sex: data.sex,
        fitness_goal: data.fitness_goal,
        experience: data.experience,
        baseline_hr: 60,
        language: 'en',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });

      if (error) throw error;

      await supabase.from('user_gamification').upsert({
        id: user.id,
        total_xp: 0,
        current_level: 1,
        tier_name: 'Seedling',
        streak_days: 0,
        longest_streak: 0,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });

    } catch (err) {
      console.error('Failed to save onboarding:', err);
    }
    navigate('/app');
  };

  return <OnboardingPage onComplete={handleComplete} />;
};

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const publicPaths = ['/', '/auth', '/onboarding', '/reset-password'];
  const isPublic = publicPaths.includes(location.pathname);

  if (isPublic) return <>{children}</>;

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <main className="lg:pl-60 pb-20 lg:pb-0" style={{ paddingBottom: 'max(5rem, calc(env(safe-area-inset-bottom) + 4rem))' }}>{children}</main>
      <BottomNav />
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/onboarding" element={<ProtectedRoute><OnboardingWrapper /></ProtectedRoute>} />
            <Route path="/app" element={<ProtectedRoute><CheckinPage /></ProtectedRoute>} />
            <Route path="/workout" element={<ProtectedRoute><WorkoutPage /></ProtectedRoute>} />
            <Route path="/log" element={<ProtectedRoute><LogPage /></ProtectedRoute>} />
            <Route path="/meal" element={<ProtectedRoute><MealPage /></ProtectedRoute>} />
            <Route path="/progress" element={<ProtectedRoute><ProgressPage /></ProtectedRoute>} />
            <Route path="/coach" element={<ProtectedRoute><CoachPage /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

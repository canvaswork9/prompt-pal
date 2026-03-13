import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
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

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const publicPaths = ['/', '/auth', '/onboarding', '/reset-password'];
  const isPublic = publicPaths.includes(location.pathname);

  if (isPublic) return <>{children}</>;

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <main className="lg:pl-60 pb-20 lg:pb-0">{children}</main>
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
            <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage onComplete={() => window.location.href = '/app'} /></ProtectedRoute>} />
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

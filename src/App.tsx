import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import LandingPage from "./pages/Landing";
import OnboardingPage from "./pages/Onboarding";
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

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const isLanding = location.pathname === "/" || location.pathname === "/onboarding";

  if (isLanding) return <>{children}</>;

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
            <Route path="/onboarding" element={<OnboardingPage onComplete={() => window.location.href = '/app'} />} />
            <Route path="/app" element={<CheckinPage />} />
            <Route path="/workout" element={<WorkoutPage />} />
            <Route path="/log" element={<LogPage />} />
            <Route path="/meal" element={<MealPage />} />
            <Route path="/progress" element={<ProgressPage />} />
            <Route path="/coach" element={<CoachPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

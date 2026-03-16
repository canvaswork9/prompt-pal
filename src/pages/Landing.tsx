import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import ReadinessRing from '@/components/ReadinessRing';
import { supabase } from '@/integrations/supabase/client';

const LandingPage = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setIsLoggedIn(!!data.user);
    });
  }, []);

  const handleCTA = () => {
    if (isLoggedIn) navigate('/app');
    else navigate('/auth?mode=signup');
  };

  const handleLogin = () => {
    if (isLoggedIn) navigate('/app');
    else navigate('/auth');
  };

  const valueProps = [
    { icon: '🧠', title: 'Smart Readiness Score', desc: '6 body signals → one clear decision.\nPush hard or recover — we tell you which.' },
    { icon: '🏋️', title: 'Personalized Workout', desc: 'Your plan adjusts to your recovery.\nThe right exercises, the right intensity, today.' },
    { icon: '🍽️', title: 'Nutrition Sync', desc: 'Your meals affect your performance.\nLog food, hit targets, train better.' },
  ];

  const socialProof = [
    { icon: '🌍', text: 'Available in Thai & English' },
    { icon: '🔒', text: 'Your data stays private' },
    { icon: '⚡', text: 'Takes 60 seconds/day' },
  ];

  const howItWorks = [
    { step: '01', title: 'Check in daily', desc: 'Answer 6 quick questions about your body — sleep, heart rate, soreness. Takes 60 seconds.' },
    { step: '02', title: 'Get your score', desc: 'See your readiness score 0–100 with a clear decision: Train hard, go light, or rest.' },
    { step: '03', title: 'Follow the plan', desc: 'Get a personalized workout and meal plan for today — adjusted to exactly how ready you are.' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚡</span>
            <span className="font-display font-bold text-lg">FitDecide</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={handleLogin}>
              {isLoggedIn ? 'Go to App' : 'Log in'}
            </Button>
            <Button variant="accent" size="sm" onClick={handleCTA}>
              {isLoggedIn ? 'Dashboard →' : 'Get Started'}
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="min-h-screen flex items-center pt-16">
        <div className="container mx-auto px-4 sm:px-6 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                ⚡ FitDecide
              </div>
              <h1 className="text-display text-4xl sm:text-5xl lg:text-6xl whitespace-pre-line">
                {t('hero_headline')}
              </h1>
              <p className="text-lg text-muted-foreground max-w-lg leading-relaxed">
                {t('hero_subline')}
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button variant="hero" onClick={handleCTA}>
                  {isLoggedIn ? 'Go to Dashboard →' : t('cta_primary')}
                </Button>
                <Button variant="hero-outline" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
                  {t('cta_secondary')}
                </Button>
              </div>
              {!isLoggedIn && (
                <p className="text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <button onClick={handleLogin} className="text-primary hover:underline font-medium">
                    Log in
                  </button>
                </p>
              )}
            </motion.div>

            {/* Right — Ring Demo */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-col items-center gap-4"
            >
              <ReadinessRing score={84} status="Green" size={260} />
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-status-green-dim text-status-green text-sm font-semibold">
                ● GREEN — READY TO TRAIN
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Value Props */}
      <div id="features" className="container mx-auto px-4 sm:px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {valueProps.map((v, i) => (
            <motion.div
              key={v.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-card rounded-2xl p-6 card-shadow hover:card-shadow-hover transition-shadow"
            >
              <div className="text-3xl mb-3">{v.icon}</div>
              <h3 className="text-display text-lg mb-2">{v.title}</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">{v.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* How It Works */}
      <div className="container mx-auto px-4 sm:px-6 py-20">
        <h2 className="text-display text-3xl text-center mb-12">How it works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {howItWorks.map((item, i) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
              className="text-center space-y-3"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary font-mono font-bold text-sm">
                {item.step}
              </div>
              <h3 className="font-semibold text-lg">{item.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Social Proof */}
      <div className="container mx-auto px-4 sm:px-6 py-12">
        <div className="flex flex-wrap justify-center gap-4">
          {socialProof.map(sp => (
            <div key={sp.text} className="inline-flex items-center gap-2 px-4 py-2 bg-card rounded-full text-sm card-shadow">
              {sp.icon} {sp.text}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="container mx-auto px-4 sm:px-6 py-20 text-center">
        <h2 className="text-display text-3xl sm:text-4xl mb-4">Ready to train smarter?</h2>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">Start your daily readiness check-in. It only takes 60 seconds.</p>
        <Button variant="hero" onClick={handleCTA}>
          {isLoggedIn ? 'Go to Dashboard →' : t('cta_primary')}
        </Button>
        {!isLoggedIn && (
          <p className="text-sm text-muted-foreground mt-4">
            Already have an account?{' '}
            <button onClick={handleLogin} className="text-primary hover:underline font-medium">
              Log in
            </button>
          </p>
        )}
      </div>
    </div>
  );
};

export default LandingPage;

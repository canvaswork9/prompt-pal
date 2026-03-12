import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import ReadinessRing from '@/components/ReadinessRing';

const LandingPage = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

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

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="min-h-screen flex items-center">
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
                <Button variant="hero" onClick={() => navigate('/onboarding')}>
                  {t('cta_primary')}
                </Button>
                <Button variant="hero-outline" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
                  {t('cta_secondary')}
                </Button>
              </div>
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
        <Button variant="hero" onClick={() => navigate('/onboarding')}>
          {t('cta_primary')}
        </Button>
      </div>
    </div>
  );
};

export default LandingPage;

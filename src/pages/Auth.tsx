import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useLanguage } from '@/lib/i18n';

const AuthPage = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>(
    searchParams.get('mode') === 'signup' ? 'signup' : 'login'
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success('Check your email for reset link');
        setMode('login');
      } else if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success('Check your email to confirm signup');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate('/app');
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm space-y-6"
      >
        <div className="text-center space-y-2">
          <h1 className="text-display text-3xl">FitDecide</h1>
          <p className="text-muted-foreground text-sm">
            {mode === 'login' ? 'Sign in to continue' : mode === 'signup' ? 'Create your account' : 'Reset password'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 bg-card rounded-xl p-6 card-shadow">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="bg-secondary"
          />
          {mode !== 'forgot' && (
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              className="bg-secondary"
            />
          )}
          <Button variant="accent" className="w-full" disabled={loading}>
            {loading ? '...' : mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Sign Up' : 'Send Reset Link'}
          </Button>
        </form>

        {mode !== 'forgot' && (
          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">or</span></div>
          </div>
        )}

        {mode !== 'forgot' && (
          <Button
            variant="outline"
            className="w-full"
            onClick={async () => {
              const { error } = await lovable.auth.signInWithOAuth('google', {
                redirect_uri: window.location.origin,
              });
              if (error) toast.error(error.message);
            }}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Continue with Google
          </Button>
        )}

        <div className="text-center text-sm space-y-1">
          {mode === 'login' && (
            <>
              <button onClick={() => setMode('forgot')} className="text-primary hover:underline block mx-auto">Forgot password?</button>
              <p className="text-muted-foreground">
                No account?{' '}
                <button onClick={() => setMode('signup')} className="text-primary hover:underline">Sign up</button>
              </p>
            </>
          )}
          {mode !== 'login' && (
            <button onClick={() => setMode('login')} className="text-primary hover:underline">← Back to sign in</button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default AuthPage;

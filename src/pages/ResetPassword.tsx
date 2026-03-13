import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Check for recovery event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true);
    });
    // Also check hash
    if (window.location.hash.includes('type=recovery')) setReady(true);
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Password updated!');
      navigate('/app');
    }
    setLoading(false);
  };

  if (!ready) return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Loading...</div>;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-card rounded-xl p-6 card-shadow space-y-4">
        <h1 className="text-display text-xl text-center">Set New Password</h1>
        <Input type="password" placeholder="New password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} className="bg-secondary" />
        <Button variant="accent" className="w-full" disabled={loading}>{loading ? '...' : 'Update Password'}</Button>
      </form>
    </div>
  );
};

export default ResetPasswordPage;

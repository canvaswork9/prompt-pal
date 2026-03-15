import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import SkeletonLoader from '@/components/SkeletonLoader';

interface Flag {
  feature_key: string;
  label: string;
  enabled: boolean;
  description: string | null;
}

interface UserRow {
  id: string;
  display_name: string | null;
  created_at: string | null;
  role: string;
}

const AdminPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [flags, setFlags] = useState<Flag[]>([]);
  const [stats, setStats] = useState<{ label: string; value: string }[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function loadAdmin() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { navigate('/auth'); return; }

        // Check admin role
        const { data: isAdmin } = await supabase.rpc('has_role', {
          _user_id: user.id,
          _role: 'admin' as any,
        });
        if (!isAdmin) { navigate('/app'); toast.error('Admin access required'); return; }

        // Load all data in parallel
        const today = new Date().toISOString().slice(0, 10);
        const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);

        const [flagsRes, totalUsersRes, activeUsersRes, todayCheckinsRes, avgScoreRes, usersRes] = await Promise.all([
          supabase.from('feature_flags').select('*'),
          supabase.from('user_profiles').select('id', { count: 'exact', head: true }),
          supabase.from('daily_checkins').select('user_id', { count: 'exact', head: true }).gte('date', sevenDaysAgo),
          supabase.from('daily_checkins').select('id', { count: 'exact', head: true }).eq('date', today),
          supabase.from('daily_checkins').select('readiness_score').eq('date', today).not('readiness_score', 'is', null),
          supabase.from('user_profiles').select('id, display_name, created_at').order('created_at', { ascending: false }).limit(20),
        ]);

        if (flagsRes.data) {
          setFlags(flagsRes.data.map(f => ({
            feature_key: f.feature_key,
            label: f.label,
            enabled: f.enabled ?? true,
            description: f.description,
          })));
        }

        const avgScore = avgScoreRes.data?.length
          ? Math.round(avgScoreRes.data.reduce((s, c) => s + (c.readiness_score || 0), 0) / avgScoreRes.data.length)
          : 0;

        setStats([
          { label: 'Total Users', value: String(totalUsersRes.count ?? 0) },
          { label: 'Active (7 days)', value: String(activeUsersRes.count ?? 0) },
          { label: 'Check-ins Today', value: String(todayCheckinsRes.count ?? 0) },
          { label: 'Avg Score Today', value: String(avgScore) },
        ]);

        // Load user roles
        if (usersRes.data) {
          const userIds = usersRes.data.map(u => u.id);
          const { data: roles } = await supabase.from('user_roles').select('user_id, role').in('user_id', userIds);
          const roleMap = new Map<string, string>();
          roles?.forEach(r => roleMap.set(r.user_id, r.role));

          setUsers(usersRes.data.map(u => ({
            id: u.id,
            display_name: u.display_name,
            created_at: u.created_at,
            role: roleMap.get(u.id) || 'user',
          })));
        }

        setLoading(false);
      } catch (err) {
        console.error('Failed to load admin:', err);
        setLoading(false);
      }
    }
    loadAdmin();
  }, [navigate]);

  const toggleFlag = async (key: string, enabled: boolean) => {
    const { error } = await supabase
      .from('feature_flags')
      .update({ enabled, updated_at: new Date().toISOString() })
      .eq('feature_key', key);
    if (!error) {
      setFlags(f => f.map(fl => fl.feature_key === key ? { ...fl, enabled } : fl));
      toast.success(`${key} ${enabled ? 'enabled' : 'disabled'}`);
    } else {
      toast.error('Failed to update flag');
    }
  };

  if (loading) return <SkeletonLoader />;

  const filteredUsers = searchTerm
    ? users.filter(u => (u.display_name || '').toLowerCase().includes(searchTerm.toLowerCase()) || u.id.includes(searchTerm))
    : users;

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      <h1 className="text-display text-2xl">Admin Panel</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Feature Flags */}
        <div className="bg-card rounded-xl p-5 card-shadow">
          <h2 className="font-semibold mb-4">Feature Controls</h2>
          <div className="space-y-3">
            {flags.map(flag => (
              <div key={flag.feature_key} className="flex items-center justify-between">
                <div>
                  <span className="text-sm">{flag.label}</span>
                  {flag.description && <p className="text-[10px] text-muted-foreground">{flag.description}</p>}
                </div>
                <Switch
                  checked={flag.enabled}
                  onCheckedChange={checked => toggleFlag(flag.feature_key, checked)}
                />
              </div>
            ))}
            {flags.length === 0 && <p className="text-sm text-muted-foreground">No feature flags configured</p>}
          </div>
        </div>

        {/* Stats */}
        <div className="bg-card rounded-xl p-5 card-shadow">
          <h2 className="font-semibold mb-4">App Stats</h2>
          <div className="space-y-3">
            {stats.map(s => (
              <div key={s.label} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{s.label}</span>
                <span className="font-mono font-semibold">{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Users */}
        <div className="bg-card rounded-xl p-5 card-shadow">
          <h2 className="font-semibold mb-4">User Management</h2>
          <Input placeholder="Search users..." className="bg-secondary mb-3" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          <div className="space-y-3">
            {filteredUsers.map(u => (
              <div key={u.id} className="flex items-center justify-between text-sm">
                <div>
                  <div className="font-medium">{u.display_name || 'Unnamed'}</div>
                  <div className="text-xs text-muted-foreground">{u.created_at ? new Date(u.created_at).toLocaleDateString() : ''}</div>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${u.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground'}`}>
                  {u.role}
                </span>
              </div>
            ))}
            {filteredUsers.length === 0 && <p className="text-sm text-muted-foreground">No users found</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;

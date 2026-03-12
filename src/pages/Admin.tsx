import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';

const AdminPage = () => {
  const [flags, setFlags] = useState([
    { key: 'ai_coach', label: 'AI Coach', enabled: true },
    { key: 'workout_videos', label: 'Workout Videos', enabled: true },
    { key: 'meal_planner', label: 'Meal Planner', enabled: true },
    { key: 'progressive_overload', label: 'Progressive Overload Log', enabled: true },
    { key: 'progress_analytics', label: 'Progress Analytics', enabled: true },
    { key: 'push_notifications', label: 'Push Notifications', enabled: false },
    { key: 'export_data', label: 'Export Data', enabled: true },
  ]);

  const stats = [
    { label: 'Total Users', value: '482' },
    { label: 'Active (7 days)', value: '218' },
    { label: 'Check-ins Today', value: '67' },
    { label: 'Avg Score Today', value: '71' },
    { label: 'New this week', value: '34' },
    { label: 'Retention (30d)', value: '61%' },
  ];

  const users = [
    { name: 'Alex T.', email: 'alex@email.com', role: 'admin', joined: 'Mar 1' },
    { name: 'Sarah K.', email: 'sarah@email.com', role: 'user', joined: 'Feb 28' },
    { name: 'Somchai P.', email: 'somchai@email.com', role: 'user', joined: 'Mar 3' },
  ];

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      <h1 className="text-display text-2xl">Admin Panel</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Feature Flags */}
        <div className="bg-card rounded-xl p-5 card-shadow">
          <h2 className="font-semibold mb-4">Feature Controls</h2>
          <div className="space-y-3">
            {flags.map(flag => (
              <div key={flag.key} className="flex items-center justify-between">
                <span className="text-sm">{flag.label}</span>
                <Switch
                  checked={flag.enabled}
                  onCheckedChange={checked => setFlags(f => f.map(fl => fl.key === flag.key ? { ...fl, enabled: checked } : fl))}
                />
              </div>
            ))}
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
          <Input placeholder="Search users..." className="bg-secondary mb-3" />
          <div className="space-y-3">
            {users.map(u => (
              <div key={u.email} className="flex items-center justify-between text-sm">
                <div>
                  <div className="font-medium">{u.name}</div>
                  <div className="text-xs text-muted-foreground">{u.email}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${u.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground'}`}>
                    {u.role}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;

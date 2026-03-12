import { NavLink } from 'react-router-dom';
import { useLanguage } from '@/lib/i18n';

const sidebarItems = [
  { path: '/app', icon: '⚡', labelKey: 'checkin' as const },
  { path: '/workout', icon: '🏋️', labelKey: 'workout' as const },
  { path: '/log', icon: '📝', labelKey: 'log' as const },
  { path: '/meal', icon: '🍽️', labelKey: 'meal' as const },
  { path: '/progress', icon: '📈', labelKey: 'progress' as const },
  { path: '/coach', icon: '🤖', labelKey: 'coach' as const },
  { path: '/settings', icon: '⚙️', labelKey: 'settings' as const },
  { path: '/admin', icon: '🔧', labelKey: 'admin' as const },
];

const AppSidebar = () => {
  const { t } = useLanguage();

  return (
    <aside className="hidden lg:flex flex-col w-60 fixed left-0 top-0 bottom-0 bg-card border-r border-border p-4 z-40">
      <NavLink to="/" className="flex items-center gap-2 px-3 py-2 mb-6">
        <span className="text-xl">⚡</span>
        <span className="font-display font-bold text-lg">FitDecide</span>
      </NavLink>

      <nav className="space-y-1 flex-1">
        {sidebarItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`
            }
          >
            <span>{item.icon}</span>
            <span>{t(item.labelKey)}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default AppSidebar;

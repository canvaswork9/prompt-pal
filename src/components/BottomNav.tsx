import { NavLink, useLocation } from 'react-router-dom';
import { useLanguage } from '@/lib/i18n';

const navItems = [
  { path: '/app', icon: '⚡', labelKey: 'checkin' as const },
  { path: '/workout', icon: '🏋️', labelKey: 'workout' as const },
  { path: '/meal', icon: '🍽️', labelKey: 'meal' as const },
  { path: '/progress', icon: '📈', labelKey: 'progress' as const },
  { path: '/settings', icon: '⚙️', labelKey: 'settings' as const },
];

const BottomNav = () => {
  const { t } = useLanguage();
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border lg:hidden">
      <div className="flex justify-around items-center h-16">
        {navItems.map(item => {
          const active = location.pathname === item.path;
          return (
            <NavLink key={item.path} to={item.path} className={`flex flex-col items-center gap-0.5 px-3 py-1.5 text-xs transition-colors ${active ? 'text-primary' : 'text-muted-foreground'}`}>
              <span className="text-lg">{item.icon}</span>
              <span>{t(item.labelKey)}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;

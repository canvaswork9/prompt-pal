import { NavLink, useLocation } from 'react-router-dom';
import { useLanguage } from '@/lib/i18n';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const mainNavItems = [
  { path: '/app',      icon: '⚡', labelKey: 'checkin'  as const },
  { path: '/workout',  icon: '🏋️', labelKey: 'workout'  as const },
  { path: '/log',      icon: '📝', labelKey: 'log'      as const },
  { path: '/progress', icon: '📈', labelKey: 'progress' as const },
];

const moreItems = [
  { path: '/meal',      icon: '🍽️', label: 'Meal'      },
  { path: '/coach',     icon: '🤖', label: 'Coach'     },
  { path: '/weight',    icon: '⚖️', label: 'Weight'    },
  { path: '/dashboard', icon: '📊', label: 'Dashboard' },
  { path: '/settings',  icon: '⚙️', label: 'Settings'  },
];

const BottomNav = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const location = useLocation();
  const [showMore, setShowMore] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' })
      .then(({ data }) => setIsAdmin(!!data));
  }, [user]);

  const allMoreItems = [
    ...moreItems,
    ...(isAdmin ? [{ path: '/admin', icon: '🔧', label: 'Admin' }] : []),
  ];

  const moreActive = allMoreItems.some(i => i.path === location.pathname);

  return (
    <>
      {showMore && (
        <div
          className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm lg:hidden"
          onClick={() => setShowMore(false)}
        >
          <div
            className="absolute bottom-16 left-0 right-0 bg-card border-t border-border p-4"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {allMoreItems.map(item => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setShowMore(false)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl text-xs
                    ${location.pathname === item.path
                      ? 'bg-primary/10 text-primary'
                      : 'bg-secondary text-muted-foreground'}`}
                >
                  <span className="text-2xl">{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      )}

      <nav
        className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border lg:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex justify-around items-center h-16">
          {mainNavItems.map(item => {
            const active = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 text-xs transition-colors relative
                  ${active ? 'text-primary' : 'text-muted-foreground'}`}
              >
                {active && (
                  <span className="absolute top-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                )}
                <span className="text-lg leading-none mt-1">{item.icon}</span>
                <span className={active ? 'font-medium' : ''}>{t(item.labelKey)}</span>
              </NavLink>
            );
          })}

          <button
            onClick={() => setShowMore(!showMore)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 text-xs transition-colors
              ${moreActive || showMore ? 'text-primary' : 'text-muted-foreground'}`}
          >
            <span className="text-lg">{showMore ? '✕' : '☰'}</span>
            <span>More</span>
          </button>
        </div>
      </nav>
    </>
  );
};

export default BottomNav;

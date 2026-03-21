import { NavLink, useLocation } from 'react-router-dom';
import { useLanguage } from '@/lib/i18n';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

/* ── Main nav SVG icons ────────────────────────────────────────── */
const IconCheckin = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke={active ? 'hsl(245 100% 70%)' : 'currentColor'}
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
  </svg>
);

const IconWorkout = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke={active ? 'hsl(245 100% 70%)' : 'currentColor'}
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 5v14M18 5v14M4 9h4M16 9h4M4 15h4M16 15h4"/>
  </svg>
);

const IconLog = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke={active ? 'hsl(245 100% 70%)' : 'currentColor'}
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 11l3 3L22 4"/>
    <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
  </svg>
);

const IconStats = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke={active ? 'hsl(245 100% 70%)' : 'currentColor'}
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>
);

const IconMoreOpen = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke={active ? 'hsl(245 100% 70%)' : 'currentColor'}
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const IconMoreClosed = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke={active ? 'hsl(245 100% 70%)' : 'currentColor'}
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="5"  r="1" fill="currentColor" stroke="none"/>
    <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/>
    <circle cx="12" cy="19" r="1" fill="currentColor" stroke="none"/>
  </svg>
);

/* ── More menu SVG icons ───────────────────────────────────────── */
const IconLongevity = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
    <path d="M12 6v6l4 2"/>
  </svg>
);

const IconMeal = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zM6 1v3M10 1v3M14 1v3"/>
  </svg>
);

const IconCoach = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
    <circle cx="9"  cy="10" r="1" fill="currentColor" stroke="none"/>
    <circle cx="12" cy="10" r="1" fill="currentColor" stroke="none"/>
    <circle cx="15" cy="10" r="1" fill="currentColor" stroke="none"/>
  </svg>
);

const IconWeight = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4.5a2.5 2.5 0 000 5H6"/>
    <path d="M18 9h1.5a2.5 2.5 0 010 5H18"/>
    <rect x="6" y="7" width="12" height="10" rx="2"/>
  </svg>
);

const IconDashboard = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3"  width="7" height="7" rx="1"/>
    <rect x="14" y="3"  width="7" height="7" rx="1"/>
    <rect x="3" y="14" width="7" height="7" rx="1"/>
    <rect x="14" y="14" width="7" height="7" rx="1"/>
  </svg>
);

const IconSettings = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
  </svg>
);

const IconAdmin = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

/* ── Nav data ──────────────────────────────────────────────────── */
const mainNavItems = [
  { path: '/app',      Icon: IconCheckin, label: 'CHECK-IN' },
  { path: '/workout',  Icon: IconWorkout, label: 'WORKOUT'  },
  { path: '/log',      Icon: IconLog,     label: 'LOG'      },
  { path: '/progress', Icon: IconStats,   label: 'STATS'    },
];

const moreItems = [
  { path: '/longevity', Icon: IconLongevity, label: 'Longevity' },
  { path: '/meal',      Icon: IconMeal,      label: 'Meal'      },
  { path: '/coach',     Icon: IconCoach,     label: 'Coach'     },
  { path: '/weight',    Icon: IconWeight,    label: 'Weight'    },
  { path: '/dashboard', Icon: IconDashboard, label: 'Dashboard' },
  { path: '/settings',  Icon: IconSettings,  label: 'Settings'  },
];

/* ── Component ─────────────────────────────────────────────────── */
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
    ...(isAdmin ? [{ path: '/admin', Icon: IconAdmin, label: 'Admin' }] : []),
  ];

  const moreActive = allMoreItems.some(i => i.path === location.pathname);

  return (
    <>
      {/* More overlay */}
      {showMore && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }}
          onClick={() => setShowMore(false)}
        >
          <div
            className="absolute bottom-16 left-0 right-0"
            style={{
              background: 'hsl(240 50% 5%)',
              borderTop: '1px solid hsl(240 35% 12%)',
              padding: '16px 16px',
              paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {allMoreItems.map(({ path, Icon, label }) => {
                const active = location.pathname === path;
                return (
                  <NavLink
                    key={path}
                    to={path}
                    onClick={() => setShowMore(false)}
                    style={{
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', gap: 7,
                      padding: '14px 8px',
                      borderRadius: 12,
                      background: active
                        ? 'rgba(108,99,255,0.12)'
                        : 'hsl(240 50% 7%)',
                      border: `1px solid ${active
                        ? 'rgba(108,99,255,0.35)'
                        : 'hsl(240 35% 12%)'}`,
                      color: active
                        ? 'hsl(245 100% 72%)'
                        : 'hsl(240 15% 45%)',
                      textDecoration: 'none',
                      transition: 'all 0.15s',
                    }}
                  >
                    <Icon />
                    <span style={{
                      fontSize: 11,
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontWeight: 600,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                    }}>{label}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Bottom bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 lg:hidden"
        style={{
          background: 'hsl(240 60% 3%)',
          borderTop: '1px solid hsl(240 35% 10%)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <div className="flex justify-around items-center h-16">
          {mainNavItems.map(({ path, Icon, label }) => {
            const active = location.pathname === path;
            return (
              <NavLink
                key={path}
                to={path}
                style={{ color: active ? 'hsl(245 100% 70%)' : 'hsl(240 15% 40%)' }}
                className="flex flex-col items-center gap-0.5 px-3 py-1.5 relative"
              >
                {active && (
                  <span style={{
                    position: 'absolute', top: 3,
                    left: '50%', transform: 'translateX(-50%)',
                    width: 4, height: 4, borderRadius: '50%',
                    background: 'hsl(245 100% 70%)',
                  }}/>
                )}
                <span className="mt-1"><Icon active={active} /></span>
                <span style={{
                  fontSize: 8,
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                }}>{label}</span>
              </NavLink>
            );
          })}

          {/* More */}
          <button
            onClick={() => setShowMore(!showMore)}
            style={{ color: moreActive || showMore ? 'hsl(245 100% 70%)' : 'hsl(240 15% 40%)' }}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5"
          >
            <span className="mt-1">
              {showMore
                ? <IconMoreOpen active={moreActive || showMore} />
                : <IconMoreClosed active={moreActive || showMore} />
              }
            </span>
            <span style={{
              fontSize: 8,
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}>MORE</span>
          </button>
        </div>
      </nav>
    </>
  );
};

export default BottomNav;

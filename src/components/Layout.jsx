const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation, Link } from 'react-router-dom';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  House, ListChecks, MessageCircleHeart, CalendarDays, Stethoscope,
  Plus, PanelLeftClose, PanelLeftOpen, LogOut
} from 'lucide-react';
import SettingsDropdown from '@/components/SettingsDropdown';
import Logo from '@/components/Logo';

const nav = [
  { to: '/', label: 'Home', short: 'Home', icon: House },
  { to: '/plan', label: 'Recovery Plan', short: 'Plan', icon: ListChecks },
  { to: '/ask', label: 'Ask Mendy', short: 'Ask', icon: MessageCircleHeart },
  { to: '/visits', label: 'Visits', short: 'Visits', icon: CalendarDays },
  { to: '/reports', label: 'Reports', short: 'Reports', icon: Stethoscope },
];

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const qc = useQueryClient();
  const [collapsed, setCollapsed] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ['me-profile'],
    queryFn: async () => (await db.entities.PatientProfile.list())[0] || null
  });

  const handleLogout = async () => {
    qc.clear();
    await db.auth.logout('/auth');
  };

  return (
    <div className="min-h-screen flex">
      {/* Desktop sidebar */}
      <aside className={`hidden ${collapsed ? 'md:hidden' : 'md:flex md:w-64'} flex-col bg-sidebar border-r border-sidebar-border transition-all print:hidden`}>
        <div className="px-4 py-5 flex items-center justify-between gap-2">
          <Link to="/" className="flex items-center gap-2 min-w-0">
            <Logo className="w-9 h-9 rounded-xl shrink-0" />
            <div className="min-w-0">
              <div className="font-display font-semibold text-sidebar-foreground leading-tight truncate">Mendly</div>
            </div>
          </Link>
          <div className="flex items-center gap-0.5 shrink-0">
            <button onClick={() => navigate('/upload')} className="p-2 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground/70" aria-label="Upload papers"><Plus className="w-4 h-4" /></button>
            <SettingsDropdown />
            <button onClick={() => setCollapsed(true)} className="p-2 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground/70" aria-label="Collapse sidebar"><PanelLeftClose className="w-5 h-5" /></button>
          </div>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
                    : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                }`
              }
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-sidebar-border">
          <div className="flex items-center gap-2.5 px-3 py-2 mb-1">
            {profile?.profile_photo_url
              ? <img src={profile.profile_photo_url} alt="" className="h-8 w-8 rounded-full object-cover shrink-0" />
              : <div className="h-8 w-8 rounded-full bg-sidebar-accent text-sidebar-accent-foreground grid place-items-center shrink-0 text-xs font-semibold">{(profile?.full_name || 'P')[0]?.toUpperCase()}</div>}
            <div className="min-w-0">
              <div className="text-sm font-medium text-sidebar-foreground truncate">{profile?.full_name || 'Patient'}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-destructive transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Mobile top bar */}
        <header className="md:hidden sticky top-0 z-30 glass-card border-b border-border print:hidden">
          <div className="flex items-stretch">
            <Link to="/" className="flex items-center gap-2 pl-4 pr-3 shrink-0" style={{ paddingTop: 'env(safe-area-inset-top)', height: 'calc(3rem + env(safe-area-inset-top))' }}>
              <Logo className="w-6 h-6 rounded-md shrink-0" />
              <span className="font-display text-base font-semibold leading-none">Mendly</span>
            </Link>
            <div className="flex-1" />
            <button onClick={() => navigate('/upload')} className="flex items-center justify-center w-10 hover:bg-muted text-foreground/80" style={{ paddingTop: 'env(safe-area-inset-top)', height: 'calc(3rem + env(safe-area-inset-top))' }} aria-label="Upload papers"><Plus className="w-4 h-4" /></button>
            <SettingsDropdown triggerClassName="flex items-center justify-center w-10 hover:bg-muted text-foreground/80" triggerStyle={{ paddingTop: 'env(safe-area-inset-top)', height: 'calc(3rem + env(safe-area-inset-top))' }} />
          </div>
        </header>

        {/* Desktop expand bar */}
        {collapsed && (
          <div className="hidden md:flex sticky top-0 z-20 items-center gap-2 px-4 py-2.5 bg-background/80 backdrop-blur border-b border-border print:hidden">
            <button onClick={() => setCollapsed(false)} className="p-2 rounded-lg hover:bg-muted text-foreground" aria-label="Expand sidebar">
              <PanelLeftOpen className="w-5 h-5" />
            </button>
            <span className="font-display font-semibold text-sm">Mendly</span>
          </div>
        )}

        <main className="flex-1 print:overflow-visible">
          <div
            key={location.pathname}
            className="page-enter mx-auto w-full max-w-md md:max-w-6xl pt-4 pb-24 md:pb-10 md:pt-6"
            style={{ paddingLeft: 'max(env(safe-area-inset-left), 1.25rem)', paddingRight: 'max(env(safe-area-inset-right), 1.25rem)' }}
          >
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-30 glass-card border-t border-border print:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={() => {
                const active = item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to);
                if (!active) return;
                if (location.search || location.pathname !== item.to) navigate(item.to, { replace: true });
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`
              }
            >
              <item.icon className="h-5 w-5" />
              {item.short}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
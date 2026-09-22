import { clsx } from 'clsx';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Search, GitBranch, Zap, Sparkles, BarChart3, Wrench, Settings, User, Eye } from 'lucide-react';
import { useState, useEffect } from 'react';

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/discover', label: 'Discover', icon: Search },
  { to: '/lineage', label: 'Lineage', icon: GitBranch },
  { to: '/impact', label: 'Impact Simulator', icon: Zap },
  { to: '/ai-insights', label: 'AI Insights', icon: Sparkles },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/modernization', label: 'Modernization', icon: Wrench },
];

export function Layout({ children, onOpenSearch, demoMode, onToggleDemo }: {
  children: React.ReactNode;
  onOpenSearch: () => void;
  demoMode: boolean;
  onToggleDemo: () => void;
}) {
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen bg-[#0a0b0f]">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-30 hidden h-full w-60 flex-col border-r border-zinc-800/80 bg-[#0d0e13] lg:flex">
        <SidebarContent demoMode={demoMode} onToggleDemo={onToggleDemo} />
      </aside>

      {/* Mobile nav */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileNavOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-60 border-r border-zinc-800 bg-[#0d0e13] animate-slide-in-right">
            <SidebarContent demoMode={demoMode} onToggleDemo={onToggleDemo} />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex flex-1 flex-col lg:pl-60">
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-zinc-800/80 glass px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileNavOpen(true)}
              className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-800 lg:hidden"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center gap-2 lg:hidden">
              <DevilLogo className="h-6 w-6" />
              <span className="text-sm font-bold text-zinc-100">DataLens</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenSearch}
              className="flex items-center gap-2 rounded-lg border border-zinc-700/60 bg-zinc-800/40 px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Search...</span>
              <kbd className="hidden rounded border border-zinc-700 bg-zinc-900 px-1.5 py-0.5 text-xs text-zinc-500 sm:inline">Ctrl K</kbd>
            </button>
            <Link
              to="/settings"
              className={clsx(
                'rounded-md p-2 transition-colors',
                location.pathname === '/settings' ? 'bg-zinc-800 text-red-400' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
              )}
            >
              <Settings className="h-4 w-4" />
            </Link>
            <Link
              to="/dashboard"
              className="flex items-center gap-2 rounded-md border border-zinc-700/60 bg-zinc-800/40 px-2.5 py-1.5 transition-colors hover:border-zinc-600"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-red-700 text-xs font-bold text-white">
                DV
              </div>
              <span className="hidden text-xs text-zinc-400 sm:inline">Demo User</span>
            </Link>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6">{children}</main>

        <footer className="border-t border-zinc-800/80 px-6 py-4">
          <p className="text-center text-xs text-zinc-600">
            DakenDevil's DataLens · Hackathon Prototype · Synthetic Data Estate
          </p>
        </footer>
      </div>
    </div>
  );
}

function SidebarContent({ demoMode, onToggleDemo }: { demoMode: boolean; onToggleDemo: () => void }) {
  const location = useLocation();
  return (
    <div className="flex h-full flex-col">
      <Link to="/" className="flex items-center gap-3 border-b border-zinc-800/80 px-5 py-4">
        <DevilLogo className="h-7 w-7" />
        <div>
          <p className="text-sm font-bold leading-tight text-zinc-100">DakenDevil's</p>
          <p className="text-xs leading-tight text-red-500">DataLens</p>
        </div>
      </Link>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const active = location.pathname === item.to;
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={clsx(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all',
                active
                  ? 'bg-red-600/10 text-red-400 border border-red-600/20'
                  : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200 border border-transparent'
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-zinc-800/80 p-3">
        <button
          onClick={onToggleDemo}
          className={clsx(
            'flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
            demoMode
              ? 'bg-emerald-600/10 text-emerald-400 border border-emerald-600/20'
              : 'text-zinc-400 hover:bg-zinc-800/50 border border-zinc-700/30'
          )}
        >
          <span className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Demo Mode
          </span>
          <span className={clsx('flex h-4 w-7 items-center rounded-full transition-colors', demoMode ? 'bg-emerald-500' : 'bg-zinc-700')}>
            <span className={clsx('h-3 w-3 rounded-full bg-white transition-transform', demoMode ? 'translate-x-3.5' : 'translate-x-0.5')} />
          </span>
        </button>
      </div>
    </div>
  );
}

export function DevilLogo({ className }: { className?: string }) {
  return (
    <div className={clsx('relative flex items-center justify-center rounded-lg bg-gradient-to-br from-red-600 to-red-900', className)}>
      <svg viewBox="0 0 24 24" fill="none" className="h-1/2 w-1/2">
        <path
          d="M6 4L4 8L6 10L4 14L8 16L12 12L16 16L20 14L18 10L20 8L18 4L14 6L10 6L6 4Z"
          fill="white"
          opacity="0.95"
        />
        <circle cx="9" cy="11" r="1.2" fill="#0a0b0f" />
        <circle cx="15" cy="11" r="1.2" fill="#0a0b0f" />
      </svg>
    </div>
  );
}

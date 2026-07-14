import { type ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { client } from '../../api/client';
import { Home, BookOpen, Compass, Grid3X3, MessageSquare, History, LogOut, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { twMerge } from 'tailwind-merge';

const NAV = [
  { icon: Home, label: 'Dashboard', path: '/' },
  { icon: BookOpen, label: 'Onboarding', path: '/onboarding' },
  { icon: Compass, label: 'Careers', path: '/careers' },
  { icon: Grid3X3, label: 'Career Gallery', path: '/gallery' },
  { icon: MessageSquare, label: 'Counselor Chat', path: '/chat' },
  { icon: History, label: 'Activity Log', path: '/history' },
];

interface AppShellProps {
  children: ReactNode;
}

export const AppShell = ({ children }: AppShellProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { clearAuth } = useAuthStore();

  const handleLogout = async () => {
    await client.post('/auth/logout').catch(() => {});
    clearAuth();
    navigate('/login');
  };

  return (
    <div className={twMerge("bg-bg text-text flex flex-col md:flex-row", location.pathname.startsWith('/chat') ? "md:h-screen md:overflow-hidden min-h-screen" : "min-h-screen")}>
      {/* Sidebar */}
      <aside className={twMerge("w-full md:w-64 bg-bg/95 border-r border-white/5 p-6 flex flex-col justify-between shrink-0 z-10", location.pathname.startsWith('/chat') ? "md:h-screen md:overflow-y-auto" : "")}>
        <div className="space-y-8">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-2xl bg-accent/15 border border-accent/30 flex items-center justify-center">
              <span className="font-anton text-accent text-lg">S</span>
            </div>
            <span className="font-anton text-accent text-xl tracking-wider">SCPR</span>
          </div>

          <nav className="space-y-1">
            {NAV.map(({ icon: Icon, label, path }) => {
              const isActive = path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
              return (
                <button
                  key={path}
                  onClick={() => navigate(path)}
                  className={twMerge(
                    'w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl transition-all text-sm font-medium',
                    isActive
                      ? 'bg-accent/10 text-accent'
                      : 'text-text-muted hover:text-white hover:bg-white/5'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="pt-6 border-t border-white/5">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-text-muted hover:text-destructive hover:bg-destructive/5 transition-all text-sm font-medium"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className={twMerge("flex-grow min-w-0 relative", location.pathname.startsWith('/chat') ? "md:overflow-hidden" : "overflow-y-auto")}>
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
        <div className={twMerge("relative z-10", location.pathname.startsWith('/chat') ? "h-full" : "p-6 md:p-12 space-y-10")}>
          {children}
        </div>
      </main>

      {/* Floating AI button - Hide when already on the chat page */}
      {!location.pathname.startsWith('/chat') && (
        <div className="hidden md:flex fixed bottom-[32px] right-[32px] z-50">
        <motion.button
          onClick={() => navigate('/chat')}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="w-[56px] h-[56px] rounded-full bg-accent/10 backdrop-blur-[16px] border border-accent/25 flex items-center justify-center cursor-pointer shadow-lg"
          aria-label="Ask AI Counselor"
        >
          <Sparkles className="h-[22px] w-[22px] text-accent" />
        </motion.button>
      </div>
      )}
    </div>
  );
};

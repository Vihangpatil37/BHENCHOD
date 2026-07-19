import { type ReactNode, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { client } from '../../api/client';
import {
  Home,
  BookOpen,
  Compass,
  Grid3X3,
  MessageSquare,
  History,
  LogOut,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { twMerge } from 'tailwind-merge';
import { GlassCard } from '../ui/GlassCard';

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
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await client.post('/auth/logout').catch(() => {});
    clearAuth();
    navigate('/login');
  };

  const isChatPage = location.pathname.startsWith('/chat');

  return (
    <div
      className={twMerge(
        'bg-bg-primary text-text-primary flex flex-col md:flex-row min-h-screen',
        isChatPage ? 'md:h-screen md:overflow-hidden' : ''
      )}
    >
      {/* ── MOBILE NAVBAR ── */}
      <div className="block md:hidden z-30">
        <GlassCard
          elevation={1}
          className="m-4 p-4 rounded-[24px] flex flex-col border border-solid"
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 rounded-full bg-brand/15 border border-brand/35 flex items-center justify-center">
                <span className="font-anton text-brand text-base">S</span>
              </div>
              <span className="font-anton text-brand text-lg tracking-wider">SCPR</span>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-1.5 rounded-full hover:bg-white/5 text-text-secondary hover:text-text-primary transition-all duration-180 focus:outline-none"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="overflow-hidden mt-4"
              >
                <nav className="flex flex-col gap-2 pb-2">
                  {NAV.map(({ icon: Icon, label, path }) => {
                    const isActive =
                      path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
                    return (
                      <button
                        key={path}
                        onClick={() => {
                          navigate(path);
                          setIsMobileMenuOpen(false);
                        }}
                        className={twMerge(
                          'w-full flex items-center space-x-3 px-4 py-2.5 rounded-full border border-solid text-sm font-medium transition-all duration-180',
                          isActive
                            ? 'bg-white/[0.10] text-text-primary border-white/[0.08] shadow-sm'
                            : 'bg-transparent text-text-secondary border-transparent hover:text-text-primary hover:bg-white/[0.05]'
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{label}</span>
                      </button>
                    );
                  })}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-full border border-transparent text-text-muted hover:text-error hover:bg-error/5 transition-all text-sm font-medium mt-2"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </button>
                </nav>
              </motion.div>
            )}
          </AnimatePresence>
        </GlassCard>
      </div>

      {/* ── DESKTOP FLOATING SIDEBAR (Elevation 1) ── */}
      <aside
        className={twMerge(
          'hidden md:flex flex-col justify-between shrink-0 m-4 h-[calc(100vh-2rem)] sticky top-4 transition-all duration-350 ease-in-out z-20',
          isCollapsed ? 'w-20' : 'w-64'
        )}
      >
        <GlassCard
          elevation={1}
          className="h-full flex flex-col justify-between p-5 border border-solid rounded-[24px] relative"
        >
          {/* Collapse Toggle Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute right-[-12px] top-7 w-6 h-6 rounded-full border border-white/[0.08] bg-[#0A0A0F] text-text-secondary hover:text-text-primary hover:border-brand/40 flex items-center justify-center cursor-pointer shadow-md transition-all duration-180 z-30 focus:outline-none"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>

          <div className="flex flex-col gap-8 overflow-hidden">
            {/* Header / Logo */}
            <div className="flex items-center space-x-3 min-h-[36px] px-1">
              <div className="h-9 w-9 rounded-full bg-brand/15 border border-brand/35 flex items-center justify-center shrink-0">
                <span className="font-anton text-brand text-lg">S</span>
              </div>
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="font-anton text-brand text-xl tracking-wider select-none"
                >
                  SCPR
                </motion.span>
              )}
            </div>

            {/* Navigation links */}
            <nav className="flex flex-col gap-1.5">
              {NAV.map(({ icon: Icon, label, path }) => {
                const isActive =
                  path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
                return (
                  <button
                    key={path}
                    onClick={() => navigate(path)}
                    title={isCollapsed ? label : undefined}
                    className={twMerge(
                      'w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-full border border-solid text-sm font-medium transition-all duration-180 focus-ring',
                      isActive
                        ? 'bg-white/[0.10] text-text-primary border-white/[0.08] shadow-sm'
                        : 'bg-transparent text-text-secondary border-transparent hover:text-text-primary hover:bg-white/[0.05]'
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {!isCollapsed && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.15 }}
                      >
                        {label}
                      </motion.span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Footer / Logout */}
          <div className="pt-4 border-t border-white/[0.06] overflow-hidden">
            <button
              onClick={handleLogout}
              title={isCollapsed ? 'Sign Out' : undefined}
              className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-full border border-transparent text-text-muted hover:text-error hover:bg-error/5 transition-all text-sm font-medium focus-ring"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.15 }}
                >
                  Sign Out
                </motion.span>
              )}
            </button>
          </div>
        </GlassCard>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main
        className={twMerge(
          'flex-grow min-w-0 relative z-10',
          isChatPage ? 'md:overflow-hidden' : 'overflow-y-auto'
        )}
      >
        <div
          className={twMerge(
            'relative z-10 h-full',
            isChatPage ? '' : 'p-4 md:p-8 lg:p-12 space-y-8'
          )}
        >
          {children}
        </div>
      </main>

      {/* ── FLOATING AI BUTTON (Cyan glow, 2.8s breathing pulse) ── */}
      {!isChatPage && (
        <div className="hidden md:flex fixed bottom-8 right-8 z-40">
          <motion.button
            onClick={() => navigate('/chat')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-14 h-14 rounded-full bg-white/[0.05] border border-solid border-white/[0.08] backdrop-blur-[30px] flex items-center justify-center cursor-pointer shadow-[0_10px_30px_rgba(0,0,0,0.30)] hover:border-[#70E1FF]/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ai-cyan"
            aria-label="Ask AI Counselor"
            style={{ boxShadow: 'inset 1px 1px 0px rgba(255, 255, 255, 0.08)' }}
            animate={{
              boxShadow: [
                'inset 1px 1px 0px rgba(255, 255, 255, 0.08), 0 0 15px rgba(112, 225, 255, 0.15)',
                'inset 1px 1px 0px rgba(255, 255, 255, 0.08), 0 0 30px rgba(112, 225, 255, 0.35)',
                'inset 1px 1px 0px rgba(255, 255, 255, 0.08), 0 0 15px rgba(112, 225, 255, 0.15)',
              ],
            }}
            transition={{
              duration: 2.8, // 2.8s AI breathing cycle
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <Sparkles className="h-5 w-5 text-ai-cyan" />
          </motion.button>
        </div>
      )}
    </div>
  );
};

import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/authStore';
import { AppShell } from './components/layout/AppShell';
import { ErrorBoundary } from './components/shared/ErrorBoundary';

const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const Register = lazy(() => import('./pages/Register').then(m => ({ default: m.Register })));
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Onboarding = lazy(() => import('./pages/Onboarding').then(m => ({ default: m.Onboarding })));
const CareerExplorer = lazy(() => import('./pages/CareerExplorer').then(m => ({ default: m.CareerExplorer })));
const CounselingChat = lazy(() => import('./pages/CounselingChat').then(m => ({ default: m.CounselingChat })));
const HistoryLog = lazy(() => import('./pages/HistoryLog').then(m => ({ default: m.HistoryLog })));
const AdminCareers = lazy(() => import('./pages/AdminCareers').then(m => ({ default: m.AdminCareers })));
const Landing = lazy(() => import('./pages/Landing').then(m => ({ default: m.Landing })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  if (!accessToken) return <Navigate to="/login" replace />;
  const isAdminRoute = window.location.pathname.startsWith('/admin');
  if (isAdminRoute && user?.role !== 'admin') return <Navigate to="/" replace />;
  return children;
};

const AuthRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const accessToken = useAuthStore((state) => state.accessToken);
  if (accessToken) return <Navigate to="/" replace />;
  return children;
};

const PageLoader = () => (
  <div className="min-h-screen bg-bg flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-cta border-t-transparent rounded-full animate-spin" />
  </div>
);

const HomeRoute: React.FC = () => {
  const accessToken = useAuthStore((state) => state.accessToken);
  if (!accessToken) return <Landing />;
  return <AppShell><Dashboard /></AppShell>;
};

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
              <Route path="/register" element={<AuthRoute><Register /></AuthRoute>} />
              <Route path="/" element={<HomeRoute />} />
              <Route path="/onboarding" element={<ProtectedRoute><AppShell><Onboarding /></AppShell></ProtectedRoute>} />
              <Route path="/careers" element={<ProtectedRoute><AppShell><CareerExplorer /></AppShell></ProtectedRoute>} />
              <Route path="/chat" element={<ProtectedRoute><AppShell><CounselingChat /></AppShell></ProtectedRoute>} />
              <Route path="/history" element={<ProtectedRoute><AppShell><HistoryLog /></AppShell></ProtectedRoute>} />
              <Route path="/admin/careers" element={<ProtectedRoute><AppShell><AdminCareers /></AppShell></ProtectedRoute>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;

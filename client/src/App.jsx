import React, { useEffect, useState, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';

import { useAuthStore } from './store/authStore';
import { setupSSEListener, closeSSEListener } from './services/sse';
import BackgroundCanvas from './components/BackgroundCanvas';
import ErrorBoundary from './components/ErrorBoundary';
import TopBar from './components/TopBar';
import Sidebar from './components/Sidebar';
import CommandPalette from './components/CommandPalette';
import GuidedDemoTour from './components/GuidedDemoTour';
import { Activity, RefreshCw } from 'lucide-react';

// Lazy load pages for code splitting & fast initial load
const Login = lazy(() => import('./pages/Login'));
const NetworkMap = lazy(() => import('./pages/NetworkMap'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ResourceDetail = lazy(() => import('./pages/ResourceDetail'));
const PolicyMatrix = lazy(() => import('./pages/PolicyMatrix'));
const TestLab = lazy(() => import('./pages/TestLab'));
const ComplianceScore = lazy(() => import('./pages/ComplianceScore'));
const ConfigGenerator = lazy(() => import('./pages/ConfigGenerator'));
const Departments = lazy(() => import('./pages/Departments'));
const Users = lazy(() => import('./pages/Users'));
const AccessRequests = lazy(() => import('./pages/AccessRequests'));
const AuditLog = lazy(() => import('./pages/AuditLog'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10000,
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});

function LoadingFallback() {
  return (
    <div className="p-12 text-center font-mono text-xs text-slate-500 animate-pulse">
      Loading console module...
    </div>
  );
}

function AdminRoute({ children }) {
  const { user } = useAuthStore();
  if (user?.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }
  return children;
}

function AppContent() {
  const { isAuthenticated, isLoading, checkAuth, user } = useAuthStore();
  const [isCmdOpen, setIsCmdOpen] = useState(false);
  const [isWakingUp, setIsWakingUp] = useState(false);

  useEffect(() => {
    let timer = setTimeout(() => {
      if (useAuthStore.getState().isLoading) {
        setIsWakingUp(true);
      }
    }, 2500);

    useAuthStore.getState().checkAuth().then(() => {
      setIsWakingUp(false);
    });

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setIsCmdOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      setupSSEListener(queryClient);
    } else {
      closeSSEListener();
    }
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#070b16] flex flex-col items-center justify-center p-6 text-center">
        <BackgroundCanvas />
        <div className="glass-panel p-8 max-w-md w-full relative z-10 border-cyan-500/40 shadow-glowCyan space-y-4">
          <div className="w-12 h-12 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto">
            <Activity className="w-6 h-6 animate-spin" />
          </div>
          <h2 className="text-lg font-bold text-slate-100">
            {isWakingUp ? 'Waking up the server...' : 'Booting Console Session'}
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed font-mono">
            {isWakingUp
              ? 'Free tier web services spin down after inactivity. Waking up instance, this can take up to 60 seconds.'
              : 'Verifying session token and ACL credentials...'}
          </p>
          {isWakingUp && (
            <button
              onClick={() => {
                setIsWakingUp(false);
                checkAuth();
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 text-slate-950 font-bold text-xs shadow-glowCyan hover:bg-cyan-400 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retry Health Check
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <Login />
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b16] text-slate-100 flex flex-col relative overflow-x-hidden">
      <BackgroundCanvas />

      <TopBar onOpenCommandPalette={() => setIsCmdOpen(true)} />

      <div className="flex-1 flex pb-16 md:pb-0 relative z-10">
        <Sidebar />

        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                <Route path="/" element={<NetworkMap />} />
                <Route path="/resources" element={<Dashboard />} />
                <Route path="/resources/:id" element={<ResourceDetail />} />
                <Route path="/matrix" element={<AdminRoute><PolicyMatrix /></AdminRoute>} />
                <Route path="/test-lab" element={<TestLab />} />
                <Route path="/compliance" element={<ComplianceScore />} />
                <Route path="/config" element={<ConfigGenerator />} />
                <Route path="/departments" element={<AdminRoute><Departments /></AdminRoute>} />
                <Route path="/users" element={<AdminRoute><Users /></AdminRoute>} />
                <Route path="/access-requests" element={<AdminRoute><AccessRequests /></AdminRoute>} />
                <Route path="/audit" element={<AdminRoute><AuditLog /></AdminRoute>} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>

      <CommandPalette isOpen={isCmdOpen} onClose={() => setIsCmdOpen(false)} />
      <GuidedDemoTour />
      <Toaster position="top-right" theme="dark" richColors />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

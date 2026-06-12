import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { useMe } from '@/hooks/useAuth';
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import IntegrationFlowPage from '@/pages/IntegrationFlowPage';
import AISetupPage from '@/pages/AISetupPage';
import AIConnectionPage from '@/pages/AIConnectionPage';
import ChatPage from '@/pages/ChatPage';
import SettingsPage from '@/pages/SettingsPage';
import DashboardPage from '@/pages/DashboardPage';
import PipelinePage from '@/pages/PipelinePage';
import RecordsPage from '@/pages/RecordsPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading } = useMe();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading } = useMe();
  if (isLoading) return null;
  if (user) return <Navigate to="/connect" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/login"
          element={<PublicRoute><LoginPage /></PublicRoute>}
        />
        <Route
          path="/register"
          element={<PublicRoute><RegisterPage /></PublicRoute>}
        />
        <Route
          path="/connect"
          element={<ProtectedRoute><IntegrationFlowPage /></ProtectedRoute>}
        />
        <Route
          path="/ai-setup"
          element={<ProtectedRoute><AISetupPage /></ProtectedRoute>}
        />
        <Route
          path="/ai-connect"
          element={<ProtectedRoute><AIConnectionPage /></ProtectedRoute>}
        />
        <Route
          path="/dashboard"
          element={<ProtectedRoute><DashboardPage /></ProtectedRoute>}
        />
        <Route
          path="/chat"
          element={<ProtectedRoute><ChatPage /></ProtectedRoute>}
        />
        <Route
          path="/settings"
          element={<ProtectedRoute><SettingsPage /></ProtectedRoute>}
        />
        <Route
          path="/pipeline"
          element={<ProtectedRoute><PipelinePage /></ProtectedRoute>}
        />
        <Route
          path="/records"
          element={<ProtectedRoute><RecordsPage /></ProtectedRoute>}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
    </>
  );
}

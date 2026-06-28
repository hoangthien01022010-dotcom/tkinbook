import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance } from '@/lib/query-client';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from '@/pages/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from '@/components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import { ThemeProvider } from '@/lib/ThemeContext';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import Home from '@/pages/Home';
import AdminPanel from '@/pages/AdminPanel';
import Welcome from '@/pages/Welcome';
import CallRoom from '@/pages/CallRoom';
import CodeExplorer from '@/pages/CodeExplorer';
import AIAgent from '@/pages/AIAgent';
import Backup from '@/pages/Backup';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Kin Book</p>
        </div>
      </div>
    );
  }

  if (authError?.type === 'user_not_registered') {
    return <UserNotRegisteredError />;
  }

  return (
    <Routes>
      <Route path="/welcome" element={<Welcome />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/call-room" element={<CallRoom />} />
        <Route path="/code" element={<CodeExplorer />} />
        <Route path="/ai-agent" element={<AIAgent />} />
        <Route path="/backup" element={<Backup />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <ScrollToTop />
            <AuthenticatedApp />
          </Router>
          <Toaster />
          <Sonner />
        </QueryClientProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

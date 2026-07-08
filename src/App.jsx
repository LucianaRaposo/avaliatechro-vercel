import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ProtectedRoute from '@/components/ProtectedRoute';
import ScrollToTop from './components/ScrollToTop';
import RoleGuard from '@/components/RoleGuard';

import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';

import Layout from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import Projects from '@/pages/Projects';
import ProjectDetail from '@/pages/ProjectDetail';
import QRCodes from '@/pages/QRCodes';
import Evaluations from '@/pages/Evaluations';
import Ranking from '@/pages/Ranking';
import Reports from '@/pages/Reports';
import Admin from '@/pages/Admin';
import Users from '@/pages/Users';
import Certificates from '@/pages/Certificates';
import EvaluatorDashboard from '@/pages/EvaluatorDashboard';
import Profile from '@/pages/Profile';
import ProfessorPortal from '@/pages/ProfessorPortal';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route path="/professor" element={<ProfessorPortal />} />
        <Route path="/profile" element={<Profile />} />
        <Route element={<RoleGuard allowedRoles={["admin", "admin_estadual", "nte_coordenador", "avaliador"]} />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/qrcodes" element={<QRCodes />} />
            <Route path="/evaluations" element={<Evaluations />} />
            <Route path="/ranking" element={<Ranking />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Admin />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/users" element={<Users />} />
            <Route path="/certificates" element={<Certificates />} />
            <Route path="/evaluator" element={<EvaluatorDashboard />} />
          </Route>
          <Route path="/project/:code" element={<ProjectDetail />} />
        </Route>
      </Route>
      
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
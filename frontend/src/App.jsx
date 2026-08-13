import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { FlashProvider } from './context/FlashContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Skeleton from './components/Skeleton';

import AuthCard from './components/AuthCard';
import ResetPassword from './pages/ResetPassword';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import AddCase from './pages/AddCase';
import EditCase from './pages/EditCase';
import CaseHistory from './pages/CaseHistory';
import CaseAudit from './pages/CaseAudit';
import Archive from './pages/Archive';
import Tasks from './pages/Tasks';
import Diary from './pages/Diary';
import Billing from './pages/Billing';
import Settings from './pages/Settings';
import Templates from './pages/Templates';
import AiAssistant from './pages/AiAssistant';

// Supabase persists its session under `sb-<project-ref>-auth-token`. Checking
// for it is a synchronous hint about which way "/" is about to resolve — it
// decides only what to paint for the few hundred ms before /auth/me answers,
// and is corrected the moment it does.
function hasStoredSession() {
  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) return true;
    }
  } catch {
    // localStorage can throw in private mode; fall through to the landing page.
  }
  return false;
}

// "/" is the one route that differs by who is asking: visitors get the
// marketing page (its own full-page chrome, no app header), logged-in
// advocates get the dashboard inside the app shell. Keeping the dashboard
// on "/" means every existing `Link to="/"` in the app still works.
function Home() {
  const { advocate, loading } = useAuth();

  if (loading) {
    // Never a blank page: returning advocates get the dashboard's shimmer,
    // first-time visitors get the landing page straight away.
    return hasStoredSession()
      ? <Layout><Skeleton count={4} rows={2} widths={['50%', '85%']} /></Layout>
      : <Landing />;
  }

  if (!advocate) return <Landing />;

  return (
    <Layout>
      <Dashboard />
    </Layout>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <FlashProvider>
            <Routes>
              <Route path="/" element={<Home />} />

              <Route element={<Layout />}>
                <Route path="/login" element={<AuthCard />} />
                <Route path="/signup" element={<AuthCard />} />
                <Route path="/forgot-password" element={<AuthCard />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                <Route element={<ProtectedRoute />}>
                  <Route path="/ai-assistant" element={<AiAssistant />} />
                  <Route path="/clients" element={<Clients />} />
                  <Route path="/add" element={<AddCase />} />
                  <Route path="/edit/:caseId" element={<EditCase />} />
                  <Route path="/history/:caseId" element={<CaseHistory />} />
                  <Route path="/case/:caseId/audit" element={<CaseAudit />} />
                  <Route path="/archive" element={<Archive />} />
                  <Route path="/tasks" element={<Tasks />} />
                  <Route path="/diary" element={<Diary />} />
                  <Route path="/billing" element={<Billing />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/templates" element={<Templates />} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </FlashProvider>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

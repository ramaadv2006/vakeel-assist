import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { FlashProvider } from './context/FlashContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

import AuthCard from './components/AuthCard';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import AddCase from './pages/AddCase';
import EditCase from './pages/EditCase';
import CaseHistory from './pages/CaseHistory';
import CaseAudit from './pages/CaseAudit';
import Archive from './pages/Archive';
import Tasks from './pages/Tasks';
import Diary from './pages/Diary';
import BulkUpdateDates from './pages/BulkUpdateDates';
import Billing from './pages/Billing';
import Settings from './pages/Settings';
import Templates from './pages/Templates';
import AiAssistant from './pages/AiAssistant';

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <FlashProvider>
            <Routes>
              <Route element={<Layout />}>
                <Route path="/login" element={<AuthCard />} />
                <Route path="/signup" element={<AuthCard />} />
                <Route path="/forgot-password" element={<AuthCard />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                <Route element={<ProtectedRoute />}>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/ai-assistant" element={<AiAssistant />} />
                  <Route path="/clients" element={<Clients />} />
                  <Route path="/add" element={<AddCase />} />
                  <Route path="/edit/:caseId" element={<EditCase />} />
                  <Route path="/history/:caseId" element={<CaseHistory />} />
                  <Route path="/case/:caseId/audit" element={<CaseAudit />} />
                  <Route path="/archive" element={<Archive />} />
                  <Route path="/tasks" element={<Tasks />} />
                  <Route path="/diary" element={<Diary />} />
                  <Route path="/cases/bulk-update-dates" element={<BulkUpdateDates />} />
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

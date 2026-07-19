import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import DashboardLayout from './components/DashboardLayout';
import AdminLayout from './components/AdminLayout';

// Public Pages
import LandingPage from './pages/public/LandingPage';
import LoginPage from './pages/public/LoginPage';

// Participant Pages
import ParticipantDashboard from './pages/participant/ParticipantDashboard';
import ApplyNowPage from './pages/participant/ApplyNowPage';
import ApplicationStatusPage from './pages/participant/ApplicationStatusPage';
import ParticipantMessagesPage from './pages/participant/ParticipantMessagesPage';

// Admin Pages
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import ApplicantsPage from './pages/admin/ApplicantsPage';
import AdminMessagesPage from './pages/admin/AdminMessagesPage';
import ExportPage from './pages/admin/ExportPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app-layout">
          <Navbar />
          <div className="app-main">
            <Routes>
              {/* Public */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />

              {/* Separate admin login (public) */}
              <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
              <Route path="/admin/login" element={<AdminLoginPage />} />

              {/* Protected participant routes */}
              <Route element={<DashboardLayout />}>
                <Route path="/participant/dashboard" element={<ParticipantDashboard />} />
                <Route path="/participant/apply" element={<ApplyNowPage />} />
                <Route path="/participant/status" element={<ApplicationStatusPage />} />
                <Route path="/participant/messages" element={<ParticipantMessagesPage />} />
              </Route>

              {/* Protected admin routes — participants cannot access */}
              <Route element={<AdminLayout />}>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/applicants" element={<ApplicantsPage />} />
                <Route path="/admin/messages" element={<AdminMessagesPage />} />
                <Route path="/admin/export" element={<ExportPage />} />
              </Route>

              {/* Unknown routes */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

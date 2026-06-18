import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/layouts/Navbar';
import Footer from "./components/layouts/footer";
import Home from './pages/public/Home';
import Updates from './pages/public/Updates';
import Courts from "./pages/public/Court";
import Membership from './pages/public/Membership';
import LoginPage from './pages/public/LoginPage';
import RegisterPage from './pages/public/RegisterPage';

// Admin Imports
import DashboardLayout from './components/layouts/DashboardLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminHome from './pages/admin/AdminHome';

import MemberHome from './pages/member/MemberHome';


import CoachHome from './pages/coach/CoachHome';

const MainContent = () => {
  const location = useLocation();

  // 1. Updated Logic: Hide public layout for Login, Register, AND any Admin route
  const isDashboard = location.pathname.startsWith('/admin') || location.pathname.startsWith('/member') || location.pathname.startsWith('/coach') ;
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  const hidePublicLayout = isDashboard || isAuthPage;

  return (
    <div className="min-h-screen antialiased selection:bg-emerald selection:text-white">
      {/* Show public Navbar ONLY if we aren't in Dashboard or Auth pages */}
      {!hidePublicLayout && <Navbar />}

      <main>
        <Routes>
          {/* --- PUBLIC ROUTES --- */}
          <Route path="/" element={<Home />} />
          <Route path="/announcements" element={<Updates />} />
          <Route path="/membership" element={<Membership />} />
          <Route path="/courts" element={<Courts />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* --- ADMIN DASHBOARD ROUTES (Nested) --- */}
          <Route element={<ProtectedRoute allowedRole="admin" />}>
            <Route element={<DashboardLayout role="admin" />}>
              <Route path="/admin/dashboard" element={<AdminHome />} />
              {/* You can add /admin/members or /admin/finance here later */}
            </Route>
          </Route>

          {/* Member Area */}
          <Route element={<ProtectedRoute allowedRole="member" />}>
            <Route element={<DashboardLayout role="member" />}>
              <Route path="/member/dashboard" element={<MemberHome />} />
            </Route>
          </Route>

          {/* Coach Area */}
          <Route element={<ProtectedRoute allowedRole="coach" />}>
            <Route element={<DashboardLayout role="coach" />}>
              <Route path="/coach/dashboard" element={<CoachHome />} />
            </Route>
          </Route>
        </Routes>

      </main>

      {/* Show public Footer ONLY if we aren't in Dashboard or Auth pages */}
      {!hidePublicLayout && <Footer />}
    </div>
  );
};

function App() {
  return (
    <Router>
      <MainContent />
    </Router>
  );
}

export default App;
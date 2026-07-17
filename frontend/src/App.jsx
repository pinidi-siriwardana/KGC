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
import AdminProfile from './pages/admin/AdminProfile';
import AdminUsers from './pages/admin/AdminUsers';
import AdminMembers from './pages/admin/AdminMembers';
import AdminCoaches from './pages/admin/AdminCoaches';
import AdminGuests from './pages/admin/AdminGuests';
import AdminStaff from './pages/admin/AdminStaff';
import AdminReciepts from './pages/admin/AdminReciepts';
import AdminCourts from './pages/admin/AdminCourts';
import AdminPayments from './pages/admin/AdminPayments';
import AdminMembershipTypes from './pages/admin/AdminMembershipTypes';
import AdminInquiries from './pages/admin/AdminInquiries';
import AdminAnnouncements from './pages/admin/AdminAnnouncements';
import AdminBookings from './pages/admin/AdminBookings';
import AdminAttendance from './pages/admin/AdminAttendance';
import AdminReports from './pages/admin/AdminReports';

import MemberHome from './pages/member/MemberHome';
import MemberAnnouncements from './pages/member/MemberAnnouncements';
import MemberBook from './pages/member/MemberBook';
import MemberSchedule from './pages/member/MemberSchedule';
import MemberHistory from './pages/member/MemberHistory';
import MemberPayments from './pages/member/MemberPayments';
import MemberProfile from './pages/member/MemberProfile';
import MembershipInfo from './pages/member/MembershipInfo';
import MemberInquiry from './pages/member/MemberInquiry';
import MembershipGate from './components/member/MembershipGate';


import CoachHome from './pages/coach/CoachHome';
import CoachAnnouncements from './pages/coach/CoachAnnouncements';
import CoachBook from './pages/coach/CoachBook';
import CoachSessions from './pages/coach/CoachSessions';
import CoachPayments from './pages/coach/CoachPayments';
import CoachProfile from './pages/coach/CoachProfile';
import CoachInquiry from './pages/coach/CoachInquiry';

import WeatherForecast from './pages/common/WeatherForecast';
import FitnessCalculator from './pages/common/FitnessCalculator';
import AttendanceLog from './pages/common/AttendanceLog';

const MainContent = () => {
  const location = useLocation();

  // 1. Updated Logic: Hide public layout for Login, Register, AND any Admin route
  // Trailing slash matters here — '/membership' starts with '/member' too, which
  // was wrongly hiding the public Membership page's navbar/footer.
  const isDashboard = location.pathname.startsWith('/admin/') || location.pathname.startsWith('/member/') || location.pathname.startsWith('/coach/');
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
              <Route path="/admin/profile" element={<AdminProfile />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/members" element={<AdminMembers />} />
              <Route path="/admin/coaches" element={<AdminCoaches />} />
              <Route path="/admin/guests" element={<AdminGuests />} />
              <Route path="/admin/staff" element={<AdminStaff />} />
              <Route path="/admin/verify-payments" element={<AdminReciepts />} />
              <Route path="/admin/payments" element={<AdminPayments />} />
              <Route path="/admin/membership-types" element={<AdminMembershipTypes />} />
              <Route path="/admin/reports" element={<AdminReports />} />
              <Route path="/admin/courts" element={<AdminCourts />} />
              <Route path="/admin/inquiries" element={<AdminInquiries />} />
              <Route path="/admin/announcements" element={<AdminAnnouncements />} />
              <Route path="/admin/bookings" element={<AdminBookings />} />
              <Route path="/admin/schedule" element={<AdminBookings />} />
              <Route path="/admin/attendance" element={<AdminAttendance />} />
              <Route path="/admin/weather" element={<WeatherForecast />} />
              <Route path="/admin/fitness" element={<FitnessCalculator />} />
            </Route>
          </Route>

          {/* Member Area */}
          <Route element={<ProtectedRoute allowedRole="member" />}>
            <Route element={<DashboardLayout role="member" />}>
              <Route element={<MembershipGate />}>
                <Route path="/member/dashboard" element={<MemberHome />} />
                <Route path="/member/announcements" element={<MemberAnnouncements />} />
                <Route path="/member/book" element={<MemberBook />} />
                <Route path="/member/schedule" element={<MemberSchedule />} />
                <Route path="/member/history" element={<MemberHistory />} />
                <Route path="/member/payments" element={<MemberPayments />} />
                <Route path="/member/profile" element={<MemberProfile />} />
                <Route path="/member/status" element={<MembershipInfo />} />
              </Route>
              {/* Outside the gate — a blocked/expired member still needs a way to reach admin,
                  and weather/fitness/attendance-history aren't tied to membership status either */}
              <Route path="/member/inquiry" element={<MemberInquiry />} />
              <Route path="/member/weather" element={<WeatherForecast />} />
              <Route path="/member/fitness" element={<FitnessCalculator />} />
              <Route path="/member/attendance" element={<AttendanceLog />} />
            </Route>
          </Route>

          {/* Coach Area */}
          <Route element={<ProtectedRoute allowedRole="coach" />}>
            <Route element={<DashboardLayout role="coach" />}>
              <Route path="/coach/dashboard" element={<CoachHome />} />
              <Route path="/coach/announcements" element={<CoachAnnouncements />} />
              <Route path="/coach/book" element={<CoachBook />} />
              <Route path="/coach/sessions" element={<CoachSessions />} />
              <Route path="/coach/payments" element={<CoachPayments />} />
              <Route path="/coach/profile" element={<CoachProfile />} />
              <Route path="/coach/inquiry" element={<CoachInquiry />} />
              <Route path="/coach/weather" element={<WeatherForecast />} />
              <Route path="/coach/fitness" element={<FitnessCalculator />} />
              <Route path="/coach/attendance" element={<AttendanceLog />} />
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
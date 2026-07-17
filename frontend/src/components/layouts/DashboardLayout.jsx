import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  LayoutDashboard, CalendarClock, Trophy, Timer,
  Users, UserCheck, UserPlus, MessageSquare,
  ShieldCheck, ClipboardCheck, CreditCard,
  BarChart3, Megaphone, LogOut, PlusCircle, History, UserCog, Menu, X,
  CloudSun, Activity
} from 'lucide-react';

const SidebarContent = ({ role, closeMobileMenu }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const menuConfig = {
    admin: [
      {
        group: "Operations", items: [
          { name: 'Live Bookings', icon: CalendarClock, path: '/admin/bookings' },
          { name: 'Court Status', icon: Trophy, path: '/admin/courts' },
          { name: 'Daily Attendance', icon: ClipboardCheck, path: '/admin/attendance' },
          { name: 'Inquiries', icon: MessageSquare, path: '/admin/inquiries' },
        ]
      },
      {
        group: "Profiles", items: [
          { name: 'Member Directory', icon: Users, path: '/admin/members' },
          { name: 'Coach Profiles', icon: UserCheck, path: '/admin/coaches' },
          { name: 'Guest Directory', icon: UserPlus, path: '/admin/guests' },
          { name: 'Staff Directory', icon: ShieldCheck, path: '/admin/staff' },
          { name: 'Access Management', icon: UserCog, path: '/admin/users' },
        ]
      },
      {
        group: "Payments", items: [
          { name: 'Verify Receipts', icon: ShieldCheck, path: '/admin/verify-payments' },
          { name: 'Payment Flow', icon: CreditCard, path: '/admin/payments' },
          { name: 'Membership Plans', icon: Trophy, path: '/admin/membership-types' },
          { name: 'Revenue Reports', icon: BarChart3, path: '/admin/reports' },
        ]
      },
      {
        group: "Account", items: [
          { name: 'Profile Settings', icon: UserCog, path: '/admin/profile' },
        ]
      },
      {
        group: "Tools", items: [
          { name: 'Weather Forecast', icon: CloudSun, path: '/admin/weather' },
          { name: 'BMI & Calories', icon: Activity, path: '/admin/fitness' },
        ]
      },

    ],
    member: [
      {
        group: "Reservations", items: [
          { name: 'Book a Court', icon: PlusCircle, path: '/member/book' },
          { name: 'My Schedule', icon: CalendarClock, path: '/member/schedule' },
          { name: 'Booking History', icon: History, path: '/member/history' },
          { name: 'My Attendance', icon: ClipboardCheck, path: '/member/attendance' },
        ]
      },
      {
        group: "Account", items: [
          { name: 'Membership Info', icon: Trophy, path: '/member/status' },
          { name: 'My Payments', icon: CreditCard, path: '/member/payments' },
          { name: 'Contact Admin', icon: MessageSquare, path: '/member/inquiry' },
          { name: 'Profile Settings', icon: UserCog, path: '/member/profile' },
        ]
      },
      {
        group: "Tools", items: [
          { name: 'Weather Forecast', icon: CloudSun, path: '/member/weather' },
          { name: 'BMI & Calories', icon: Activity, path: '/member/fitness' },
        ]
      }
    ],
    coach: [
      {
        group: "Training", items: [
          { name: 'Reserve Court', icon: PlusCircle, path: '/coach/book' },
          { name: 'Session Logs', icon: Timer, path: '/coach/sessions' },
          { name: 'My Attendance', icon: ClipboardCheck, path: '/coach/attendance' },
        ]
      },
      {
        group: "Finance", items: [
          { name: 'Payments', icon: CreditCard, path: '/coach/payments' },
        ]
      },
      {
        group: "Account", items: [
          { name: 'Contact Admin', icon: MessageSquare, path: '/coach/inquiry' },
          { name: 'Profile Settings', icon: UserCog, path: '/coach/profile' },
        ]
      },
      {
        group: "Tools", items: [
          { name: 'Weather Forecast', icon: CloudSun, path: '/coach/weather' },
          { name: 'BMI & Calories', icon: Activity, path: '/coach/fitness' },
        ]
      }
    ]
  };

  const commonGroups = [{
    group: "General",
    items: [
      { name: 'Dashboard', icon: LayoutDashboard, path: `/${role}/dashboard` },
      { name: 'Announcements', icon: Megaphone, path: `/${role}/announcements` },
    ]
  }];

  const activeMenu = [...commonGroups, ...(menuConfig[role] || [])];

  return (
    <aside className="w-72 bg-[#050505] border-r border-white/5 flex flex-col h-full overflow-y-auto no-scrollbar shrink-0">
      <div className="p-8 pb-4">
        <h2 className="text-white text-xl font-serif italic tracking-tighter">
          Kandy Garden <span className="text-amber-500">Club</span>
        </h2>
        <p className="text-[9px] font-black uppercase tracking-widest text-emerald-500 mt-1">
          {role} Portal
        </p>
      </div>

      <div className="flex-1 px-4 py-4 space-y-8">
        {activeMenu.map((group) => (
          <div key={group.group} className="space-y-2">
            <h3 className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/20 mb-3">
              {group.group}
            </h3>
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={closeMobileMenu}
                    className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all group no-underline ${isActive
                      ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'
                      }`}
                  >
                    <item.icon size={18} className={isActive ? 'text-amber-500' : 'text-gray-500 group-hover:text-amber-500 transition-colors'} />
                    <span className="text-[11px] font-bold uppercase tracking-widest">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="p-6 mt-auto border-t border-white/5 bg-black/50 backdrop-blur-md">
        <button onClick={handleSignOut} className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-red-500/60 hover:text-red-500 hover:bg-red-500/5 transition-all group">
          <LogOut size={18} />
          <span className="text-[11px] font-black uppercase tracking-widest">Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

const DashboardLayout = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // DYNAMIC ROLE DETECTION
  // Splits "/admin/dashboard" into ["", "admin", "dashboard"] and takes index 1
  const pathSegments = location.pathname.split('/');
  const detectedRole = pathSegments[1];

  // Validate that the role is one of our keys, otherwise default to admin
  const role = ['admin', 'member', 'coach'].includes(detectedRole) ? detectedRole : 'admin';

  const storedUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
      return null;
    }
  })();
  const username = storedUser?.username || role;

  return (
    <div className="flex h-screen bg-white overflow-hidden font-sans">

      {/* MOBILE SIDEBAR OVERLAY */}
      <div className={`fixed inset-0 z-50 lg:hidden transition-opacity duration-300 ${isSidebarOpen ? "visible opacity-100" : "invisible opacity-0"}`}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
        <div className={`absolute inset-y-0 left-0 transition-transform duration-300 transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <SidebarContent role={role} closeMobileMenu={() => setSidebarOpen(false)} />
        </div>
      </div>

      {/* DESKTOP SIDEBAR */}
      <div className="hidden lg:block">
        <SidebarContent role={role} />
      </div>

      {/* MAIN WHITE SIDE */}
      <div className="flex-1 flex flex-col relative overflow-hidden bg-white">

        <header className="h-20 border-b border-gray-100 flex items-center justify-between px-6 lg:px-8 bg-white/80 backdrop-blur-md z-20">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
              <Menu size={24} />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                {role} active • KGC Registry
              </span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right hidden sm:block">
              <p className="text-gray-900 text-xs font-bold uppercase tracking-tighter">{username}</p>
              <p className="text-amber-600 text-[9px] font-black uppercase tracking-widest">Authorized Access</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center text-white font-black text-xs uppercase">
              {username.charAt(0)}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 lg:p-10 relative bg-white">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-50/40 blur-[120px] rounded-full pointer-events-none" />
          <div className="relative z-10 max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
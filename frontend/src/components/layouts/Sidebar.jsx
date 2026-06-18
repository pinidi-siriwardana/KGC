import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, CalendarClock, Trophy, Timer, Users, UserCheck,
  UserPlus, MessageSquare, ShieldCheck, ClipboardCheck, CreditCard,
  BarChart3, Megaphone, LogOut, Search, User, Settings, Info
} from 'lucide-react';

const Sidebar = ({ role = 'admin' }) => { // Default to admin for safety
  const location = useLocation();

  // --- MENU CONFIGURATIONS BY ROLE ---
  const menus = {
    admin: [
      {
        group: "Overview",
        items: [{ name: 'Control Panel', icon: LayoutDashboard, path: '/admin/dashboard' }]
      },
      {
        group: "Operations",
        items: [
          { name: 'Live Bookings', icon: CalendarClock, path: '/admin/bookings' },
          { name: 'Court Status', icon: Trophy, path: '/admin/courts' },
          { name: 'Registration Queue', icon: Timer, path: '/admin/registrationQueue' },
        ]
      },
      {
        group: "People",
        items: [
          { name: 'Member Directory', icon: Users, path: '/admin/members' },
          { name: 'Coach Profiles', icon: UserCheck, path: '/admin/coaches' },
          { name: 'User Profiles', icon: UserCheck, path: '/admin/users' },
          { name: 'Guest Profiles', icon: UserCheck, path: '/admin/guests' },
          { name: 'Inquiries', icon: MessageSquare, path: '/admin/inquiries' },
        ]
      },
      {
        group: "Finance",
        items: [
          { name: 'Verify Receipts', icon: ShieldCheck, path: '/admin/reciepts' },
          { name: 'Revenue Reports', icon: BarChart3, path: '/admin/reports' },
        ]
      }
    ],
    member: [
      {
        group: "Member Club",
        items: [
          { name: 'My Dashboard', icon: LayoutDashboard, path: '/member/dashboard' },
          { name: 'Book a Court', icon: CalendarClock, path: '/member/book' },
          { name: 'My Memberships', icon: CreditCard, path: '/member/status' },
        ]
      },
      {
        group: "Activities",
        items: [
          { name: 'Tournaments', icon: Trophy, path: '/member/tournaments' },
          { name: 'Find Coach', icon: Search, path: '/member/coaches' },
          { name: 'Announcements', icon: Megaphone, path: '/member/news' },
        ]
      },
      {
        group: "Account",
        items: [
          { name: 'My Profile', icon: User, path: '/member/profile' },
          { name: 'Help & Support', icon: Info, path: '/member/support' },
        ]
      }
    ],
    coach: [
      {
        group: "Coach Panel",
        items: [
          { name: 'Session Feed', icon: Timer, path: '/coach/dashboard' },
          { name: 'My Trainees', icon: Users, path: '/coach/students' },
          { name: 'Attendance List', icon: ClipboardCheck, path: '/coach/attendance' },
        ]
      },
      {
        group: "Earning",
        items: [
          { name: 'Payout History', icon: BarChart3, path: '/coach/earnings' },
          { name: 'Settings', icon: Settings, path: '/coach/settings' },
        ]
      }
    ]
  };

  // Select the menu based on the passed role
  const activeMenu = menus[role] || [];

  return (
    <aside className="w-72 bg-obsidian border-r border-white/5 flex flex-col h-screen overflow-y-auto no-scrollbar">
      {/* Brand Branding */}
      <div className="p-8 pb-4">
        <h2 className="text-white text-xl font-serif italic tracking-tighter">
          Kandy Garden <span className="text-amber">Club</span>
        </h2>
        <p className="text-[9px] font-black uppercase tracking-widest text-emerald mt-1">
          {role} portal
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
                    className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all group no-underline ${isActive
                      ? 'bg-emerald/10 text-emerald border border-emerald/20'
                      : 'text-muted hover:bg-white/5 hover:text-white border border-transparent'
                      }`}
                  >
                    <item.icon size={18} className={isActive ? 'text-amber' : 'group-hover:text-amber transition-colors'} />
                    <span className="text-[11px] font-bold uppercase tracking-widest">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Logout */}
      <div className="p-6 mt-auto border-t border-white/5 bg-obsidian/50 backdrop-blur-md">
        <button className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-red-500/60 hover:text-red-500 hover:bg-red-500/5 transition-all group">
          <LogOut size={18} />
          <span className="text-[11px] font-black uppercase tracking-widest">Terminate Session</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
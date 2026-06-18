import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, CalendarClock, Trophy, Timer,
  Users, UserCheck, UserPlus, MessageSquare,
  ShieldCheck, ClipboardCheck, CreditCard,
  BarChart3, Megaphone, LogOut, PlusCircle, History, UserCog
} from 'lucide-react';

const Sidebar = ({ role = 'admin', closeMobileMenu }) => {
  const location = useLocation();

  const menuConfig = {
    admin: [
      {
        group: "Operations",
        items: [
          { name: 'Live Bookings', icon: CalendarClock, path: '/admin/bookings' },
          { name: 'Court Status', icon: Trophy, path: '/admin/courts' },
          { name: 'Master Schedule', icon: Timer, path: '/admin/schedule' },
        ]
      },
      {
        group: "People",
        items: [
          { name: 'Join Requests', icon: UserPlus, path: '/admin/requests' },
          { name: 'Member Directory', icon: Users, path: '/admin/members' },
          { name: 'Coach Profiles', icon: UserCheck, path: '/admin/coaches' },
          { name: 'Inquiries', icon: MessageSquare, path: '/admin/inquiries' },
          { name: 'Daily Attendance', icon: ClipboardCheck, path: '/admin/attendance' },
        ]
      },
      {
        group: "Finance",
        items: [
          { name: 'Verify Receipts', icon: ShieldCheck, path: '/admin/verify-payments' },
          { name: 'Payment Flow', icon: CreditCard, path: '/admin/payments' },
          { name: 'Revenue Reports', icon: BarChart3, path: '/admin/reports' },
        ]
      }
    ],
    member: [
      {
        group: "Reservations",
        items: [
          { name: 'Book a Court', icon: PlusCircle, path: '/member/book' },
          { name: 'My Schedule', icon: CalendarClock, path: '/member/schedule' },
          { name: 'Booking History', icon: History, path: '/member/history' },
        ]
      },
      {
        group: "Account",
        items: [
          { name: 'Membership Info', icon: Trophy, path: '/member/status' },
          { name: 'Profile Settings', icon: UserCog, path: '/member/profile' },
        ]
      }
    ],
    coach: [
      {
        group: "Training",
        items: [
          { name: 'Reserve Court', icon: PlusCircle, path: '/coach/book' },
          { name: 'My Students', icon: Users, path: '/coach/students' },
          { name: 'Session Logs', icon: Timer, path: '/coach/sessions' },
        ]
      },
      {
        group: "Finance",
        items: [
          { name: 'Earnings & Payments', icon: CreditCard, path: '/coach/payments' },
        ]
      }
    ]
  };

  const commonGroups = [
    {
      group: "General",
      items: [
        { name: 'Dashboard', icon: LayoutDashboard, path: `/${role}/dashboard` },
        { name: 'Announcements', icon: Megaphone, path: `/${role}/announcements` },
      ]
    }
  ];

  const activeMenu = [...commonGroups, ...(menuConfig[role] || [])];

  return (
    <aside className="w-72 bg-[#050505] border-r border-white/5 flex flex-col h-full overflow-y-auto overflow-x-hidden shadow-2xl">
      <div className="p-8 pb-4">
        <h2 className="text-white text-xl font-serif italic tracking-tighter">
          Kandy Garden <span className="text-orange-500">Club</span>
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
                    className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all group no-underline ${
                      isActive
                        ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                        : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'
                    }`}
                  >
                    <item.icon 
                      size={18} 
                      className={isActive ? 'text-orange-400' : 'text-gray-500 group-hover:text-orange-400 transition-colors'} 
                    />
                    <span className="text-[11px] font-bold uppercase tracking-widest">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="p-6 mt-auto border-t border-white/5 bg-black/50 backdrop-blur-md">
        <button className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-red-500/60 hover:text-red-500 hover:bg-red-500/5 transition-all group">
          <LogOut size={18} />
          <span className="text-[11px] font-black uppercase tracking-widest">Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
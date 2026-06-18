import React from 'react';
import { PlusCircle, Calendar, Trophy, Bell, Clock } from 'lucide-react';
import StatCard from '../../components/common/StatCard';

const MemberHome = () => {
  return (
    <div className="relative space-y-10 animate-in fade-in duration-700">
      {/* Background Glows (Subtle for white background) */}
      <div className="absolute -top-20 -right-20 w-80 h-80 bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none" />
      
      {/* Header */}
      <header className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-slate-900 text-4xl font-serif italic">Hello, Member.</h1>
          <p className="text-emerald-600 text-[10px] font-black uppercase tracking-[0.3em] mt-2">
            Ready for a match today?
          </p>
        </div>
        <button className="flex items-center gap-2 bg-emerald-600 px-6 py-3 rounded-xl text-white font-black uppercase tracking-widest text-[10px] hover:bg-slate-900 transition-all shadow-lg shadow-emerald-600/20">
          <PlusCircle size={16} />
          Book a Court
        </button>
      </header>

      {/* Quick Status Grid */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Ensure StatCard uses dark text for labels and values */}
        <StatCard label="Membership" value="Active" trend="Exp: Dec 2026" icon={Trophy} />
        <StatCard label="Next Booking" value="Tomorrow" trend="08:00 AM" icon={Calendar} />
        <StatCard label="Club Notifications" value="03" trend="New Update" icon={Bell} />
      </div>

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Upcoming Bookings */}
        <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-slate-800 text-lg font-serif italic">My Upcoming Matches</h3>
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none">Bookings Overview</span>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-white hover:shadow-md transition-all group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-700">
                  <Clock size={20} />
                </div>
                <div>
                  <p className="text-slate-900 text-sm font-bold group-hover:text-emerald-700 transition-colors">Court 01 (Clay)</p>
                  <p className="text-slate-500 text-[10px] uppercase">18th April • 08:00 AM - 09:00 AM</p>
                </div>
              </div>
              <span className="text-emerald-700 text-[9px] font-black uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                Confirmed
              </span>
            </div>
          </div>
        </div>

        {/* Club Announcements */}
        <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-8">
            <h3 className="text-slate-800 text-lg font-serif italic mb-6">Club Notices</h3>
            <div className="space-y-6">
                <div className="border-l-2 border-amber-500 pl-4 py-1 hover:bg-slate-50 transition-colors rounded-r-lg">
                    <p className="text-slate-800 text-sm font-bold leading-tight">Annual General Meeting 2026</p>
                    <p className="text-slate-500 text-[10px] mt-1 italic font-medium">All members are requested to attend...</p>
                </div>
                <div className="border-l-2 border-emerald-500 pl-4 py-1 hover:bg-slate-50 transition-colors rounded-r-lg">
                    <p className="text-slate-800 text-sm font-bold leading-tight">Court 03 Maintenance</p>
                    <p className="text-slate-500 text-[10px] mt-1 italic font-medium">Closed for resurfacing until Monday.</p>
                </div>
            </div>
            <button className="w-full mt-8 py-3 border border-slate-200 rounded-xl text-[9px] text-slate-400 uppercase tracking-widest font-black hover:text-slate-900 hover:border-slate-900 transition-all">
                View All Announcements
            </button>
        </div>

      </div>
    </div>
  );
};

export default MemberHome;
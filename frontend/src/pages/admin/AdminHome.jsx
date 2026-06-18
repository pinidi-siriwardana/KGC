import React from 'react';
import { Users, DollarSign, Activity, CalendarCheck, TrendingUp } from 'lucide-react';
import StatCard from '../../components/common/StatCard';

const AdminHome = () => {
  return (
    <div className="relative space-y-12">
      
      {/* --- ATMOSPHERIC GLOWS (Softened for Light Mode) --- */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/5 blur-[150px] rounded-full pointer-events-none" />

      {/* Header Section */}
      <header className="relative z-10 flex justify-between items-end">
        <div>
          <h1 className="text-slate-900 text-5xl font-serif italic tracking-tight">
            Welcome, <span className="text-amber-600">Superintendent.</span>
          </h1>
          <div className="flex items-center gap-3 mt-3">
            <span className="h-px w-8 bg-emerald-500" />
            <p className="text-emerald-600/60 text-[10px] uppercase tracking-[0.3em] font-black">
              Executive Overview • April 2026
            </p>
          </div>
        </div>
        <div className="hidden lg:block text-right">
          <p className="text-slate-400 text-[10px] uppercase font-black tracking-widest">Club Status</p>
          <p className="text-emerald-600 font-mono text-sm">OPERATIONAL</p>
        </div>
      </header>

      {/* Stats Grid - Using subtle borders and soft shadows instead of dark glass */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="hover:translate-y-[-4px] transition-transform duration-300">
          {/* Note: Ensure your StatCard component internal text is also dark! */}
          <StatCard label="Total Revenue" value="LKR 840k" trend="+12.5%" icon={DollarSign} />
        </div>
        <div className="hover:translate-y-[-4px] transition-transform duration-300">
          <StatCard label="Pending Apps" value="24" trend="Action Required" icon={Activity} />
        </div>
        <div className="hover:translate-y-[-4px] transition-transform duration-300">
          <StatCard label="Total Members" value="1,402" trend="+4%" icon={Users} />
        </div>
        <div className="hover:translate-y-[-4px] transition-transform duration-300">
          <StatCard label="Court Bookings" value="58" trend="Today" icon={CalendarCheck} />
        </div>
      </div>

      {/* Main Content: Charts & Activity */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Revenue Chart - Lightened Card */}
        <div className="lg:col-span-2 group relative bg-white border border-slate-100 shadow-sm rounded-3xl p-8 h-[450px] overflow-hidden">
            {/* Soft inner glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50/50 blur-3xl group-hover:bg-emerald-100/50 transition-colors" />
            
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h3 className="text-slate-800 text-lg font-serif italic">Revenue Analytics</h3>
                    <p className="text-slate-400 text-[10px] uppercase tracking-widest mt-1">Cash vs Online verification</p>
                </div>
                <TrendingUp className="text-emerald-500" size={20} />
            </div>

            <div className="w-full h-full flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                </div>
                <p className="text-slate-400 text-xs uppercase tracking-tighter italic font-medium">Aggregating Financial Data from Tables 9 & 10...</p>
            </div>
        </div>

        {/* Activity Sidebar - Lightened Card */}
        <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-8 h-[450px]">
            <h3 className="text-slate-800 text-lg font-serif italic mb-6">Recent Pulse</h3>
            <div className="space-y-6">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex gap-4 items-start">
                        <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shadow-[0_0_8px_rgba(245,158,11,0.3)]" />
                        <div>
                            <p className="text-slate-700 text-xs font-bold leading-none">New Join Request</p>
                            <p className="text-slate-400 text-[10px] uppercase mt-1">2 mins ago</p>
                        </div>
                    </div>
                ))}
            </div>
            <button className="w-full mt-10 py-4 border border-slate-200 rounded-xl text-[9px] text-slate-500 uppercase tracking-widest font-black hover:bg-slate-900 hover:text-white transition-all shadow-sm">
                View All Activity
            </button>
        </div>

      </div>
    </div>
  );
};

export default AdminHome;
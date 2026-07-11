import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, Users, CreditCard, Activity, Timer } from 'lucide-react';
import StatCard from '../../components/common/StatCard';
import { apiFetch } from '../../utils/api';

const CATEGORY_BORDER = {
  CHAMPIONSHIP: 'border-amber-500',
  MAINTENANCE: 'border-red-500',
  'CLUB EVENT': 'border-slate-900',
  GENERAL: 'border-emerald-500',
};

const CoachHome = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);

  useEffect(() => {
    apiFetch('/api/announcements')
      .then((res) => res.json())
      .then((data) => setAnnouncements((data.data || []).slice(0, 3)))
      .catch(() => setAnnouncements([]))
      .finally(() => setLoadingAnnouncements(false));
  }, []);

  return (
    <div className="relative space-y-10 animate-in fade-in duration-700">
      {/* Background Glows (Green for Growth/Coaching - Adjusted for Light Mode) */}
      <div className="absolute -top-20 -right-20 w-80 h-80 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none opacity-60" />
      <div className="absolute bottom-10 left-10 w-60 h-60 bg-amber-500/5 blur-[80px] rounded-full pointer-events-none opacity-40" />
      
      {/* Header */}
      <header className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-slate-900 text-4xl font-serif italic">
            Coach's <span className="text-amber-600">Court.</span>
          </h1>
          <p className="text-emerald-600 text-[10px] font-black uppercase tracking-[0.3em] mt-2 font-sans">
            Managing Sessions • April 2026
          </p>
        </div>
        <button className="flex items-center gap-2 bg-amber-500 px-6 py-3 rounded-xl text-slate-950 font-black uppercase tracking-widest text-[10px] hover:bg-slate-900 hover:text-white transition-all shadow-lg shadow-amber-500/20">
          <PlusCircle size={16} />
          Reserve Court
        </button>
      </header>

      {/* Coach Stats Grid */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Note: Ensure StatCard internals use dark text like text-slate-800 */}
        <StatCard label="Monthly Sessions" value="42" trend="+8% vs Last Month" icon={Activity} />
        <StatCard label="Total Students" value="12" trend="3 New Requests" icon={Users} />
        <StatCard label="Earnings" value="LKR 125k" trend="Paid to Club" icon={CreditCard} />
      </div>

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Today's Schedule */}
        <div className="lg:col-span-2 bg-white border border-slate-100 shadow-sm rounded-3xl p-8">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-slate-800 text-lg font-serif italic">Today's Training Schedule</h3>
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none">Live View</span>
          </div>

          <div className="space-y-4">
            {/* Session Card */}
            <div className="flex items-center justify-between p-5 bg-slate-50 border border-slate-100 rounded-2xl border-l-4 border-l-emerald-500 group hover:bg-white hover:shadow-md transition-all">
              <div className="flex items-center gap-5">
                <div className="text-right border-r border-slate-200 pr-5">
                   <p className="text-slate-900 font-bold text-sm">04:00</p>
                   <p className="text-slate-400 text-[9px] uppercase font-black">PM</p>
                </div>
                <div>
                  <p className="text-slate-800 text-sm font-bold group-hover:text-amber-600 transition-colors">Advanced Drill: S. Perera</p>
                  <p className="text-slate-500 text-[10px] uppercase flex items-center gap-2">
                    <Timer size={12} className="text-emerald-600" /> 60 Mins • Court 02
                  </p>
                </div>
              </div>
              <button className="text-[9px] font-black uppercase text-slate-400 hover:text-slate-900 transition-colors">
                Details
              </button>
            </div>
            
            {/* Empty Slot Placeholder */}
            <div className="flex items-center justify-center p-5 border border-dashed border-slate-200 rounded-2xl bg-slate-50/30">
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Next Available Slot: 06:00 PM</p>
            </div>
          </div>
        </div>

        {/* Financial Snapshot */}
        <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-8">
            <h3 className="text-slate-800 text-lg font-serif italic mb-6">Pending Dues</h3>
            <p className="text-slate-500 text-[10px] uppercase mb-8 leading-relaxed">
                Please verify receipts for the following bookings to secure your slot.
            </p>
            
            <div className="space-y-6">
                <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div>
                        <p className="text-slate-800 text-xs font-bold">Booking #921</p>
                        <p className="text-amber-600 text-[9px] font-black uppercase">LKR 2,500</p>
                    </div>
                    <button className="p-2 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-600 hover:text-white transition-all">
                        <CreditCard size={14} />
                    </button>
                </div>
            </div>
            
            <button className="w-full mt-10 py-4 border border-slate-200 rounded-xl text-[9px] text-slate-500 uppercase tracking-widest font-black hover:bg-slate-950 hover:text-white hover:border-slate-950 transition-all shadow-sm">
                View Transaction History
            </button>
        </div>

      </div>

      {/* Club Announcements */}
      <div className="relative z-10 bg-white border border-slate-100 shadow-sm rounded-3xl p-8">
          <h3 className="text-slate-800 text-lg font-serif italic mb-6">Club Notices</h3>
          <div className="space-y-6">
              {loadingAnnouncements && (
                  <p className="text-slate-400 text-[10px] uppercase tracking-widest font-black">Loading notices...</p>
              )}
              {!loadingAnnouncements && announcements.length === 0 && (
                  <p className="text-slate-400 text-[10px] uppercase tracking-widest font-black">No announcements yet.</p>
              )}
              {announcements.map((item) => (
                  <div
                      key={item.announcement_id}
                      className={`border-l-2 ${CATEGORY_BORDER[item.category] || CATEGORY_BORDER.GENERAL} pl-4 py-1 hover:bg-slate-50 transition-colors rounded-r-lg`}
                  >
                      <p className="text-slate-800 text-sm font-bold leading-tight">{item.title}</p>
                      <p className="text-slate-500 text-[10px] mt-1 italic font-medium truncate">{item.content}</p>
                  </div>
              ))}
          </div>
          <Link
              to="/coach/announcements"
              className="block w-full mt-8 py-3 border border-slate-200 rounded-xl text-center text-[9px] text-slate-400 uppercase tracking-widest font-black hover:text-slate-900 hover:border-slate-900 transition-all no-underline"
          >
              View All Announcements
          </Link>
      </div>
    </div>
  );
};

export default CoachHome;
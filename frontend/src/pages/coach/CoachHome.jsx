import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PlusCircle, Wallet, CreditCard, Activity, Timer, UserCheck, CalendarCheck } from 'lucide-react';
import StatCard from '../../components/common/StatCard';
import CourtWeather from '../../components/common/CourtWeather';
import { apiFetch } from '../../utils/api';

const CATEGORY_BORDER = {
  CHAMPIONSHIP: 'border-amber-500',
  MAINTENANCE: 'border-red-500',
  'CLUB EVENT': 'border-slate-900',
  GENERAL: 'border-emerald-500',
};

const todayISO = () => new Date().toISOString().slice(0, 10);
const formatLKR = (n) => `LKR ${Number(n || 0).toLocaleString('en-LK', { maximumFractionDigits: 0 })}`;

const CoachHome = () => {
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);
  const [coach, setCoach] = useState(null);
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [sessionStats, setSessionStats] = useState({ thisMonth: 0, lastMonth: 0 });
  const [courtStats, setCourtStats] = useState({ totalDays: 0, totalHours: 0, bestPartner: null });
  const [financials, setFinancials] = useState({ paidToClub: 0, paidCount: 0, outstanding: [] });
  const [loadingFinancials, setLoadingFinancials] = useState(true);

  useEffect(() => {
    apiFetch('/api/attendance/my-stats')
      .then((res) => res.json())
      .then((data) => setCourtStats({ totalDays: data.totalDays || 0, totalHours: data.totalHours || 0, bestPartner: data.bestPartner || null }))
      .catch(() => setCourtStats({ totalDays: 0, totalHours: 0, bestPartner: null }));
  }, []);

  useEffect(() => {
    apiFetch('/api/announcements')
      .then((res) => res.json())
      .then((data) => setAnnouncements((data.data || []).slice(0, 3)))
      .catch(() => setAnnouncements([]))
      .finally(() => setLoadingAnnouncements(false));
  }, []);

  useEffect(() => {
    apiFetch('/api/coach/me')
      .then((res) => res.json())
      .then((data) => setCoach(data.coach || null))
      .catch(() => setCoach(null));
  }, []);

  useEffect(() => {
    apiFetch('/api/bookings')
      .then((res) => res.json())
      .then((data) => {
        const bookings = data.data || [];
        const upcoming = bookings
          .filter((b) => b.booking_date >= todayISO() && ['pending', 'confirmed'].includes(b.status))
          .sort((a, b) => (a.booking_date + a.start_time).localeCompare(b.booking_date + b.start_time));
        setUpcomingBookings(upcoming.slice(0, 4));

        const thisMonthKey = todayISO().slice(0, 7);
        const lastMonthDate = new Date();
        lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
        const lastMonthKey = lastMonthDate.toISOString().slice(0, 7);

        const confirmed = bookings.filter((b) => b.status === 'confirmed');
        setSessionStats({
          thisMonth: confirmed.filter((b) => b.booking_date.startsWith(thisMonthKey)).length,
          lastMonth: confirmed.filter((b) => b.booking_date.startsWith(lastMonthKey)).length,
        });
      })
      .catch(() => setUpcomingBookings([]))
      .finally(() => setLoadingBookings(false));
  }, []);

  useEffect(() => {
    apiFetch('/api/coach/payments')
      .then((res) => res.json())
      .then((data) => {
        const payments = data.payments || [];
        const completed = payments.filter((p) => p.status === 'completed');
        const outstanding = payments.filter((p) => p.status === 'recorded');
        setFinancials({
          paidToClub: completed.reduce((sum, p) => sum + Number(p.amount), 0),
          paidCount: completed.length,
          outstanding,
        });
      })
      .catch(() => setFinancials({ paidToClub: 0, paidCount: 0, outstanding: [] }))
      .finally(() => setLoadingFinancials(false));
  }, []);

  const sessionTrend = sessionStats.lastMonth > 0
    ? `${sessionStats.thisMonth >= sessionStats.lastMonth ? '+' : ''}${Math.round(((sessionStats.thisMonth - sessionStats.lastMonth) / sessionStats.lastMonth) * 100)}% vs Last Month`
    : (sessionStats.thisMonth > 0 ? 'New This Month' : 'No Sessions Yet');

  return (
    <div className="relative space-y-10 animate-in fade-in duration-700">
      {/* Background Glows (Green for Growth/Coaching - Adjusted for Light Mode) */}
      <div className="absolute -top-20 -right-20 w-80 h-80 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none opacity-60" />
      <div className="absolute bottom-10 left-10 w-60 h-60 bg-amber-500/5 blur-[80px] rounded-full pointer-events-none opacity-40" />

      {/* Header */}
      <header className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-slate-900 text-4xl font-serif italic">
            {coach ? coach.full_name.split(' ')[0] : 'Coach'}'s <span className="text-amber-600">Court.</span>
          </h1>
          <p className="text-emerald-600 text-[10px] font-black uppercase tracking-[0.3em] mt-2 font-sans">
            {coach?.specialization ? `${coach.specialization} Coach` : 'Managing Sessions'}
          </p>
        </div>
        <button
          onClick={() => navigate('/coach/book')}
          className="flex items-center gap-2 bg-amber-500 px-6 py-3 rounded-xl text-slate-950 font-black uppercase tracking-widest text-[10px] hover:bg-slate-900 hover:text-white transition-all shadow-lg shadow-amber-500/20"
        >
          <PlusCircle size={16} />
          Reserve Court
        </button>
      </header>

      {/* Coach Stats Grid */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Note: Ensure StatCard internals use dark text like text-slate-800 */}
        <StatCard label="Monthly Sessions" value={loadingBookings ? '···' : sessionStats.thisMonth} trend={loadingBookings ? undefined : sessionTrend} icon={Activity} />
        <StatCard label="Upcoming Sessions" value={loadingBookings ? '···' : upcomingBookings.length} trend="Reserved" icon={CalendarCheck} />
        <StatCard
          label="Paid to Club"
          value={loadingFinancials ? '···' : formatLKR(financials.paidToClub)}
          trend={loadingFinancials ? undefined : `${financials.paidCount} payment${financials.paidCount === 1 ? '' : 's'}`}
          icon={Wallet}
        />
        <StatCard
          label="Hours on Court"
          value={`${courtStats.totalHours}h`}
          trend={`${courtStats.totalDays} day${courtStats.totalDays === 1 ? '' : 's'} played`}
          icon={Timer}
        />
        <StatCard
          label="Best Partner"
          value={courtStats.bestPartner?.name || 'None yet'}
          trend={courtStats.bestPartner ? `${courtStats.bestPartner.sessions} sessions together` : 'Play more to find out'}
          icon={UserCheck}
        />
      </div>

      <div className="relative z-10">
        <CourtWeather />
      </div>

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Today's Schedule */}
        <div className="lg:col-span-2 bg-white border border-slate-100 shadow-sm rounded-3xl p-8">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-slate-800 text-lg font-serif italic">Today's Training Schedule</h3>
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none">Live View</span>
          </div>

          <div className="space-y-4">
            {loadingBookings && (
              <p className="text-slate-400 text-[10px] uppercase tracking-widest font-black">Loading schedule...</p>
            )}
            {!loadingBookings && upcomingBookings.length === 0 && (
              <div className="flex items-center justify-center p-5 border border-dashed border-slate-200 rounded-2xl bg-slate-50/30">
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">No upcoming sessions reserved</p>
              </div>
            )}
            {upcomingBookings.map((b) => (
              <div key={b.booking_id} className="flex items-center justify-between p-5 bg-slate-50 border border-slate-100 rounded-2xl border-l-4 border-l-emerald-500 group hover:bg-white hover:shadow-md transition-all">
                <div className="flex items-center gap-5">
                  <div className="text-right border-r border-slate-200 pr-5">
                     <p className="text-slate-900 font-bold text-sm">{b.start_time?.slice(0, 5)}</p>
                     <p className="text-slate-400 text-[9px] uppercase font-black">{b.booking_date}</p>
                  </div>
                  <div>
                    <p className="text-slate-800 text-sm font-bold group-hover:text-amber-600 transition-colors">{b.court_name} ({b.court_type})</p>
                    <p className="text-slate-500 text-[10px] uppercase flex items-center gap-2">
                      <Timer size={12} className="text-emerald-600" /> {b.start_time?.slice(0, 5)} - {b.end_time?.slice(0, 5)}
                    </p>
                  </div>
                </div>
                <span className="text-emerald-700 text-[9px] font-black uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                  {b.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Financial Snapshot */}
        <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-8">
            <h3 className="text-slate-800 text-lg font-serif italic mb-6">Pending Dues</h3>
            <p className="text-slate-500 text-[10px] uppercase mb-8 leading-relaxed">
                Outstanding fees awaiting settlement with the club.
            </p>

            <div className="space-y-4">
                {loadingFinancials && (
                    <p className="text-slate-400 text-[10px] uppercase tracking-widest font-black text-center py-4">Loading...</p>
                )}
                {!loadingFinancials && financials.outstanding.length === 0 && (
                    <div className="flex items-center justify-center p-5 border border-dashed border-slate-200 rounded-2xl bg-slate-50/30">
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">No outstanding dues</p>
                    </div>
                )}
                {financials.outstanding.slice(0, 4).map((p) => (
                    <div key={p.payment_id} className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <div>
                            <p className="text-slate-800 text-xs font-bold capitalize">{p.payment_type.replace(/_/g, ' ')}</p>
                            <p className="text-amber-600 text-[9px] font-black uppercase">{formatLKR(p.amount)}</p>
                        </div>
                        <button
                            onClick={() => navigate('/coach/payments')}
                            className="p-2 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-600 hover:text-white transition-all"
                            title="Settle this fee"
                        >
                            <CreditCard size={14} />
                        </button>
                    </div>
                ))}
            </div>

            <button
                onClick={() => navigate('/coach/payments')}
                className="w-full mt-10 py-4 border border-slate-200 rounded-xl text-[9px] text-slate-500 uppercase tracking-widest font-black hover:bg-slate-950 hover:text-white hover:border-slate-950 transition-all shadow-sm"
            >
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
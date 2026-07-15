import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import { PlusCircle, Calendar, Trophy, Bell, Clock, Timer, Users } from 'lucide-react';
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

const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const MemberHome = () => {
  const { member, membership } = useOutletContext();
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [courtStats, setCourtStats] = useState({ totalDays: 0, totalHours: 0, bestPartner: null });

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
    apiFetch('/api/bookings')
      .then((res) => res.json())
      .then((data) => {
        const upcoming = (data.data || [])
          .filter((b) => b.booking_date >= todayISO() && ['pending', 'confirmed'].includes(b.status))
          .sort((a, b) => (a.booking_date + a.start_time).localeCompare(b.booking_date + b.start_time));
        setUpcomingBookings(upcoming.slice(0, 3));
      })
      .catch(() => setUpcomingBookings([]))
      .finally(() => setLoadingBookings(false));
  }, []);

  const membershipValue = membership ? (membership.is_expired ? 'Expired' : 'Active') : 'No Plan';
  const membershipTrend = membership ? `Exp: ${formatDate(membership.end_date)}` : 'Contact Admin';
  const nextBooking = upcomingBookings[0];

  return (
    <div className="relative space-y-10 animate-in fade-in duration-700">
      {/* Background Glows (Subtle for white background) */}
      <div className="absolute -top-20 -right-20 w-80 h-80 bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-slate-900 text-4xl font-serif italic">Hello, {member ? member.full_name.split(' ')[0] : 'Member'}.</h1>
          <p className="text-emerald-600 text-[10px] font-black uppercase tracking-[0.3em] mt-2">
            Ready for a match today?
          </p>
        </div>
        <button
          onClick={() => navigate('/member/book')}
          className="flex items-center gap-2 bg-emerald-600 px-6 py-3 rounded-xl text-white font-black uppercase tracking-widest text-[10px] hover:bg-slate-900 transition-all shadow-lg shadow-emerald-600/20"
        >
          <PlusCircle size={16} />
          Book a Court
        </button>
      </header>

      {/* Quick Status Grid */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Ensure StatCard uses dark text for labels and values */}
        <StatCard label="Membership" value={membershipValue} trend={membershipTrend} icon={Trophy} />
        <StatCard
          label="Next Booking"
          value={nextBooking ? nextBooking.court_name : 'None'}
          trend={nextBooking ? `${nextBooking.booking_date} • ${nextBooking.start_time?.slice(0, 5)}` : 'Book a slot'}
          icon={Calendar}
        />
        <StatCard label="Club Notifications" value="03" trend="New Update" icon={Bell} />
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
          icon={Users}
        />
      </div>

      <div className="relative z-10">
        <CourtWeather />
      </div>

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Upcoming Bookings */}
        <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-slate-800 text-lg font-serif italic">My Upcoming Matches</h3>
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none">Bookings Overview</span>
          </div>

          <div className="space-y-4">
            {loadingBookings && (
              <p className="text-slate-400 text-[10px] uppercase tracking-widest font-black">Loading bookings...</p>
            )}
            {!loadingBookings && upcomingBookings.length === 0 && (
              <p className="text-slate-400 text-[10px] uppercase tracking-widest font-black">No upcoming bookings yet.</p>
            )}
            {upcomingBookings.map((b) => (
              <div key={b.booking_id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-white hover:shadow-md transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-700">
                    <Clock size={20} />
                  </div>
                  <div>
                    <p className="text-slate-900 text-sm font-bold group-hover:text-emerald-700 transition-colors">{b.court_name} ({b.court_type})</p>
                    <p className="text-slate-500 text-[10px] uppercase">{b.booking_date} • {b.start_time?.slice(0, 5)} - {b.end_time?.slice(0, 5)}</p>
                  </div>
                </div>
                <span className="text-emerald-700 text-[9px] font-black uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                  {b.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Club Announcements */}
        <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-8">
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
                to="/member/announcements"
                className="block w-full mt-8 py-3 border border-slate-200 rounded-xl text-center text-[9px] text-slate-400 uppercase tracking-widest font-black hover:text-slate-900 hover:border-slate-900 transition-all no-underline"
            >
                View All Announcements
            </Link>
        </div>

      </div>
    </div>
  );
};

export default MemberHome;
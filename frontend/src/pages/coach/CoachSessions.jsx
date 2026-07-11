import React, { useState, useEffect } from 'react';
import { Clock, History, Lock, X } from 'lucide-react';
import { apiFetch } from '../../utils/api';

const todayISO = () => new Date().toISOString().slice(0, 10);

const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

const STATUS_STYLE = {
    confirmed: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    cancelled: 'text-slate-500 bg-slate-50 border-slate-200',
    rejected: 'text-red-600 bg-red-50 border-red-100',
    pending: 'text-amber-600 bg-amber-50 border-amber-100',
};

const CoachSessions = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('upcoming');

    const fetchBookings = () => {
        apiFetch('/api/bookings')
            .then((res) => res.json())
            .then((data) => setBookings(data.data || []))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchBookings(); }, []);

    const handleCancel = async (booking) => {
        if (!window.confirm('Cancel this session?')) return;
        const res = await apiFetch(`/api/bookings/${booking.booking_id}`, {
            method: 'PATCH',
            body: JSON.stringify({ action: 'cancel' }),
        });
        if (res.ok) {
            fetchBookings();
        } else {
            const err = await res.json();
            alert(err.message || 'Failed to cancel session.');
        }
    };

    const upcoming = bookings
        .filter((b) => b.booking_date >= todayISO() && ['pending', 'confirmed'].includes(b.status))
        .sort((a, b) => (a.booking_date + a.start_time).localeCompare(b.booking_date + b.start_time));

    const history = bookings
        .filter((b) => b.booking_date < todayISO() || ['cancelled', 'rejected'].includes(b.status))
        .sort((a, b) => (b.booking_date + b.start_time).localeCompare(a.booking_date + a.start_time));

    const rows = tab === 'upcoming' ? upcoming : history;

    return (
        <div className="relative space-y-8 animate-in fade-in duration-700">
            <header className="relative z-10 flex items-center justify-between">
                <div>
                    <h1 className="text-slate-900 text-4xl font-serif italic">Session <span className="text-amber-600">Logs.</span></h1>
                    <p className="text-emerald-600 text-[10px] font-black uppercase tracking-[0.3em] mt-2">Your Reserved Courts</p>
                </div>
                <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
                    <button
                        onClick={() => setTab('upcoming')}
                        className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${tab === 'upcoming' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
                    >
                        Upcoming
                    </button>
                    <button
                        onClick={() => setTab('history')}
                        className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${tab === 'history' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
                    >
                        History
                    </button>
                </div>
            </header>

            <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-8">
                {loading && (
                    <p className="text-slate-400 text-[10px] uppercase tracking-widest font-black py-10 text-center">Loading...</p>
                )}
                {!loading && rows.length === 0 && (
                    <p className="text-slate-400 text-[10px] uppercase tracking-widest font-black py-10 text-center">
                        {tab === 'upcoming' ? 'No upcoming sessions.' : 'No past sessions yet.'}
                    </p>
                )}
                <div className="space-y-4">
                    {rows.map((b) => (
                        <div key={b.booking_id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-700">
                                    {tab === 'upcoming' ? <Clock size={20} /> : <History size={20} />}
                                </div>
                                <div>
                                    <p className="text-slate-900 text-sm font-bold">{b.court_name} ({b.court_type})</p>
                                    <p className="text-slate-500 text-[10px] uppercase">
                                        {formatDate(b.booking_date)} • {b.start_time?.slice(0, 5)} - {b.end_time?.slice(0, 5)}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${STATUS_STYLE[b.status] || STATUS_STYLE.pending}`}>
                                    {b.status}
                                </span>
                                {tab === 'upcoming' && (
                                    b.lock_status === 'locked' ? (
                                        <Lock size={14} className="text-slate-400" title="Locked by admin" />
                                    ) : (
                                        <button
                                            onClick={() => handleCancel(b)}
                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Cancel session"
                                        >
                                            <X size={16} />
                                        </button>
                                    )
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CoachSessions;

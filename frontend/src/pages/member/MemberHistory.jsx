import React, { useState, useEffect } from 'react';
import { History } from 'lucide-react';
import { apiFetch } from '../../utils/api';

const todayISO = () => new Date().toISOString().slice(0, 10);

const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const STATUS_STYLE = {
    confirmed: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    cancelled: 'text-slate-500 bg-slate-50 border-slate-200',
    rejected: 'text-red-600 bg-red-50 border-red-100',
    pending: 'text-amber-600 bg-amber-50 border-amber-100',
};

const MemberHistory = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiFetch('/api/bookings')
            .then((res) => res.json())
            .then((data) => setBookings(data.data || []))
            .finally(() => setLoading(false));
    }, []);

    const past = bookings
        .filter((b) => b.booking_date < todayISO() || ['cancelled', 'rejected'].includes(b.status))
        .sort((a, b) => (b.booking_date + b.start_time).localeCompare(a.booking_date + a.start_time));

    return (
        <div className="relative space-y-8 animate-in fade-in duration-700">
            <header className="relative z-10">
                <h1 className="text-slate-900 text-4xl font-serif italic">Booking History.</h1>
                <p className="text-emerald-600 text-[10px] font-black uppercase tracking-[0.3em] mt-2">Past &amp; Cancelled Bookings</p>
            </header>

            <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-8">
                {loading && (
                    <p className="text-slate-400 text-[10px] uppercase tracking-widest font-black py-10 text-center">Loading...</p>
                )}
                {!loading && past.length === 0 && (
                    <p className="text-slate-400 text-[10px] uppercase tracking-widest font-black py-10 text-center">No past bookings yet.</p>
                )}
                <div className="space-y-4">
                    {past.map((b) => (
                        <div key={b.booking_id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500">
                                    <History size={20} />
                                </div>
                                <div>
                                    <p className="text-slate-900 text-sm font-bold">{b.court_name} ({b.court_type})</p>
                                    <p className="text-slate-500 text-[10px] uppercase">
                                        {formatDate(b.booking_date)} • {b.start_time?.slice(0, 5)} - {b.end_time?.slice(0, 5)}
                                    </p>
                                </div>
                            </div>
                            <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${STATUS_STYLE[b.status] || STATUS_STYLE.pending}`}>
                                {b.status}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MemberHistory;

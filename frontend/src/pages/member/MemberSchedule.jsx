import React, { useState, useEffect } from 'react';
import { Clock, Lock, X } from 'lucide-react';
import { apiFetch } from '../../utils/api';
import { todayISO } from '../../utils/date';

const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

const MemberSchedule = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cancellationFee, setCancellationFee] = useState(null);

    const fetchBookings = () => {
        apiFetch('/api/bookings')
            .then((res) => res.json())
            .then((data) => setBookings(data.data || []))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchBookings(); }, []);

    useEffect(() => {
        apiFetch('/api/settings').then((res) => res.json()).then((data) => setCancellationFee(data.data?.cancellation_fee ?? null));
    }, []);

    const handleCancel = async (booking) => {
        const feeNote = cancellationFee && Number(cancellationFee) > 0
            ? ` A cancellation fee of LKR ${cancellationFee} will be charged to your account.`
            : '';
        if (!window.confirm(`Cancel this booking?${feeNote}`)) return;

        const res = await apiFetch(`/api/bookings/${booking.booking_id}`, {
            method: 'PATCH',
            body: JSON.stringify({ action: 'cancel' }),
        });
        const result = await res.json();
        if (res.ok) {
            alert(result.message || 'Booking cancelled.');
            fetchBookings();
        } else {
            alert(result.message || 'Failed to cancel booking.');
        }
    };

    const upcoming = bookings
        .filter((b) => b.booking_date >= todayISO() && ['pending', 'confirmed'].includes(b.status))
        .sort((a, b) => (a.booking_date + a.start_time).localeCompare(b.booking_date + b.start_time));

    return (
        <div className="relative space-y-8 animate-in fade-in duration-700">
            <header className="relative z-10">
                <h1 className="text-slate-900 text-4xl font-serif italic">My Schedule.</h1>
                <p className="text-emerald-600 text-[10px] font-black uppercase tracking-[0.3em] mt-2">Upcoming Court Bookings</p>
            </header>

            <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-8">
                {loading && (
                    <p className="text-slate-400 text-[10px] uppercase tracking-widest font-black py-10 text-center">Loading...</p>
                )}
                {!loading && upcoming.length === 0 && (
                    <p className="text-slate-400 text-[10px] uppercase tracking-widest font-black py-10 text-center">No upcoming bookings.</p>
                )}
                <div className="space-y-4">
                    {upcoming.map((b) => (
                        <div key={b.booking_id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-700">
                                    <Clock size={20} />
                                </div>
                                <div>
                                    <p className="text-slate-900 text-sm font-bold">{b.court_name} ({b.court_type})</p>
                                    <p className="text-slate-500 text-[10px] uppercase">
                                        {formatDate(b.booking_date)} • {b.start_time?.slice(0, 5)} - {b.end_time?.slice(0, 5)}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-emerald-700 text-[9px] font-black uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                                    {b.status}
                                </span>
                                {b.lock_status === 'locked' ? (
                                    <Lock size={14} className="text-slate-400" title="Locked by admin" />
                                ) : (
                                    <button
                                        onClick={() => handleCancel(b)}
                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Cancel booking"
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MemberSchedule;

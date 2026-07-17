import React, { useState, useEffect } from 'react';
import { Clock, History } from 'lucide-react';
import { apiFetch } from '../../utils/api';

const formatDate = (dateStr) =>
    dateStr ? new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

const timeOf = (ts) => (ts ? ts.slice(11, 16) : '');

// Matches the same " " → "T" normalization used elsewhere for these raw
// MySQL timestamp strings (dateStrings:true in config/db.js), so Date
// parsing is consistent across browsers.
const toDate = (ts) => (ts ? new Date(ts.replace(' ', 'T')) : null);

const formatDuration = (checkin, checkout) => {
    if (!checkout) return null;
    const minutes = Math.round((toDate(checkout) - toDate(checkin)) / 60000);
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

// Shared by both the member and coach portals — role-agnostic like
// WeatherForecast/FitnessCalculator, since the backend scopes the data to
// whoever's logged in (GET /api/attendance/my-history).
const AttendanceLog = () => {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ from: '', to: '' });

    useEffect(() => {
        setLoading(true);
        const params = new URLSearchParams();
        if (filters.from) params.append('from', filters.from);
        if (filters.to) params.append('to', filters.to);

        apiFetch(`/api/attendance/my-history?${params.toString()}`)
            .then((res) => res.json())
            .then((data) => setRows(data.data || []))
            .finally(() => setLoading(false));
    }, [filters]);

    return (
        <div className="relative space-y-8 animate-in fade-in duration-700">
            <header className="relative z-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div>
                    <h1 className="text-slate-900 text-4xl font-serif italic">My Attendance.</h1>
                    <p className="text-blue-600 text-[10px] font-black uppercase tracking-[0.3em] mt-2">Check-In &amp; Check-Out Log</p>
                </div>
                <div className="flex items-center gap-2">
                    <input type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })}
                        className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none" />
                    <span className="text-slate-400 text-xs">to</span>
                    <input type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })}
                        className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none" />
                </div>
            </header>

            <div className="bg-white border border-slate-100 shadow-sm rounded-3xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-slate-400 text-[9px] uppercase tracking-widest bg-slate-50/50">
                                <th className="p-4 font-black">Date</th>
                                <th className="p-4 font-black">Court / Time Slot</th>
                                <th className="p-4 font-black">Check-In</th>
                                <th className="p-4 font-black">Check-Out</th>
                                <th className="p-4 font-black">Duration</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {rows.map((r) => (
                                <tr key={r.attendance_id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4 text-slate-900 text-sm font-bold">{formatDate(r.booking_date || r.checkin_time?.slice(0, 10))}</td>
                                    <td className="p-4 text-slate-600 text-[11px]">
                                        {r.court_name ? `${r.court_name} · ${r.start_time?.slice(0, 5)}-${r.end_time?.slice(0, 5)}` : '—'}
                                    </td>
                                    <td className="p-4 text-slate-600 text-[11px] font-mono">
                                        <span className="flex items-center gap-1.5">
                                            <Clock size={11} className="text-emerald-500" /> {timeOf(r.checkin_time)}
                                        </span>
                                    </td>
                                    <td className="p-4 text-slate-600 text-[11px] font-mono">
                                        {r.checkout_time
                                            ? timeOf(r.checkout_time)
                                            : <span className="text-amber-600 font-bold uppercase text-[9px] tracking-widest">In Progress</span>}
                                    </td>
                                    <td className="p-4 text-slate-600 text-[11px] font-bold">{formatDuration(r.checkin_time, r.checkout_time) || '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {loading && (
                        <p className="text-slate-400 text-[10px] uppercase tracking-widest font-black py-10 text-center">Loading...</p>
                    )}
                    {!loading && rows.length === 0 && (
                        <div className="py-16 text-center">
                            <History className="mx-auto text-slate-300 mb-3" size={28} />
                            <p className="text-slate-400 text-[10px] uppercase tracking-widest font-black">No attendance recorded yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AttendanceLog;

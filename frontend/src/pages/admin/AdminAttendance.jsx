import React, { useState, useEffect } from 'react';
import { CalendarDays, UserPlus, LogOut, Ban, CheckCircle2, Clock } from 'lucide-react';
import { apiFetch } from '../../utils/api';

const todayISO = () => new Date().toISOString().slice(0, 10);

const timeOf = (ts) => ts ? ts.slice(11, 16) : '';

const AdminAttendance = () => {
    const [selectedDate, setSelectedDate] = useState(todayISO());
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [members, setMembers] = useState([]);
    const [coaches, setCoaches] = useState([]);
    const [addAttendeeFor, setAddAttendeeFor] = useState(null);
    const [addAttendeeValue, setAddAttendeeValue] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        apiFetch('/api/members').then((res) => res.json()).then((data) => setMembers(data.data || []));
        apiFetch('/api/coaches').then((res) => res.json()).then((data) => setCoaches(data.data || []));
    }, []);

    const fetchAttendance = () => {
        setLoading(true);
        apiFetch(`/api/attendance?date=${selectedDate}`)
            .then((res) => res.json())
            .then((data) => setRows(data.data || []))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        apiFetch(`/api/attendance?date=${selectedDate}`)
            .then((res) => res.json())
            .then((data) => setRows(data.data || []))
            .finally(() => setLoading(false));
    }, [selectedDate]);

    const flash = (setter, text) => {
        setter(text);
        setTimeout(() => setter(''), 4000);
    };

    const handleCheckIn = async (booking_id, memberId, coachId) => {
        const res = await apiFetch('/api/attendance/checkin', {
            method: 'POST',
            body: JSON.stringify({ booking_id, member_id: memberId || undefined, coach_id: coachId || undefined }),
        });
        if (res.ok) {
            setAddAttendeeFor(null);
            setAddAttendeeValue('');
            fetchAttendance();
        } else {
            const err = await res.json();
            flash(setError, err.message || 'Failed to check in.');
        }
    };

    const handleAddAttendee = (booking_id) => {
        if (!addAttendeeValue) return;
        const [kind, id] = addAttendeeValue.split(':');
        handleCheckIn(booking_id, kind === 'member' ? id : null, kind === 'coach' ? id : null);
    };

    const handleCheckOut = async (attendance_id) => {
        const res = await apiFetch(`/api/attendance/${attendance_id}/checkout`, { method: 'PATCH' });
        if (res.ok) {
            fetchAttendance();
        } else {
            const err = await res.json();
            flash(setError, err.message || 'Failed to check out.');
        }
    };

    const handleNoShow = async (booking_id) => {
        const res = await apiFetch(`/api/attendance/${booking_id}/no-show`, { method: 'POST' });
        const body = await res.json();
        if (res.ok) {
            flash(setSuccess, body.message || 'Marked as a no-show.');
            fetchAttendance();
        } else {
            flash(setError, body.message || 'Failed to mark as a no-show.');
        }
    };

    return (
        <div className="p-6 space-y-6">
            {success && (
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold px-4 py-3 rounded-xl">
                    <CheckCircle2 size={16} /> {success}
                </div>
            )}
            {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-700 text-xs font-bold px-4 py-3 rounded-xl">
                    {error}
                </div>
            )}

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-50/50">
                    <div>
                        <h2 className="text-slate-900 text-xs font-black uppercase tracking-[0.3em]">Daily Attendance</h2>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Mark check-in / check-out for booked sessions</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <CalendarDays size={16} className="text-slate-400" />
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-slate-400 text-[9px] uppercase tracking-widest bg-slate-50/50">
                                <th className="p-4 font-black">Court / Time</th>
                                <th className="p-4 font-black">Booked By</th>
                                <th className="p-4 font-black">Attendees</th>
                                <th className="p-4 font-black text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {rows.map((r) => (
                                <tr key={r.booking_id} className="hover:bg-slate-50 transition-colors align-top">
                                    <td className="p-4">
                                        <p className="text-slate-700 text-xs font-bold">{r.court_name}</p>
                                        <p className="text-slate-400 text-[10px]">{r.start_time?.slice(0, 5)} - {r.end_time?.slice(0, 5)}</p>
                                    </td>
                                    <td className="p-4">
                                        <p className="text-slate-900 text-sm font-bold">{r.booker_name || 'Unknown'}</p>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col gap-2">
                                            {r.attendees.map((a) => (
                                                <div key={a.attendance_id} className="flex items-center gap-2 text-[11px]">
                                                    <span className="font-bold text-slate-700">{a.attendee_name}</span>
                                                    <span className="flex items-center gap-1 text-slate-400">
                                                        <Clock size={10} /> {timeOf(a.checkin_time)} – {a.checkout_time ? timeOf(a.checkout_time) : '...'}
                                                    </span>
                                                    {!a.checkout_time && (
                                                        <button onClick={() => handleCheckOut(a.attendance_id)}
                                                            className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-red-50">
                                                            <LogOut size={10} /> Check Out
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                            {r.attendees.length === 0 && (
                                                <p className="text-slate-300 text-[10px] font-bold uppercase">No check-ins yet</p>
                                            )}

                                            {addAttendeeFor === r.booking_id ? (
                                                <div className="flex items-center gap-2 pt-1">
                                                    <select value={addAttendeeValue} onChange={(e) => setAddAttendeeValue(e.target.value)}
                                                        className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] outline-none">
                                                        <option value="">Select person...</option>
                                                        <optgroup label="Members">
                                                            {members.map((m) => (
                                                                <option key={`m-${m.member_id}`} value={`member:${m.member_id}`}>{m.full_name}</option>
                                                            ))}
                                                        </optgroup>
                                                        <optgroup label="Coaches">
                                                            {coaches.map((c) => (
                                                                <option key={`c-${c.coach_id}`} value={`coach:${c.coach_id}`}>{c.full_name}</option>
                                                            ))}
                                                        </optgroup>
                                                    </select>
                                                    <button onClick={() => handleAddAttendee(r.booking_id)}
                                                        className="text-[9px] font-black uppercase tracking-widest bg-slate-900 text-white px-2 py-1.5 rounded-lg hover:bg-slate-800">
                                                        Check In
                                                    </button>
                                                    <button onClick={() => { setAddAttendeeFor(null); setAddAttendeeValue(''); }}
                                                        className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">
                                                        Cancel
                                                    </button>
                                                </div>
                                            ) : (
                                                <button onClick={() => { setAddAttendeeFor(r.booking_id); setAddAttendeeValue(''); }}
                                                    className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-700 pt-1 w-fit">
                                                    <UserPlus size={11} /> Add Attendee
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4 text-right">
                                        {r.attendees.length === 0 && !r.no_show_charged && selectedDate <= todayISO() ? (
                                            <button onClick={() => handleNoShow(r.booking_id)}
                                                className="flex items-center gap-1 ml-auto text-[9px] font-black uppercase tracking-widest text-red-600 hover:text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-50 border border-red-100">
                                                <Ban size={11} /> Mark No-Show
                                            </button>
                                        ) : r.no_show_charged ? (
                                            <span className="text-[9px] font-black uppercase tracking-widest text-red-500 bg-red-50 border border-red-100 px-2 py-1 rounded-full">
                                                No-Show Charged
                                            </span>
                                        ) : null}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {!loading && rows.length === 0 && (
                        <div className="p-16 text-center">
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">No confirmed bookings on this date</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminAttendance;

import React, { useState, useEffect } from 'react';
import { CalendarDays, UserPlus, LogOut, Ban, CheckCircle2, Clock, Pencil, History, ShieldOff } from 'lucide-react';
import { apiFetch } from '../../utils/api';
import Modal from '../../components/common/Modal';
import SearchInput from '../../components/common/SearchInput';
import FilterSelect from '../../components/common/FilterSelect';

const todayISO = () => new Date().toISOString().slice(0, 10);

const timeOf = (ts) => ts ? ts.slice(11, 16) : '';
const dateOf = (ts) => ts ? ts.slice(0, 10) : '';

// "YYYY-MM-DDTHH:MM" for <input type="datetime-local"> — matches the raw
// wall-clock string the API returns (dateStrings:true in config/db.js means
// no timezone shifting happens either direction).
const nowLocalInputValue = () => {
    const d = new Date();
    const tzOffsetMs = d.getTimezoneOffset() * 60000;
    return new Date(d - tzOffsetMs).toISOString().slice(0, 16);
};
const toLocalInputValue = (ts) => (ts ? ts.replace(' ', 'T').slice(0, 16) : '');

const TYPE_OPTIONS = [
    { value: '', label: 'All Types' },
    { value: 'member', label: 'Members' },
    { value: 'coach', label: 'Coaches' },
];

const AdminAttendance = () => {
    const [selectedDate, setSelectedDate] = useState(todayISO());
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [members, setMembers] = useState([]);
    const [coaches, setCoaches] = useState([]);
    const [addAttendeeFor, setAddAttendeeFor] = useState(null);
    const [addAttendeeValue, setAddAttendeeValue] = useState('');
    const [addAttendeeTime, setAddAttendeeTime] = useState('');
    const [editingAttendee, setEditingAttendee] = useState(null);
    const [editForm, setEditForm] = useState({ checkin_time: '', checkout_time: '' });
    const [noShowFor, setNoShowFor] = useState(null);
    const [waiveNoShow, setWaiveNoShow] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Attendance History — a flat, filterable/searchable view across every
    // check-in ever recorded, separate from the date-scoped table above.
    const [historyRows, setHistoryRows] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyFilters, setHistoryFilters] = useState({ from: '', to: '', search: '', type: '' });

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

    const fetchHistory = () => {
        setHistoryLoading(true);
        const params = new URLSearchParams();
        if (historyFilters.from) params.append('from', historyFilters.from);
        if (historyFilters.to) params.append('to', historyFilters.to);
        if (historyFilters.search) params.append('search', historyFilters.search);
        if (historyFilters.type) params.append('type', historyFilters.type);

        apiFetch(`/api/attendance/history?${params.toString()}`)
            .then((res) => res.json())
            .then((data) => setHistoryRows(data.data || []))
            .finally(() => setHistoryLoading(false));
    };

    useEffect(() => { fetchHistory(); }, [historyFilters]);

    const flash = (setter, text) => {
        setter(text);
        setTimeout(() => setter(''), 4000);
    };

    const handleCheckIn = async (booking_id, memberId, coachId) => {
        const res = await apiFetch('/api/attendance/checkin', {
            method: 'POST',
            body: JSON.stringify({
                booking_id,
                member_id: memberId || undefined,
                coach_id: coachId || undefined,
                checkin_time: addAttendeeTime || undefined,
            }),
        });
        if (res.ok) {
            setAddAttendeeFor(null);
            setAddAttendeeValue('');
            setAddAttendeeTime('');
            fetchAttendance();
        } else {
            const err = await res.json();
            flash(setError, err.message || 'Failed to check in.');
        }
    };

    const handleOpenAddAttendee = (booking_id) => {
        setAddAttendeeFor(booking_id);
        setAddAttendeeValue('');
        setAddAttendeeTime(nowLocalInputValue());
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

    const handleOpenEdit = (attendee) => {
        setEditingAttendee(attendee);
        setEditForm({
            checkin_time: toLocalInputValue(attendee.checkin_time),
            checkout_time: toLocalInputValue(attendee.checkout_time),
        });
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        const res = await apiFetch(`/api/attendance/${editingAttendee.attendance_id}`, {
            method: 'PATCH',
            body: JSON.stringify({
                checkin_time: editForm.checkin_time,
                // Explicit null (not undefined) when the field's left blank —
                // that's how the admin un-does an accidental check-out.
                checkout_time: editForm.checkout_time || null,
            }),
        });
        if (res.ok) {
            setEditingAttendee(null);
            fetchAttendance();
            fetchHistory();
        } else {
            const err = await res.json();
            flash(setError, err.message || 'Failed to update attendance.');
        }
    };

    const handleOpenNoShow = (booking_id) => {
        setNoShowFor(booking_id);
        setWaiveNoShow(false);
    };

    const handleNoShowSubmit = async (e) => {
        e.preventDefault();
        const res = await apiFetch(`/api/attendance/${noShowFor}/no-show`, {
            method: 'POST',
            body: JSON.stringify({ waive: waiveNoShow }),
        });
        const body = await res.json();
        if (res.ok) {
            setNoShowFor(null);
            flash(setSuccess, body.message || 'Marked as a no-show.');
            fetchAttendance();
        } else {
            flash(setError, body.message || 'Failed to mark as a no-show.');
        }
    };

    // Waives a fee that's already been charged (manually or by the
    // automatic sweep) — reuses the same payments status-update endpoint
    // the Payments page's own "Waive Fee" action uses.
    const handleWaiveCharged = async (payment_id) => {
        if (!window.confirm('Waive this no-show fee? The member/coach will no longer owe this amount.')) return;
        const res = await apiFetch(`/api/payments/update/${payment_id}`, {
            method: 'PATCH',
            body: JSON.stringify({ status: 'waived' }),
        });
        if (res.ok) {
            flash(setSuccess, 'No-show fee waived.');
            fetchAttendance();
        } else {
            const err = await res.json();
            flash(setError, err.message || 'Failed to waive fee.');
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
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Members &amp; coaches only — no-show fees are charged automatically</p>
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
                                        <p className="text-slate-400 text-[9px] font-bold uppercase">{r.booking_type}</p>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col gap-2">
                                            {r.attendees.map((a) => (
                                                <div key={a.attendance_id} className="flex items-center gap-2 text-[11px]">
                                                    <span className="font-bold text-slate-700">{a.attendee_name}</span>
                                                    <span className="flex items-center gap-1 text-slate-400">
                                                        <Clock size={10} /> {timeOf(a.checkin_time)} – {a.checkout_time ? timeOf(a.checkout_time) : '...'}
                                                    </span>
                                                    <button onClick={() => handleOpenEdit(a)}
                                                        title="Edit check-in/check-out time"
                                                        className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 px-2 py-1 rounded-lg hover:bg-blue-50">
                                                        <Pencil size={10} />
                                                    </button>
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
                                                <div className="flex flex-wrap items-center gap-2 pt-1">
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
                                                    <input
                                                        type="datetime-local"
                                                        value={addAttendeeTime}
                                                        max={nowLocalInputValue()}
                                                        onChange={(e) => setAddAttendeeTime(e.target.value)}
                                                        title="Check-in time"
                                                        className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] outline-none"
                                                    />
                                                    <button onClick={() => handleAddAttendee(r.booking_id)}
                                                        className="text-[9px] font-black uppercase tracking-widest bg-slate-900 text-white px-2 py-1.5 rounded-lg hover:bg-slate-800">
                                                        Check In
                                                    </button>
                                                    <button onClick={() => { setAddAttendeeFor(null); setAddAttendeeValue(''); setAddAttendeeTime(''); }}
                                                        className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">
                                                        Cancel
                                                    </button>
                                                </div>
                                            ) : (
                                                <button onClick={() => handleOpenAddAttendee(r.booking_id)}
                                                    className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-700 pt-1 w-fit">
                                                    <UserPlus size={11} /> Add Attendee
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4 text-right">
                                        {r.attendees.length === 0 && !r.no_show_payment_id && r.slot_has_passed ? (
                                            <button onClick={() => handleOpenNoShow(r.booking_id)}
                                                title="Charge now instead of waiting for the automatic sweep"
                                                className="flex items-center gap-1 ml-auto text-[9px] font-black uppercase tracking-widest text-red-600 hover:text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-50 border border-red-100">
                                                <Ban size={11} /> Mark No-Show
                                            </button>
                                        ) : r.no_show_payment_id && r.no_show_status !== 'waived' ? (
                                            <div className="flex flex-col items-end gap-1.5">
                                                <span className="text-[9px] font-black uppercase tracking-widest text-red-500 bg-red-50 border border-red-100 px-2 py-1 rounded-full">
                                                    No-Show — LKR {r.no_show_amount}
                                                </span>
                                                <button onClick={() => handleWaiveCharged(r.no_show_payment_id)}
                                                    className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-amber-600">
                                                    <ShieldOff size={10} /> Waive Fee
                                                </button>
                                            </div>
                                        ) : r.no_show_payment_id && r.no_show_status === 'waived' ? (
                                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 bg-slate-100 border border-slate-200 px-2 py-1 rounded-full">
                                                No-Show — Waived
                                            </span>
                                        ) : !r.slot_has_passed && r.attendees.length === 0 ? (
                                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">Slot in progress</span>
                                        ) : null}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {!loading && rows.length === 0 && (
                        <div className="p-16 text-center">
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">No confirmed member/coach bookings on this date</p>
                        </div>
                    )}
                </div>
            </div>

            {/* --- ATTENDANCE HISTORY --- */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-50/50">
                    <div className="flex items-center gap-2">
                        <History size={16} className="text-slate-400" />
                        <div>
                            <h2 className="text-slate-900 text-xs font-black uppercase tracking-[0.3em]">Attendance History</h2>
                            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Every check-in on record — filter or search to narrow it down</p>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3">
                        <div className="flex items-center gap-2">
                            <input type="date" value={historyFilters.from}
                                onChange={(e) => setHistoryFilters({ ...historyFilters, from: e.target.value })}
                                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none" />
                            <span className="text-slate-400 text-xs">to</span>
                            <input type="date" value={historyFilters.to}
                                onChange={(e) => setHistoryFilters({ ...historyFilters, to: e.target.value })}
                                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none" />
                        </div>
                        <FilterSelect value={historyFilters.type} onChange={(e) => setHistoryFilters({ ...historyFilters, type: e.target.value })} options={TYPE_OPTIONS} />
                        <SearchInput value={historyFilters.search} onChange={(e) => setHistoryFilters({ ...historyFilters, search: e.target.value })}
                            placeholder="Search by name..." className="w-full sm:w-56" />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-slate-400 text-[9px] uppercase tracking-widest bg-slate-50/50">
                                <th className="p-4 font-black">Name</th>
                                <th className="p-4 font-black">Type</th>
                                <th className="p-4 font-black">Date</th>
                                <th className="p-4 font-black">Court / Time</th>
                                <th className="p-4 font-black">Check-In</th>
                                <th className="p-4 font-black">Check-Out</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {historyRows.map((h) => (
                                <tr key={h.attendance_id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4 text-slate-900 text-sm font-bold">{h.attendee_name}</td>
                                    <td className="p-4">
                                        <span className="text-[9px] font-black uppercase px-2 py-1 rounded-md border bg-slate-50 text-slate-600 border-slate-100">
                                            {h.attendee_type}
                                        </span>
                                    </td>
                                    <td className="p-4 text-slate-600 text-[11px]">{dateOf(h.checkin_time) || h.booking_date}</td>
                                    <td className="p-4 text-slate-600 text-[11px]">
                                        {h.court_name ? `${h.court_name} · ${h.start_time?.slice(0, 5)}-${h.end_time?.slice(0, 5)}` : '—'}
                                    </td>
                                    <td className="p-4 text-slate-600 text-[11px] font-mono">{timeOf(h.checkin_time)}</td>
                                    <td className="p-4 text-slate-600 text-[11px] font-mono">{h.checkout_time ? timeOf(h.checkout_time) : '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {!historyLoading && historyRows.length === 0 && (
                        <div className="p-16 text-center">
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">No attendance records match these filters</p>
                        </div>
                    )}
                </div>
            </div>

            <Modal
                isOpen={!!editingAttendee}
                onClose={() => setEditingAttendee(null)}
                title={`Edit Attendance — ${editingAttendee?.attendee_name || ''}`}
                submitText="Save Changes"
                onSubmit={handleEditSubmit}
            >
                <div className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Check-In Time</label>
                        <input
                            type="datetime-local"
                            required
                            max={nowLocalInputValue()}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                            value={editForm.checkin_time}
                            onChange={(e) => setEditForm({ ...editForm, checkin_time: e.target.value })}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Check-Out Time (leave blank if still checked in)</label>
                        <input
                            type="datetime-local"
                            max={nowLocalInputValue()}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                            value={editForm.checkout_time}
                            onChange={(e) => setEditForm({ ...editForm, checkout_time: e.target.value })}
                        />
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={!!noShowFor}
                onClose={() => setNoShowFor(null)}
                title="Mark as No-Show"
                submitText={waiveNoShow ? 'Confirm — No Fee' : 'Confirm — Charge Fee'}
                onSubmit={handleNoShowSubmit}
            >
                <div className="space-y-4">
                    <p className="text-slate-500 text-xs leading-relaxed">
                        This booking has no check-in recorded and its time slot has ended. Choose whether to charge the
                        club's configured no-show fee, or waive it (e.g. for an excused absence).
                    </p>
                    <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                        <input type="checkbox" checked={waiveNoShow} onChange={(e) => setWaiveNoShow(e.target.checked)}
                            className="w-4 h-4 accent-slate-900" />
                        <span className="text-slate-700 text-xs font-bold">Waive the fee — don&apos;t charge this person</span>
                    </label>
                </div>
            </Modal>
        </div>
    );
};

export default AdminAttendance;

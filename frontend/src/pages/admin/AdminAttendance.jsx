import React, { useState, useEffect, useMemo } from 'react';
import { CalendarDays, UserPlus, LogOut, Ban, CheckCircle2, Clock, Pencil, History, ShieldOff, ChevronLeft, ChevronRight, Check, RotateCcw, AlertTriangle } from 'lucide-react';
import { apiFetch } from '../../utils/api';
import Modal from '../../components/common/Modal';
import SearchInput from '../../components/common/SearchInput';
import FilterSelect from '../../components/common/FilterSelect';
import { todayISO } from '../../utils/date';

const ATTENDEE_PAGE_SIZE = 8;

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
    const [duesByMember, setDuesByMember] = useState({});
    const [duesByCoach, setDuesByCoach] = useState({});
    const [collectDuesFor, setCollectDuesFor] = useState(null);
    const [addAttendeeFor, setAddAttendeeFor] = useState(null);
    const [addAttendeeTime, setAddAttendeeTime] = useState('');
    const [addAttendeeSearch, setAddAttendeeSearch] = useState('');
    const [addAttendeeTypeFilter, setAddAttendeeTypeFilter] = useState('');
    const [addAttendeePage, setAddAttendeePage] = useState(1);
    const [addAttendeeSelected, setAddAttendeeSelected] = useState(null);
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

    // Outstanding arrears for every member/coach, so a check-in can flag
    // (and settle) unpaid fees without leaving the Attendance screen.
    const fetchDues = () => {
        apiFetch('/api/payments/outstanding')
            .then((res) => {
                if (!res.ok) throw new Error('Failed to load outstanding dues.');
                return res.json();
            })
            .then((data) => {
                setDuesByMember(data.members || {});
                setDuesByCoach(data.coaches || {});
            })
            .catch((err) => flash(setError, err.message));
    };

    useEffect(() => {
        apiFetch('/api/members')
            .then((res) => {
                if (!res.ok) throw new Error('Failed to load members.');
                return res.json();
            })
            .then((data) => setMembers(data.data || []))
            .catch((err) => flash(setError, err.message));
        apiFetch('/api/coaches')
            .then((res) => {
                if (!res.ok) throw new Error('Failed to load coaches.');
                return res.json();
            })
            .then((data) => setCoaches(data.data || []))
            .catch((err) => flash(setError, err.message));
        fetchDues();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const duesFor = (kind, id) => {
        const items = (kind === 'member' ? duesByMember : duesByCoach)[id] || [];
        const total = items.reduce((sum, p) => sum + Number(p.amount), 0);
        return { items, total };
    };

    // Reuses the same status-update endpoint the Payments page's own "Mark as
    // Paid" action uses — collecting a due here is just settling that same
    // 'recorded' payment row on the spot.
    const handleCollectDue = async (payment_id) => {
        const res = await apiFetch(`/api/payments/update/${payment_id}`, {
            method: 'PATCH',
            body: JSON.stringify({ status: 'completed' }),
        });
        if (res.ok) {
            flash(setSuccess, 'Payment collected.');
            fetchDues();
        } else {
            const err = await res.json();
            flash(setError, err.message || 'Failed to record payment.');
        }
    };

    const fetchAttendance = () => {
        setLoading(true);
        apiFetch(`/api/attendance?date=${selectedDate}`)
            .then((res) => {
                if (!res.ok) throw new Error('Failed to load attendance for this date.');
                return res.json();
            })
            .then((data) => setRows(data.data || []))
            .catch((err) => flash(setError, err.message))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchAttendance(); }, [selectedDate]);

    const fetchHistory = () => {
        setHistoryLoading(true);
        const params = new URLSearchParams();
        if (historyFilters.from) params.append('from', historyFilters.from);
        if (historyFilters.to) params.append('to', historyFilters.to);
        if (historyFilters.search) params.append('search', historyFilters.search);
        if (historyFilters.type) params.append('type', historyFilters.type);

        apiFetch(`/api/attendance/history?${params.toString()}`)
            .then((res) => {
                if (!res.ok) throw new Error('Failed to load attendance history.');
                return res.json();
            })
            .then((data) => setHistoryRows(data.data || []))
            .catch((err) => flash(setError, err.message))
            .finally(() => setHistoryLoading(false));
    };

    useEffect(() => { fetchHistory(); }, [historyFilters]);

    // Combined, searchable pool for the Add Attendee picker — the plain
    // <select> this replaced became unusable once the member/coach lists
    // grew past a couple dozen names, so this is search + pagination over
    // the same two lists instead of one giant dropdown.
    const attendeePool = useMemo(() => [
        ...members.map((m) => ({ kind: 'member', id: m.member_id, name: m.full_name })),
        ...coaches.map((c) => ({ kind: 'coach', id: c.coach_id, name: c.full_name })),
    ], [members, coaches]);

    const filteredAttendeePool = useMemo(() => {
        const q = addAttendeeSearch.trim().toLowerCase();
        return attendeePool.filter((p) =>
            (!addAttendeeTypeFilter || p.kind === addAttendeeTypeFilter) &&
            (!q || p.name.toLowerCase().includes(q))
        );
    }, [attendeePool, addAttendeeSearch, addAttendeeTypeFilter]);

    const attendeePageCount = Math.max(1, Math.ceil(filteredAttendeePool.length / ATTENDEE_PAGE_SIZE));
    // Search/filter can narrow the results while a later page is still
    // selected — clamp so that doesn't render an out-of-range empty slice.
    const attendeeCurrentPage = Math.min(addAttendeePage, attendeePageCount);
    const pagedAttendeePool = filteredAttendeePool.slice(
        (attendeeCurrentPage - 1) * ATTENDEE_PAGE_SIZE,
        attendeeCurrentPage * ATTENDEE_PAGE_SIZE
    );

    const flash = (setter, text) => {
        setter(text);
        setTimeout(() => setter(''), 4000);
    };

    const handleOpenAddAttendee = (booking_id) => {
        setAddAttendeeFor(booking_id);
        setAddAttendeeTime(nowLocalInputValue());
        setAddAttendeeSearch('');
        setAddAttendeeTypeFilter('');
        setAddAttendeePage(1);
        setAddAttendeeSelected(null);
    };

    const handleAddAttendeeSubmit = async (e) => {
        e.preventDefault();
        if (!addAttendeeSelected) {
            flash(setError, 'Select a member or coach to check in first.');
            return;
        }

        const res = await apiFetch('/api/attendance/checkin', {
            method: 'POST',
            body: JSON.stringify({
                booking_id: addAttendeeFor,
                member_id: addAttendeeSelected.kind === 'member' ? addAttendeeSelected.id : undefined,
                coach_id: addAttendeeSelected.kind === 'coach' ? addAttendeeSelected.id : undefined,
                checkin_time: addAttendeeTime || undefined,
            }),
        });
        if (res.ok) {
            const body = await res.json();
            setAddAttendeeFor(null);
            if (body.message?.includes('waived')) flash(setSuccess, body.message);
            fetchAttendance();
        } else {
            const err = await res.json();
            flash(setError, err.message || 'Failed to check in.');
        }
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

    // Undoes a check-in entirely — for when editing the time isn't enough
    // (e.g. the wrong person was selected). Lives in the same modal as the
    // time edit so there's one place to fix any mistake, not a maze of
    // buttons for each kind of correction.
    const handleDeleteAttendee = async () => {
        if (!window.confirm(`Remove ${editingAttendee.attendee_name}'s check-in? This can't be undone, but they can be checked in again.`)) return;

        const res = await apiFetch(`/api/attendance/${editingAttendee.attendance_id}`, { method: 'DELETE' });
        if (res.ok) {
            setEditingAttendee(null);
            flash(setSuccess, 'Check-in removed.');
            fetchAttendance();
            fetchHistory();
        } else {
            const err = await res.json();
            flash(setError, err.message || 'Failed to remove attendance record.');
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

    // Moves a no-show fee between charged ('recorded') and waived, in
    // either direction — reuses the same payments status-update endpoint
    // the Payments page's own "Waive Fee" action uses. A waiver isn't
    // final: an admin who waived one by mistake (or changes their mind)
    // can reinstate it exactly the same way.
    const handleNoShowStatusChange = async (payment_id, status, confirmMessage) => {
        if (!window.confirm(confirmMessage)) return;
        const res = await apiFetch(`/api/payments/update/${payment_id}`, {
            method: 'PATCH',
            body: JSON.stringify({ status }),
        });
        if (res.ok) {
            flash(setSuccess, status === 'waived' ? 'No-show fee waived.' : 'No-show fee reinstated.');
            fetchAttendance();
        } else {
            const err = await res.json();
            flash(setError, err.message || 'Failed to update fee status.');
        }
    };

    const handleWaiveCharged = (payment_id) =>
        handleNoShowStatusChange(payment_id, 'waived', 'Waive this no-show fee? The member/coach will no longer owe this amount.');

    const handleUndoWaive = (payment_id) =>
        handleNoShowStatusChange(payment_id, 'recorded', 'Undo this waiver? The no-show fee will be marked as owed again.');

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
                                            {r.attendees.map((a) => {
                                                const kind = a.member_id ? 'member' : 'coach';
                                                const id = a.member_id || a.coach_id;
                                                const dues = duesFor(kind, id);
                                                return (
                                                    <div key={a.attendance_id} className="flex items-center gap-2 text-[11px] flex-wrap">
                                                        <span className="font-bold text-slate-700">{a.attendee_name}</span>
                                                        <span className="flex items-center gap-1 text-slate-400">
                                                            <Clock size={10} /> {timeOf(a.checkin_time)} – {a.checkout_time ? timeOf(a.checkout_time) : '...'}
                                                        </span>
                                                        {dues.total > 0 && (
                                                            <button type="button" onClick={() => setCollectDuesFor({ kind, id, name: a.attendee_name })}
                                                                title="Outstanding balance — click to collect"
                                                                className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full hover:bg-red-100">
                                                                LKR {dues.total} Due
                                                            </button>
                                                        )}
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
                                                );
                                            })}
                                            {r.attendees.length === 0 && (
                                                <p className="text-slate-300 text-[10px] font-bold uppercase">No check-ins yet</p>
                                            )}

                                            <button onClick={() => handleOpenAddAttendee(r.booking_id)}
                                                className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-700 pt-1 w-fit">
                                                <UserPlus size={11} /> Add Attendee
                                            </button>
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
                                            <div className="flex flex-col items-end gap-1.5">
                                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 bg-slate-100 border border-slate-200 px-2 py-1 rounded-full">
                                                    No-Show — Waived
                                                </span>
                                                <button onClick={() => handleUndoWaive(r.no_show_payment_id)}
                                                    className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-red-600">
                                                    <RotateCcw size={10} /> Undo Waive
                                                </button>
                                            </div>
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
                                <th className="p-4 font-black text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {historyRows.map((h) => (
                                <tr key={h.attendance_id} className="hover:bg-slate-50 transition-colors group">
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
                                    <td className="p-4 text-right">
                                        <button onClick={() => handleOpenEdit(h)}
                                            title="Edit check-in/check-out time"
                                            className="ml-auto flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 px-2 py-1 rounded-lg hover:bg-blue-50 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Pencil size={11} /> Edit
                                        </button>
                                    </td>
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
                isOpen={!!addAttendeeFor}
                onClose={() => setAddAttendeeFor(null)}
                title="Add Attendee"
                submitText="Check In"
                onSubmit={handleAddAttendeeSubmit}
            >
                <div className="space-y-4">
                    <div className="flex gap-2">
                        <SearchInput
                            value={addAttendeeSearch}
                            onChange={(e) => { setAddAttendeeSearch(e.target.value); setAddAttendeePage(1); }}
                            placeholder="Search by name..."
                            className="flex-1"
                        />
                        <FilterSelect
                            value={addAttendeeTypeFilter}
                            onChange={(e) => { setAddAttendeeTypeFilter(e.target.value); setAddAttendeePage(1); }}
                            options={TYPE_OPTIONS}
                        />
                    </div>

                    <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-64 overflow-y-auto">
                        {pagedAttendeePool.map((p) => {
                            const isSelected = addAttendeeSelected?.kind === p.kind && addAttendeeSelected?.id === p.id;
                            const dues = duesFor(p.kind, p.id);
                            return (
                                <button
                                    type="button"
                                    key={`${p.kind}-${p.id}`}
                                    onClick={() => setAddAttendeeSelected(p)}
                                    className={`w-full flex items-center justify-between px-4 py-2.5 text-left text-sm transition-colors ${
                                        isSelected ? 'bg-slate-900 text-white' : 'hover:bg-slate-50 text-slate-700'
                                    }`}
                                >
                                    <span className="flex items-center gap-2 font-bold">
                                        {isSelected && <Check size={12} />}
                                        {p.name}
                                    </span>
                                    <span className="flex items-center gap-2">
                                        {dues.total > 0 && (
                                            <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full border ${
                                                isSelected ? 'bg-white/20 text-white border-white/30' : 'text-red-600 bg-red-50 border-red-100'
                                            }`}>
                                                LKR {dues.total} Due
                                            </span>
                                        )}
                                        <span className={`text-[9px] font-black uppercase tracking-widest ${isSelected ? 'text-white/60' : 'text-slate-400'}`}>
                                            {p.kind}
                                        </span>
                                    </span>
                                </button>
                            );
                        })}
                        {pagedAttendeePool.length === 0 && (
                            <p className="px-4 py-6 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">No matches</p>
                        )}
                    </div>

                    {filteredAttendeePool.length > ATTENDEE_PAGE_SIZE && (
                        <div className="flex items-center justify-between">
                            <button type="button" disabled={attendeeCurrentPage === 1} onClick={() => setAddAttendeePage((p) => p - 1)}
                                className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-slate-500 disabled:opacity-30 px-3 py-1.5 rounded-lg hover:bg-slate-100">
                                <ChevronLeft size={12} /> Prev
                            </button>
                            <span className="text-[10px] text-slate-400 font-bold">
                                Page {attendeeCurrentPage} of {attendeePageCount} · {filteredAttendeePool.length} match{filteredAttendeePool.length === 1 ? '' : 'es'}
                            </span>
                            <button type="button" disabled={attendeeCurrentPage === attendeePageCount} onClick={() => setAddAttendeePage((p) => p + 1)}
                                className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-slate-500 disabled:opacity-30 px-3 py-1.5 rounded-lg hover:bg-slate-100">
                                Next <ChevronRight size={12} />
                            </button>
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Check-In Time</label>
                        <input
                            type="datetime-local"
                            value={addAttendeeTime}
                            max={nowLocalInputValue()}
                            onChange={(e) => setAddAttendeeTime(e.target.value)}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                        />
                    </div>

                    {addAttendeeSelected && (() => {
                        const dues = duesFor(addAttendeeSelected.kind, addAttendeeSelected.id);
                        return (
                            <div className="space-y-2">
                                <p className="text-[11px] text-slate-500">
                                    Checking in <span className="font-bold text-slate-700">{addAttendeeSelected.name}</span> ({addAttendeeSelected.kind})
                                </p>
                                {dues.total > 0 && (
                                    <button type="button"
                                        onClick={() => setCollectDuesFor(addAttendeeSelected)}
                                        className="w-full flex items-center justify-between gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 text-left hover:bg-amber-100 transition-colors">
                                        <span className="flex items-center gap-1.5 text-[10px] font-black uppercase text-amber-700">
                                            <AlertTriangle size={12} /> Owes LKR {dues.total} — tap to collect
                                        </span>
                                        <span className="text-[9px] font-black uppercase text-amber-500">
                                            {dues.items.length} item{dues.items.length === 1 ? '' : 's'}
                                        </span>
                                    </button>
                                )}
                            </div>
                        );
                    })()}
                </div>
            </Modal>

            <Modal
                isOpen={!!collectDuesFor}
                onClose={() => setCollectDuesFor(null)}
                title={`Outstanding Balance — ${collectDuesFor?.name || ''}`}
                submitText="Close"
                onSubmit={(e) => { e.preventDefault(); setCollectDuesFor(null); }}
            >
                {(() => {
                    const dues = collectDuesFor ? duesFor(collectDuesFor.kind, collectDuesFor.id) : { items: [], total: 0 };
                    return (
                        <div className="space-y-3">
                            {dues.items.length === 0 ? (
                                <p className="text-slate-400 text-xs text-center py-4">No outstanding balance.</p>
                            ) : (
                                <>
                                    <p className="text-[11px] text-slate-500">
                                        Total due: <span className="font-black text-red-600">LKR {dues.total}</span>
                                    </p>
                                    <div className="space-y-1.5">
                                        {dues.items.map((due) => (
                                            <div key={due.payment_id} className="flex items-center justify-between gap-2 text-[11px] bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                                                <span className="text-slate-700">
                                                    <span className="font-bold capitalize">{due.payment_type.replace(/_/g, ' ')}</span>
                                                    <span className="text-slate-400"> · LKR {due.amount} · {dateOf(due.payment_date)}</span>
                                                </span>
                                                <button type="button" onClick={() => handleCollectDue(due.payment_id)}
                                                    className="shrink-0 text-[9px] font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-700 px-2 py-1 rounded-lg hover:bg-emerald-50 border border-emerald-100">
                                                    Mark Paid
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    );
                })()}
            </Modal>

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

                    <div className="pt-2 border-t border-slate-100">
                        <button type="button" onClick={handleDeleteAttendee}
                            className="w-full text-center text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-700 py-2">
                            Wrong person? Remove this check-in
                        </button>
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

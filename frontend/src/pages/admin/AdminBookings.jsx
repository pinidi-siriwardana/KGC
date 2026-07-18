import React, { useState, useEffect, useMemo } from 'react';
import { CalendarDays, Filter, Lock, Unlock, XCircle, Ban, CheckCircle2, Pencil, AlertTriangle, RotateCcw, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { apiFetch } from '../../utils/api';
import { slotKey } from '../../utils/bookingKey';
import { todayISO } from '../../utils/date';
import { useCourtsAndSlots } from '../../hooks/useCourtsAndSlots';
import CourtSlotGrid from '../../components/booking/CourtSlotGrid';
import Modal from '../../components/common/Modal';

const emptyCreateForm = () => ({
    booking_type: 'member',
    member_id: '', coach_id: '',
    guest_mode: 'existing', guest_id: '', guest_full_name: '', guest_phone: '', guest_email: '',
    amount_charged: '', note: '',
});

const STATUS_STYLE = {
    confirmed: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    cancelled: 'text-slate-500 bg-slate-50 border-slate-200',
    rejected: 'text-red-600 bg-red-50 border-red-100',
    pending: 'text-amber-600 bg-amber-50 border-amber-100',
};

const AdminBookings = () => {
    const [selectedDate, setSelectedDate] = useState(todayISO());
    const { courts, slots, error: gridError, retry: retryGrid } = useCourtsAndSlots();
    const [stateMap, setStateMap] = useState({});
    const [members, setMembers] = useState([]);
    const [coaches, setCoaches] = useState([]);
    const [guests, setGuests] = useState([]);

    const [pending, setPending] = useState(null);
    const [createForm, setCreateForm] = useState(emptyCreateForm);
    const [createError, setCreateError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState('');

    const [bookings, setBookings] = useState([]);
    const [filters, setFilters] = useState({ date: '', status: '', court_id: '' });
    const [loadingBookings, setLoadingBookings] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 10;

    const [cancellationFee, setCancellationFee] = useState(null);
    const [guestBookingFee, setGuestBookingFee] = useState(null);
    const [editingFee, setEditingFee] = useState(false);
    const [feeInput, setFeeInput] = useState('');
    const [savingFee, setSavingFee] = useState(false);

    const [editingBooking, setEditingBooking] = useState(null);
    const [editAmount, setEditAmount] = useState('');
    const [editError, setEditError] = useState('');
    const [savingEdit, setSavingEdit] = useState(false);

    useEffect(() => {
        apiFetch('/api/members').then((res) => res.json()).then((data) => setMembers(data.data || []));
        apiFetch('/api/coaches').then((res) => res.json()).then((data) => setCoaches(data.data || []));
        apiFetch('/api/guests').then((res) => res.json()).then((data) => setGuests(Array.isArray(data) ? data : []));
        apiFetch('/api/settings').then((res) => res.json()).then((data) => {
            setCancellationFee(data.data?.cancellation_fee ?? null);
            setGuestBookingFee(data.data?.guest_booking_fee ?? null);
        });
    }, []);

    const handleEditFee = () => {
        setFeeInput(cancellationFee ?? '');
        setEditingFee(true);
    };

    const handleSaveFee = async () => {
        setSavingFee(true);
        const res = await apiFetch('/api/settings', {
            method: 'PATCH',
            body: JSON.stringify({ cancellation_fee: feeInput }),
        });
        setSavingFee(false);
        if (res.ok) {
            setCancellationFee(feeInput);
            setEditingFee(false);
        } else {
            const err = await res.json();
            alert(err.message || 'Failed to update cancellation fee.');
        }
    };

    const buildStateMap = (rows) => {
        const map = {};
        rows.forEach((r) => { map[slotKey(r.court_id, r.slot_id)] = r.state; });
        return map;
    };

    const refreshAvailability = () => {
        apiFetch(`/api/bookings/availability?date=${selectedDate}`)
            .then((res) => res.json())
            .then((data) => setStateMap(buildStateMap(data.data || [])));
    };

    useEffect(() => {
        apiFetch(`/api/bookings/availability?date=${selectedDate}`)
            .then((res) => res.json())
            .then((data) => setStateMap(buildStateMap(data.data || [])));
    }, [selectedDate]);

    const fetchBookings = () => {
        const params = new URLSearchParams();
        if (filters.date) params.append('date', filters.date);
        if (filters.status) params.append('status', filters.status);
        if (filters.court_id) params.append('court_id', filters.court_id);

        apiFetch(`/api/bookings?${params.toString()}`)
            .then((res) => res.json())
            .then((data) => setBookings(data.data || []))
            .finally(() => setLoadingBookings(false));
    };

    useEffect(() => {
        const params = new URLSearchParams();
        if (filters.date) params.append('date', filters.date);
        if (filters.status) params.append('status', filters.status);
        if (filters.court_id) params.append('court_id', filters.court_id);

        apiFetch(`/api/bookings?${params.toString()}`)
            .then((res) => res.json())
            .then((data) => setBookings(data.data || []))
            .finally(() => setLoadingBookings(false));
    }, [filters]);

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
        setPage(1);
    };

    const handleSearchChange = (e) => {
        setSearch(e.target.value);
        setPage(1);
    };

    // Filters above are server-side (need a re-fetch); search is a plain
    // client-side text match over whatever page of results that returned —
    // cheap since the filtered set is already in memory.
    const searchedBookings = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return bookings;
        return bookings.filter((b) => [b.payer_name, b.court_name, b.booking_type, b.status]
            .some((field) => field?.toLowerCase().includes(q)));
    }, [bookings, search]);

    const totalPages = Math.max(1, Math.ceil(searchedBookings.length / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    const paginatedBookings = searchedBookings.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    const handleSelectSlot = (court, slot) => {
        setCreateError('');
        setCreateForm(emptyCreateForm());
        setPending({ court, slot });
    };

    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setCreateError('');

        const payload = {
            court_id: pending.court.court_id,
            slot_id: pending.slot.slot_id,
            booking_date: selectedDate,
            booking_type: createForm.booking_type,
        };

        if (createForm.booking_type === 'member') {
            payload.member_id = createForm.member_id;
        } else if (createForm.booking_type === 'coach') {
            payload.coach_id = createForm.coach_id;
        } else {
            payload.amount_charged = createForm.amount_charged || 0;
            payload.note = createForm.note || null;
            if (createForm.guest_mode === 'existing') {
                payload.guest_id = createForm.guest_id;
            } else {
                payload.guest_full_name = createForm.guest_full_name;
                payload.guest_phone = createForm.guest_phone;
                payload.guest_email = createForm.guest_email;
            }
        }

        const res = await apiFetch('/api/bookings', { method: 'POST', body: JSON.stringify(payload) });
        setSubmitting(false);

        if (res.ok) {
            setPending(null);
            setSuccess('Booking confirmed.');
            refreshAvailability();
            fetchBookings();
            setTimeout(() => setSuccess(''), 4000);
        } else {
            const err = await res.json();
            if (res.status === 409) refreshAvailability();
            setCreateError(err.message || 'Failed to create booking.');
        }
    };

    const handleAction = async (booking, action) => {
        const res = await apiFetch(`/api/bookings/${booking.booking_id}`, {
            method: 'PATCH',
            body: JSON.stringify({ action }),
        });
        if (res.ok) {
            const data = await res.json();
            if (action === 'restore' && data.message) {
                setSuccess(data.message);
                setTimeout(() => setSuccess(''), 4000);
            }
            fetchBookings();
            refreshAvailability();
        } else {
            const err = await res.json();
            alert(err.message || 'Failed to update booking.');
        }
    };

    const handleOpenEdit = (booking) => {
        setEditError('');
        setEditAmount(booking.amount_charged ?? '');
        setEditingBooking(booking);
    };

    const handleSaveEdit = async (e) => {
        e.preventDefault();
        setSavingEdit(true);
        setEditError('');

        const res = await apiFetch(`/api/bookings/${editingBooking.booking_id}/details`, {
            method: 'PATCH',
            body: JSON.stringify({ amount_charged: editAmount }),
        });
        setSavingEdit(false);

        if (res.ok) {
            setEditingBooking(null);
            setSuccess('Booking updated.');
            setTimeout(() => setSuccess(''), 4000);
            fetchBookings();
        } else {
            const err = await res.json();
            setEditError(err.message || 'Failed to update booking.');
        }
    };

    return (
        <div className="p-6 space-y-6">
            {success && (
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold px-4 py-3 rounded-xl">
                    <CheckCircle2 size={16} /> {success}
                </div>
            )}

            <div className="flex items-center justify-between bg-amber-50 border border-amber-100 rounded-2xl px-6 py-4">
                <div className="flex items-center gap-3">
                    <AlertTriangle size={16} className="text-amber-600" />
                    <div>
                        <p className="text-amber-800 text-xs font-black uppercase tracking-widest">Cancellation Fee</p>
                        <p className="text-amber-600 text-[10px] font-bold uppercase">Charged when a member/coach self-cancels a booking</p>
                    </div>
                </div>
                {editingFee ? (
                    <div className="flex items-center gap-2">
                        <span className="text-amber-700 text-xs font-bold">LKR</span>
                        <input
                            type="number" step="0.01" min="0" autoFocus
                            value={feeInput}
                            onChange={(e) => setFeeInput(e.target.value)}
                            className="w-28 px-3 py-1.5 bg-white border border-amber-200 rounded-lg text-sm outline-none"
                        />
                        <button onClick={handleSaveFee} disabled={savingFee}
                            className="text-[9px] font-black uppercase tracking-widest bg-amber-600 text-white px-3 py-1.5 rounded-lg hover:bg-amber-700 transition-all disabled:opacity-50">
                            {savingFee ? 'Saving...' : 'Save'}
                        </button>
                        <button onClick={() => setEditingFee(false)}
                            className="text-[9px] font-black uppercase tracking-widest text-amber-600 px-2 py-1.5">
                            Cancel
                        </button>
                    </div>
                ) : (
                    <button onClick={handleEditFee} className="flex items-center gap-2 text-amber-800 hover:text-amber-900 transition-colors">
                        <span className="text-lg font-bold font-mono">LKR {cancellationFee ?? '...'}</span>
                        <Pencil size={14} />
                    </button>
                )}
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-slate-900 text-xs font-black uppercase tracking-[0.3em]">Court Schedule</h2>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Click an open slot to book</p>
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

                {gridError ? (
                    <div className="flex flex-col items-center gap-3 py-10 text-center">
                        <p className="text-red-600 text-sm font-medium">{gridError}</p>
                        <button
                            type="button" onClick={retryGrid}
                            className="text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:underline"
                        >
                            Try again
                        </button>
                    </div>
                ) : (
                    <CourtSlotGrid
                        courts={courts}
                        slots={slots}
                        stateMap={stateMap}
                        onSelectSlot={handleSelectSlot}
                        selectedKey={pending ? slotKey(pending.court.court_id, pending.slot.slot_id) : null}
                        selectedDate={selectedDate}
                    />
                )}
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-50/50">
                    <div>
                        <h2 className="text-slate-900 text-xs font-black uppercase tracking-[0.3em]">All Bookings</h2>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Live Bookings &amp; Master Schedule</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <input
                                type="text"
                                value={search}
                                onChange={handleSearchChange}
                                placeholder="Search payer, court, type..."
                                className="pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none w-full sm:w-52"
                            />
                        </div>
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <select name="status" value={filters.status} onChange={handleFilterChange}
                                className="pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-wide outline-none appearance-none cursor-pointer">
                                <option value="">All Statuses</option>
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="cancelled">Cancelled</option>
                                <option value="rejected">Rejected</option>
                            </select>
                        </div>
                        <select name="court_id" value={filters.court_id} onChange={handleFilterChange}
                            className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-wide outline-none appearance-none cursor-pointer">
                            <option value="">All Courts</option>
                            {courts.map((c) => (
                                <option key={c.court_id} value={c.court_id}>{c.court_name}</option>
                            ))}
                        </select>
                        <input type="date" name="date" value={filters.date} onChange={handleFilterChange}
                            className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none" />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-slate-400 text-[9px] uppercase tracking-widest bg-slate-50/50">
                                <th className="p-4 font-black">Payer</th>
                                <th className="p-4 font-black">Type</th>
                                <th className="p-4 font-black">Court / Time</th>
                                <th className="p-4 font-black">Date</th>
                                <th className="p-4 font-black">Amount</th>
                                <th className="p-4 font-black">Status</th>
                                <th className="p-4 font-black text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {paginatedBookings.map((b) => (
                                <tr key={b.booking_id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4">
                                        <p className="text-slate-900 text-sm font-bold">{b.payer_name || 'Unknown'}</p>
                                    </td>
                                    <td className="p-4">
                                        <span className="text-[9px] font-black uppercase px-2 py-1 rounded-md border bg-slate-50 text-slate-600 border-slate-100">
                                            {b.booking_type}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <p className="text-slate-700 text-xs font-bold">{b.court_name}</p>
                                        <p className="text-slate-400 text-[10px]">{b.start_time?.slice(0, 5)} - {b.end_time?.slice(0, 5)}</p>
                                    </td>
                                    <td className="p-4 text-[11px] text-slate-600 font-medium">{b.booking_date}</td>
                                    <td className="p-4 text-slate-900 text-sm font-bold font-mono">LKR {b.amount_charged}</td>
                                    <td className="p-4">
                                        <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-full border ${STATUS_STYLE[b.status] || STATUS_STYLE.pending}`}>
                                            {b.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-1">
                                            <button onClick={() => handleOpenEdit(b)} title="Edit amount charged"
                                                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg">
                                                <Pencil size={14} />
                                            </button>
                                            {['pending', 'confirmed'].includes(b.status) && (
                                                <>
                                                    <button onClick={() => handleAction(b, 'cancel')} title="Cancel"
                                                        className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg">
                                                        <Ban size={14} />
                                                    </button>
                                                    <button onClick={() => handleAction(b, 'reject')} title="Reject"
                                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                                                        <XCircle size={14} />
                                                    </button>
                                                </>
                                            )}
                                            {['cancelled', 'rejected'].includes(b.status) && (
                                                <button onClick={() => handleAction(b, 'restore')} title="Undo — restore this booking"
                                                    className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg">
                                                    <RotateCcw size={14} />
                                                </button>
                                            )}
                                            {b.lock_status === 'locked' ? (
                                                <button onClick={() => handleAction(b, 'unlock')} title="Unlock"
                                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                                                    <Lock size={14} />
                                                </button>
                                            ) : (
                                                <button onClick={() => handleAction(b, 'lock')} title="Lock"
                                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                                                    <Unlock size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {!loadingBookings && searchedBookings.length === 0 && (
                        <div className="p-16 text-center">
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">No bookings match these filters</p>
                        </div>
                    )}
                </div>

                {searchedBookings.length > 0 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                            Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, searchedBookings.length)} of {searchedBookings.length}
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft size={14} />
                            </button>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                type="button"
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <Modal
                isOpen={!!pending} onClose={() => setPending(null)}
                title="New Booking"
                submitText={submitting ? 'Booking...' : 'Confirm Booking'}
                onSubmit={handleCreateSubmit}
            >
                {pending && (
                    <div className="space-y-4">
                        <p className="text-slate-600 text-sm">
                            <span className="font-bold text-slate-900">{pending.court.court_name}</span> on{' '}
                            <span className="font-bold text-slate-900">{selectedDate}</span> at{' '}
                            <span className="font-bold text-slate-900">{pending.slot.start_time?.slice(0, 5)}–{pending.slot.end_time?.slice(0, 5)}</span>
                        </p>

                        <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-slate-400">Booking For</label>
                            <select className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                                value={createForm.booking_type} onChange={(e) => {
                                    const booking_type = e.target.value;
                                    const shouldPrefillFee = booking_type === 'guest' && !createForm.amount_charged && guestBookingFee != null;
                                    setCreateForm({
                                        ...createForm,
                                        booking_type,
                                        amount_charged: shouldPrefillFee ? guestBookingFee : createForm.amount_charged,
                                    });
                                }}>
                                <option value="member">Existing Member</option>
                                <option value="coach">Existing Coach</option>
                                <option value="guest">Guest</option>
                            </select>
                        </div>

                        {createForm.booking_type === 'member' && (
                            <div className="space-y-1">
                                <label className="text-[9px] font-black uppercase text-slate-400">Member</label>
                                <select className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                                    value={createForm.member_id} onChange={(e) => setCreateForm({ ...createForm, member_id: e.target.value })} required>
                                    <option value="" disabled>Select a member...</option>
                                    {members.map((m) => {
                                        // Same "proper membership" bar the backend enforces
                                        // (no plan at all, or the current one's expired) —
                                        // disabled here so the admin sees why before
                                        // submitting, instead of only after a 403.
                                        const ineligible = !m.membership_end_date || m.is_expired;
                                        return (
                                            <option key={m.member_id} value={m.member_id} disabled={ineligible}>
                                                {m.full_name} — {m.email}
                                                {ineligible ? (m.membership_end_date ? ' (Membership Expired)' : ' (No Membership)') : ''}
                                            </option>
                                        );
                                    })}
                                </select>
                                <p className="text-slate-400 text-[10px] pt-1">
                                    Members without an active membership are shown but can&apos;t be selected — they need a plan first.
                                </p>
                                <p className="text-amber-600 text-[10px] font-bold pt-1">
                                    Note: if this member self-cancels later, a LKR {cancellationFee ?? '...'} cancellation fee applies.
                                </p>
                            </div>
                        )}

                        {createForm.booking_type === 'coach' && (
                            <div className="space-y-1">
                                <label className="text-[9px] font-black uppercase text-slate-400">Coach</label>
                                <select className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                                    value={createForm.coach_id} onChange={(e) => setCreateForm({ ...createForm, coach_id: e.target.value })} required>
                                    <option value="" disabled>Select a coach...</option>
                                    {coaches.map((c) => (
                                        <option key={c.coach_id} value={c.coach_id}>{c.full_name} — {c.email}</option>
                                    ))}
                                </select>
                                <p className="text-amber-600 text-[10px] font-bold pt-1">
                                    Note: if this coach self-cancels later, a LKR {cancellationFee ?? '...'} cancellation fee applies.
                                </p>
                            </div>
                        )}

                        {createForm.booking_type === 'guest' && (
                            <div className="space-y-3">
                                <div className="flex gap-2">
                                    <button type="button"
                                        onClick={() => setCreateForm({ ...createForm, guest_mode: 'existing' })}
                                        className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border ${createForm.guest_mode === 'existing' ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                                        Existing Guest
                                    </button>
                                    <button type="button"
                                        onClick={() => setCreateForm({ ...createForm, guest_mode: 'new' })}
                                        className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border ${createForm.guest_mode === 'new' ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                                        New Guest
                                    </button>
                                </div>

                                {createForm.guest_mode === 'existing' ? (
                                    <select className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                                        value={createForm.guest_id} onChange={(e) => setCreateForm({ ...createForm, guest_id: e.target.value })} required>
                                        <option value="" disabled>Select a guest...</option>
                                        {guests.map((g) => (
                                            <option key={g.guest_id} value={g.guest_id}>{g.full_name} — {g.phone}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <div className="grid grid-cols-2 gap-3">
                                        <input type="text" placeholder="Full Name" className="col-span-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                                            value={createForm.guest_full_name} onChange={(e) => setCreateForm({ ...createForm, guest_full_name: e.target.value })} required />
                                        <input type="tel" placeholder="07XXXXXXXX or +947XXXXXXXX" className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                                            value={createForm.guest_phone} onChange={(e) => setCreateForm({ ...createForm, guest_phone: e.target.value })} required />
                                        <input type="email" placeholder="Email (optional)" className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                                            value={createForm.guest_email} onChange={(e) => setCreateForm({ ...createForm, guest_email: e.target.value })} />
                                    </div>
                                )}

                                <div className="space-y-1">
                                    <label className="text-[9px] font-black uppercase text-slate-400">Amount Charged (LKR)</label>
                                    <input type="number" step="0.01" min="0" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                                        value={createForm.amount_charged} onChange={(e) => setCreateForm({ ...createForm, amount_charged: e.target.value })} required />
                                    {guestBookingFee != null && (
                                        <p className="text-[10px] text-slate-400 font-bold pt-0.5">Standard guest fee: LKR {guestBookingFee}</p>
                                    )}
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[9px] font-black uppercase text-slate-400">Payment Note (optional)</label>
                                    <input type="text" placeholder="e.g. Paid cash at front desk" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                                        value={createForm.note} onChange={(e) => setCreateForm({ ...createForm, note: e.target.value })} />
                                </div>
                            </div>
                        )}

                        {createError && <p className="text-red-500 text-[11px] font-bold">{createError}</p>}
                    </div>
                )}
            </Modal>

            <Modal
                isOpen={!!editingBooking} onClose={() => setEditingBooking(null)}
                title="Edit Booking"
                submitText={savingEdit ? 'Saving...' : 'Save Changes'}
                onSubmit={handleSaveEdit}
            >
                {editingBooking && (
                    <div className="space-y-4">
                        <p className="text-slate-600 text-sm">
                            <span className="font-bold text-slate-900">{editingBooking.payer_name || 'Unknown'}</span>
                            {' · '}{editingBooking.court_name}{' · '}
                            {editingBooking.start_time?.slice(0, 5)}–{editingBooking.end_time?.slice(0, 5)} on {editingBooking.booking_date}
                        </p>

                        <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-slate-400">Amount Charged (LKR)</label>
                            <input
                                type="number" step="0.01" min="0" autoFocus required
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                                value={editAmount} onChange={(e) => setEditAmount(e.target.value)}
                            />
                            <p className="text-slate-400 text-[10px] pt-1">
                                If this booking has a linked payment record, its amount is corrected to match.
                            </p>
                        </div>

                        {editError && <p className="text-red-500 text-[11px] font-bold">{editError}</p>}
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default AdminBookings;

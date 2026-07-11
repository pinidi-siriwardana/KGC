import React, { useState, useEffect } from 'react';
import { CalendarDays, CheckCircle2 } from 'lucide-react';
import { apiFetch } from '../../utils/api';
import { slotKey } from '../../utils/bookingKey';
import CourtSlotGrid from '../../components/booking/CourtSlotGrid';
import Modal from '../../components/common/Modal';

const todayISO = () => new Date().toISOString().slice(0, 10);

const CoachBook = () => {
    const [selectedDate, setSelectedDate] = useState(todayISO());
    const [courts, setCourts] = useState([]);
    const [slots, setSlots] = useState([]);
    const [takenKeys, setTakenKeys] = useState(new Set());
    const [pending, setPending] = useState(null);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState('');

    useEffect(() => {
        apiFetch('/api/courts').then((res) => res.json()).then((data) => setCourts(data.data || []));
        apiFetch('/api/time-slots').then((res) => res.json()).then((data) => setSlots(data.data || []));
    }, []);

    useEffect(() => {
        apiFetch(`/api/bookings/availability?date=${selectedDate}`)
            .then((res) => res.json())
            .then((data) => setTakenKeys(new Set((data.data || []).map((r) => slotKey(r.court_id, r.slot_id)))));
    }, [selectedDate]);

    const refreshAvailability = () => {
        apiFetch(`/api/bookings/availability?date=${selectedDate}`)
            .then((res) => res.json())
            .then((data) => setTakenKeys(new Set((data.data || []).map((r) => slotKey(r.court_id, r.slot_id)))));
    };

    const handleSelectSlot = (court, slot) => {
        setError('');
        setPending({ court, slot });
    };

    const handleConfirm = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        const res = await apiFetch('/api/bookings', {
            method: 'POST',
            body: JSON.stringify({ court_id: pending.court.court_id, slot_id: pending.slot.slot_id, booking_date: selectedDate }),
        });

        setSubmitting(false);

        if (res.ok) {
            setPending(null);
            setSuccess('Court reserved and confirmed.');
            refreshAvailability();
            setTimeout(() => setSuccess(''), 4000);
        } else {
            const err = await res.json();
            if (res.status === 409) refreshAvailability();
            setError(err.message || 'Failed to reserve this slot.');
        }
    };

    return (
        <div className="relative space-y-8 animate-in fade-in duration-700">
            <header className="relative z-10">
                <h1 className="text-slate-900 text-4xl font-serif italic">Reserve a <span className="text-amber-600">Court.</span></h1>
                <p className="text-emerald-600 text-[10px] font-black uppercase tracking-[0.3em] mt-2">
                    Pick an open slot for your session
                </p>
            </header>

            {success && (
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold px-4 py-3 rounded-xl">
                    <CheckCircle2 size={16} /> {success}
                </div>
            )}

            <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-8 space-y-6">
                <div className="flex items-center gap-3">
                    <CalendarDays size={16} className="text-amber-600" />
                    <input
                        type="date"
                        min={todayISO()}
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                    />
                </div>

                <CourtSlotGrid
                    courts={courts}
                    slots={slots}
                    takenKeys={takenKeys}
                    onSelectSlot={handleSelectSlot}
                    selectedKey={pending ? slotKey(pending.court.court_id, pending.slot.slot_id) : null}
                />
            </div>

            <Modal
                isOpen={!!pending} onClose={() => setPending(null)}
                title="Confirm Reservation"
                submitText={submitting ? 'Reserving...' : 'Confirm Reservation'}
                onSubmit={handleConfirm}
            >
                {pending && (
                    <div className="space-y-3">
                        <p className="text-slate-600 text-sm">
                            Reserve <span className="font-bold text-slate-900">{pending.court.court_name}</span> on{' '}
                            <span className="font-bold text-slate-900">{selectedDate}</span> at{' '}
                            <span className="font-bold text-slate-900">{pending.slot.start_time?.slice(0, 5)}–{pending.slot.end_time?.slice(0, 5)}</span>?
                        </p>
                        {error && <p className="text-red-500 text-[11px] font-bold">{error}</p>}
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default CoachBook;

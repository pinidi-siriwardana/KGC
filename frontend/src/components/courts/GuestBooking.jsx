import React, { useState, useEffect, useRef } from 'react';
import { CalendarDays, Info, FileUp, CheckCircle2, Clock } from 'lucide-react';
import { apiFetch } from '../../utils/api';
import { slotKey } from '../../utils/bookingKey';
import Modal from '../../components/common/Modal';
import CourtSlotGrid from '../../components/booking/CourtSlotGrid';

const todayISO = () => new Date().toISOString().slice(0, 10);

const emptyGuestForm = () => ({ guest_full_name: '', guest_phone: '', guest_email: '' });

const formatRemaining = (seconds) => {
    if (seconds <= 0) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
};

const GuestBooking = () => {
    const [selectedDate, setSelectedDate] = useState(todayISO());
    const [courts, setCourts] = useState([]);
    const [slots, setSlots] = useState([]);
    const [stateMap, setStateMap] = useState({});
    const [settings, setSettings] = useState(null);

    const [pendingSlot, setPendingSlot] = useState(null);
    const [step, setStep] = useState('details'); // 'details' | 'payment' | 'done'
    const [guestForm, setGuestForm] = useState(emptyGuestForm);
    const [lockedBooking, setLockedBooking] = useState(null);
    const [remaining, setRemaining] = useState(0);
    const [note, setNote] = useState('');
    const [receiptFile, setReceiptFile] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const timerRef = useRef(null);

    useEffect(() => {
        apiFetch('/api/courts').then((res) => res.json()).then((data) => setCourts(data.data || []));
        apiFetch('/api/time-slots').then((res) => res.json()).then((data) => setSlots(data.data || []));
        apiFetch('/api/settings').then((res) => res.json()).then((data) => setSettings(data.data || null));
    }, []);

    const refreshAvailability = () => {
        apiFetch(`/api/bookings/availability?date=${selectedDate}`)
            .then((res) => res.json())
            .then((data) => {
                const map = {};
                (data.data || []).forEach((r) => { map[slotKey(r.court_id, r.slot_id)] = r.state; });
                setStateMap(map);
            });
    };

    useEffect(() => { refreshAvailability(); }, [selectedDate]);

    // Countdown ticks while a lock is active and payment hasn't been submitted yet.
    useEffect(() => {
        if (step !== 'payment' || !lockedBooking) return undefined;

        const tick = () => {
            const secondsLeft = Math.max(0, Math.floor((new Date(lockedBooking.lock_expires_at) - new Date()) / 1000));
            setRemaining(secondsLeft);
            if (secondsLeft <= 0) {
                clearInterval(timerRef.current);
            }
        };
        tick();
        timerRef.current = setInterval(tick, 1000);
        return () => clearInterval(timerRef.current);
    }, [step, lockedBooking]);

    const handleSelectSlot = (court, slot) => {
        setError('');
        setGuestForm(emptyGuestForm());
        setPendingSlot({ court, slot });
        setStep('details');
        setLockedBooking(null);
    };

    const closeModal = () => {
        setPendingSlot(null);
        clearInterval(timerRef.current);
        refreshAvailability();
    };

    const handleDetailsSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        const res = await apiFetch('/api/bookings/guest-lock', {
            method: 'POST',
            body: JSON.stringify({
                court_id: pendingSlot.court.court_id,
                slot_id: pendingSlot.slot.slot_id,
                booking_date: selectedDate,
                ...guestForm,
            }),
        });

        setSubmitting(false);

        if (res.ok) {
            const data = await res.json();
            setLockedBooking(data.data);
            setStep('payment');
        } else {
            const err = await res.json();
            setError(err.message || 'Failed to hold this slot.');
            if (res.status === 409) refreshAvailability();
        }
    };

    const handlePaymentSubmit = async (e) => {
        e.preventDefault();

        if (remaining <= 0) {
            setError('This slot hold has expired. Please select a slot again.');
            return;
        }
        if (!receiptFile) {
            setError('Please attach your payment slip.');
            return;
        }

        setSubmitting(true);
        setError('');

        const body = new FormData();
        if (note) body.append('note', note);
        body.append('receipt', receiptFile);

        const res = await apiFetch(`/api/bookings/guest-lock/${lockedBooking.booking_id}/pay`, { method: 'POST', body });
        setSubmitting(false);

        if (res.ok) {
            clearInterval(timerRef.current);
            setStep('done');
        } else {
            const err = await res.json();
            setError(err.message || 'Failed to submit payment.');
        }
    };

    const handleDoneSubmit = (e) => {
        e.preventDefault();
        closeModal();
    };

    const handleModalSubmit = step === 'details' ? handleDetailsSubmit : step === 'payment' ? handlePaymentSubmit : handleDoneSubmit;

    return (
        <section id="book" className="relative bg-obsidian py-24 px-6 lg:px-20 overflow-hidden">
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald/5 blur-[150px] rounded-full pointer-events-none" />

            <div className="max-w-6xl mx-auto relative z-10 space-y-10">
                <div className="space-y-4">
                    <h2 className="text-white text-4xl md:text-5xl font-serif italic">
                        Book a Court, <span className="text-emerald">Guest Access.</span>
                    </h2>
                    <p className="text-white/40 max-w-2xl text-sm leading-relaxed">
                        Select an open slot below to reserve it. No account needed.
                    </p>
                </div>

                {/* Instructions — always visible, before the grid */}
                <div className="flex gap-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl p-6">
                    <Info size={20} className="text-amber-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                        <p className="text-amber-300 text-xs font-black uppercase tracking-widest">Before You Book</p>
                        <p className="text-white/50 text-sm leading-relaxed">
                            Confirming a court requires payment. Clicking an open slot below will <span className="text-white/80 font-bold">hold it for 5 minutes</span> while
                            you transfer the fee and upload your payment slip. If the 5 minutes run out before you submit, the slot becomes available to others again —
                            so have your payment ready, or be quick with the transfer.
                        </p>
                    </div>
                </div>

                <div className="bg-white/[0.03] border border-white/5 rounded-club p-8 space-y-6">
                    <div className="flex items-center gap-3">
                        <CalendarDays size={16} className="text-emerald" />
                        <input
                            type="date"
                            min={todayISO()}
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="px-4 py-2 bg-white/[0.03] border border-white/10 rounded-xl text-sm text-white outline-none"
                        />
                    </div>

                    <CourtSlotGrid
                        courts={courts}
                        slots={slots}
                        stateMap={stateMap}
                        onSelectSlot={handleSelectSlot}
                        selectedKey={pendingSlot ? slotKey(pendingSlot.court.court_id, pendingSlot.slot.slot_id) : null}
                        dark
                    />
                </div>
            </div>

            <Modal
                isOpen={!!pendingSlot} onClose={closeModal}
                title={step === 'details' ? 'Your Details' : step === 'payment' ? 'Complete Payment' : 'Submitted'}
                submitText={submitting ? 'Please wait...' : step === 'details' ? 'Hold This Slot (5 min)' : step === 'payment' ? 'Submit Payment' : 'Close'}
                onSubmit={handleModalSubmit}
            >
                {pendingSlot && step !== 'done' && (
                    <p className="text-slate-600 text-sm mb-4">
                        <span className="font-bold text-slate-900">{pendingSlot.court.court_name}</span> on{' '}
                        <span className="font-bold text-slate-900">{selectedDate}</span> at{' '}
                        <span className="font-bold text-slate-900">{pendingSlot.slot.start_time?.slice(0, 5)}–{pendingSlot.slot.end_time?.slice(0, 5)}</span>
                    </p>
                )}

                {step === 'details' && (
                    <div className="space-y-3">
                        <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-slate-400">Full Name</label>
                            <input type="text" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                                value={guestForm.guest_full_name} onChange={(e) => setGuestForm({ ...guestForm, guest_full_name: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-slate-400">Phone</label>
                            <input type="text" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                                value={guestForm.guest_phone} onChange={(e) => setGuestForm({ ...guestForm, guest_phone: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-slate-400">Email (optional)</label>
                            <input type="email" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                                value={guestForm.guest_email} onChange={(e) => setGuestForm({ ...guestForm, guest_email: e.target.value })} />
                        </div>
                        {error && <p className="text-red-500 text-[11px] font-bold">{error}</p>}
                    </div>
                )}

                {step === 'payment' && lockedBooking && (
                    <div className="space-y-4">
                        <div className={`flex items-center gap-2 justify-center py-2 rounded-xl border ${remaining > 60 ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-600'}`}>
                            <Clock size={14} />
                            <span className="text-sm font-black font-mono">{formatRemaining(remaining)}</span>
                            <span className="text-[9px] font-bold uppercase tracking-widest">remaining to complete payment</span>
                        </div>

                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-1">
                            <p className="text-[9px] font-black uppercase text-slate-400">{settings?.payment_instructions}</p>
                            <p className="text-slate-900 text-lg font-bold font-mono mt-2">LKR {settings?.guest_booking_fee}</p>
                            <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
                                <div><p className="text-[9px] font-black uppercase text-slate-400">Bank</p><p className="font-bold text-slate-800">{settings?.bank_name}</p></div>
                                <div><p className="text-[9px] font-black uppercase text-slate-400">Account Name</p><p className="font-bold text-slate-800">{settings?.account_name}</p></div>
                                <div><p className="text-[9px] font-black uppercase text-slate-400">Account Number</p><p className="font-bold text-slate-800 font-mono">{settings?.account_number}</p></div>
                                <div><p className="text-[9px] font-black uppercase text-slate-400">Branch</p><p className="font-bold text-slate-800">{settings?.branch}</p></div>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-slate-400">Note (optional)</label>
                            <input type="text" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                                value={note} onChange={(e) => setNote(e.target.value)} />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-slate-400">Payment Slip</label>
                            <label className={`flex items-center gap-3 px-4 py-3 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                                receiptFile ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200 hover:border-emerald-300'
                            }`}>
                                <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => setReceiptFile(e.target.files[0])} />
                                {receiptFile ? <CheckCircle2 className="text-emerald-600" size={18} /> : <FileUp className="text-slate-400" size={18} />}
                                <span className="text-slate-600 text-xs font-bold">{receiptFile ? receiptFile.name : 'Upload JPG, PNG or PDF (Max 5MB)'}</span>
                            </label>
                        </div>

                        {error && <p className="text-red-500 text-[11px] font-bold">{error}</p>}
                    </div>
                )}

                {step === 'done' && (
                    <div className="space-y-3 py-4 text-center">
                        <CheckCircle2 className="text-emerald-600 mx-auto" size={40} />
                        <p className="text-slate-900 text-sm font-bold">Submitted for review</p>
                        <p className="text-slate-500 text-xs leading-relaxed">
                            Booking reference #{lockedBooking?.booking_id}. An admin will verify your receipt and confirm your booking shortly.
                            Please contact the club if you don't hear back.
                        </p>
                    </div>
                )}
            </Modal>
        </section>
    );
};

export default GuestBooking;

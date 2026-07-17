import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CalendarClock, ArrowUpRight } from 'lucide-react';
import { apiFetch } from '../../utils/api';
import { slotKey } from '../../utils/bookingKey';
import { todayISO } from '../../utils/date';

const nowTimeString = () => new Date().toTimeString().slice(0, 8); // "HH:MM:SS"

const formatTime = (t) => {
    if (!t) return '';
    const [h, m] = t.split(':');
    const hour = Number(h);
    const suffix = hour >= 12 ? 'PM' : 'AM';
    const hour12 = ((hour + 11) % 12) + 1;
    return `${hour12}:${m} ${suffix}`;
};

// Finds the earliest still-upcoming time slot today with at least one open,
// non-maintenance court — the "come book right now" nudge on the homepage.
const NextAvailableSlot = () => {
    const [state, setState] = useState({ loading: true, slot: null, openCount: 0 });

    useEffect(() => {
        let cancelled = false;

        Promise.all([
            apiFetch('/api/courts').then((res) => res.json()),
            apiFetch('/api/time-slots').then((res) => res.json()),
            apiFetch(`/api/bookings/availability?date=${todayISO()}`).then((res) => res.json()),
        ])
            .then(([courtsData, slotsData, availData]) => {
                if (cancelled) return;

                const courts = (courtsData.data || []).filter((c) => c.is_active && c.status === 'available');
                const slots = (slotsData.data || []).slice().sort((a, b) => a.start_time.localeCompare(b.start_time));
                const occupied = {};
                (availData.data || []).forEach((r) => { occupied[slotKey(r.court_id, r.slot_id)] = r.state; });

                const now = nowTimeString();
                const upcoming = slots.filter((s) => s.start_time > now);

                for (const slot of upcoming) {
                    const openCount = courts.filter((c) => !occupied[slotKey(c.court_id, slot.slot_id)]).length;
                    if (openCount > 0) {
                        setState({ loading: false, slot, openCount });
                        return;
                    }
                }
                setState({ loading: false, slot: null, openCount: 0 });
            })
            .catch(() => { if (!cancelled) setState({ loading: false, slot: null, openCount: 0 }); });

        return () => { cancelled = true; };
    }, []);

    if (state.loading) return null;

    return (
        <Link
            to="/courts#book"
            className="inline-flex items-center gap-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full pl-3 pr-5 py-2 mb-8 no-underline hover:bg-white/10 hover:border-emerald/30 transition-all group"
        >
            <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${state.slot ? 'bg-emerald' : 'bg-amber'}`} />
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${state.slot ? 'bg-emerald' : 'bg-amber'}`} />
            </span>

            <CalendarClock size={14} className="text-white/50" />

            {state.slot ? (
                <span className="text-[11px] font-bold text-white/90 tracking-wide">
                    Next available today: <span className="text-emerald font-black">{formatTime(state.slot.start_time)}</span>
                    {' · '}{state.openCount} court{state.openCount === 1 ? '' : 's'} open
                </span>
            ) : (
                <span className="text-[11px] font-bold text-white/90 tracking-wide">
                    Fully booked for the rest of today — check tomorrow's slots
                </span>
            )}

            <ArrowUpRight size={13} className="text-white/40 group-hover:text-emerald group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
        </Link>
    );
};

export default NextAvailableSlot;

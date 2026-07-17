import React from 'react';
import { slotKey } from '../../utils/bookingKey';
import { todayISO } from '../../utils/date';

const formatTime = (t) => (t ? t.slice(0, 5) : '');

const nowTimeString = () => new Date().toTimeString().slice(0, 8); // "HH:MM:SS", matches TIME columns

const LABEL = { available: 'Open', locked: 'Locked', booked: 'Booked', maintenance: '—', past: 'Passed' };

const LIGHT_STYLE = {
    available: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white cursor-pointer',
    locked: 'bg-amber-50 text-amber-600 cursor-not-allowed',
    booked: 'bg-red-50 text-red-300 cursor-not-allowed',
    maintenance: 'bg-slate-100 text-slate-300 cursor-not-allowed',
    past: 'bg-slate-50 text-slate-300 cursor-not-allowed',
};
const LIGHT_SELECTED = 'bg-slate-900 text-white';
const LIGHT_LEGEND = { available: 'bg-emerald-500/60', locked: 'bg-amber-500/60', booked: 'bg-red-400/60', maintenance: 'bg-slate-300', past: 'bg-slate-200' };
const LIGHT_TEXT = { header: 'text-slate-400', headerCourt: 'text-slate-500', headerType: 'text-slate-400', time: 'text-slate-600', legend: 'text-slate-500', loading: 'text-slate-400' };

const DARK_STYLE = {
    available: 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white cursor-pointer border border-emerald-500/20',
    locked: 'bg-amber-500/10 text-amber-400 cursor-not-allowed border border-amber-500/20',
    booked: 'bg-red-500/10 text-red-400 cursor-not-allowed border border-red-500/20',
    maintenance: 'bg-white/5 text-white/20 cursor-not-allowed border border-white/5',
    past: 'bg-white/5 text-white/15 cursor-not-allowed border border-white/5',
};
const DARK_SELECTED = 'bg-white text-obsidian';
const DARK_LEGEND = { available: 'bg-emerald-500/40', locked: 'bg-amber-500/40', booked: 'bg-red-500/40', maintenance: 'bg-white/10', past: 'bg-white/10' };
const DARK_TEXT = { header: 'text-white/40', headerCourt: 'text-white/60', headerType: 'text-white/30', time: 'text-white/60', legend: 'text-white/40', loading: 'text-white/40' };

// Pure presentational court x slot grid, shared identically by every booking
// surface — guest (public), member, coach, and admin all use the exact same
// component with the exact same rules, no per-role exceptions. States:
// available / locked (someone else mid-checkout) / booked (confirmed) /
// maintenance (court itself unavailable) / past (today's slot has fully
// elapsed — not reflected in stateMap since it never got a bookings row, so
// it's derived here from selectedDate + the slot's own end_time). A slot
// stays bookable for whatever's left of its duration — e.g. at 1:30, the
// 1-2pm slot is still open, it only locks once its end_time (2pm) passes.
// Callers own data-fetching and what clicking an open cell does; only the
// visual theme (`dark`) differs by context.
const CourtSlotGrid = ({ courts, slots, stateMap, onSelectSlot, selectedKey, dark = false, selectedDate }) => {
    if (!courts.length || !slots.length) {
        const text = dark ? DARK_TEXT : LIGHT_TEXT;
        return (
            <p className={`${text.loading} text-[10px] uppercase tracking-widest font-black py-10 text-center`}>
                Loading courts and time slots...
            </p>
        );
    }

    const STYLE = dark ? DARK_STYLE : LIGHT_STYLE;
    const SELECTED = dark ? DARK_SELECTED : LIGHT_SELECTED;
    const LEGEND = dark ? DARK_LEGEND : LIGHT_LEGEND;
    const text = dark ? DARK_TEXT : LIGHT_TEXT;
    const isToday = selectedDate === todayISO();
    const nowTime = isToday ? nowTimeString() : null;

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left border-separate border-spacing-1">
                <thead>
                    <tr>
                        <th className={`p-2 text-[9px] font-black uppercase ${text.header} tracking-widest text-left`}>Time</th>
                        {courts.map((court) => (
                            <th key={court.court_id} className={`p-2 text-[9px] font-black uppercase ${text.headerCourt} tracking-widest text-center`}>
                                {court.court_name}
                                <span className={`block text-[8px] ${text.headerType} font-medium normal-case`}>{court.court_type}</span>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {slots.map((slot) => (
                        <tr key={slot.slot_id}>
                            <td className={`p-2 text-[10px] font-bold ${text.time} whitespace-nowrap`}>
                                {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                            </td>
                            {courts.map((court) => {
                                const key = slotKey(court.court_id, slot.slot_id);
                                const courtUnavailable = court.status !== 'available' || !court.is_active;
                                const isPast = isToday && slot.end_time && slot.end_time <= nowTime;
                                const state = courtUnavailable ? 'maintenance' : isPast ? 'past' : (stateMap[key] || 'available');
                                const isSelected = selectedKey === key;

                                return (
                                    <td key={court.court_id} className="p-0.5">
                                        <button
                                            type="button"
                                            disabled={state !== 'available'}
                                            onClick={() => onSelectSlot(court, slot)}
                                            className={`w-full h-9 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                                                isSelected ? SELECTED : STYLE[state]
                                            }`}
                                        >
                                            {isSelected ? 'Selected' : LABEL[state]}
                                        </button>
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className={`flex flex-wrap gap-4 mt-6 pt-6 border-t ${dark ? 'border-white/5' : 'border-slate-100'}`}>
                {[
                    ['available', 'Available'],
                    ['locked', 'Locked (payment pending)'],
                    ['booked', 'Booked'],
                    ['maintenance', 'Maintenance'],
                    ...(isToday ? [['past', 'Time Passed']] : []),
                ].map(([key, label]) => (
                    <div key={key} className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded ${LEGEND[key]}`} />
                        <span className={`text-[9px] font-bold uppercase tracking-widest ${text.legend}`}>{label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CourtSlotGrid;

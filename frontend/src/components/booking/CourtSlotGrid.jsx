import React from 'react';
import { slotKey } from '../../utils/bookingKey';

const formatTime = (t) => (t ? t.slice(0, 5) : '');

// Pure presentational court x slot grid. No data fetching — the caller owns
// courts/slots/availability state and what happens when an open cell is
// clicked, so this same grid is reused as-is by the member, coach, and admin
// booking-creation pages.
const CourtSlotGrid = ({ courts, slots, takenKeys, onSelectSlot, selectedKey }) => {
    if (!courts.length || !slots.length) {
        return (
            <p className="text-slate-400 text-[10px] uppercase tracking-widest font-black py-10 text-center">
                Loading courts and time slots...
            </p>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left border-separate border-spacing-1">
                <thead>
                    <tr>
                        <th className="p-2 text-[9px] font-black uppercase text-slate-400 tracking-widest text-left">Time</th>
                        {courts.map((court) => (
                            <th key={court.court_id} className="p-2 text-[9px] font-black uppercase text-slate-500 tracking-widest text-center">
                                {court.court_name}
                                <span className="block text-[8px] text-slate-400 font-medium normal-case">{court.court_type}</span>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {slots.map((slot) => (
                        <tr key={slot.slot_id}>
                            <td className="p-2 text-[10px] font-bold text-slate-600 whitespace-nowrap">
                                {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                            </td>
                            {courts.map((court) => {
                                const key = slotKey(court.court_id, slot.slot_id);
                                const courtUnavailable = court.status !== 'available' || !court.is_active;
                                const taken = takenKeys.has(key);
                                const isSelected = selectedKey === key;
                                const disabled = courtUnavailable || taken;

                                return (
                                    <td key={court.court_id} className="p-0.5">
                                        <button
                                            type="button"
                                            disabled={disabled}
                                            onClick={() => onSelectSlot(court, slot)}
                                            className={`w-full h-9 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                                                isSelected
                                                    ? 'bg-slate-900 text-white'
                                                    : courtUnavailable
                                                    ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                                                    : taken
                                                    ? 'bg-red-50 text-red-300 cursor-not-allowed'
                                                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white cursor-pointer'
                                            }`}
                                        >
                                            {courtUnavailable ? '—' : taken ? 'Taken' : 'Open'}
                                        </button>
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default CourtSlotGrid;

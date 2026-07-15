import React, { useState, useEffect } from 'react';
import { CloudSun, Wind, Droplets } from 'lucide-react';
import { apiFetch } from '../../utils/api';

const RATING_DOT = { good: 'bg-emerald-500', caution: 'bg-amber-500', avoid: 'bg-rose-500', unknown: 'bg-slate-300' };
const RATING_LABEL = { good: 'Good to play', caution: 'Caution', avoid: 'Avoid', unknown: 'No data' };

const nowTimeString = () => new Date().toTimeString().slice(0, 8); // "HH:MM:SS"

const formatTime = (t) => {
    if (!t) return '';
    const [h, m] = t.split(':');
    const hour = Number(h);
    const suffix = hour >= 12 ? 'PM' : 'AM';
    const hour12 = ((hour + 11) % 12) + 1;
    return `${hour12}:${m} ${suffix}`;
};

// Shared by MemberHome and CoachHome — weather isn't role-specific, so
// unlike most of this app's page-per-role pairs, one component covers both.
const CourtWeather = () => {
    const [state, setState] = useState({ loading: true, slots: [], bestUpcoming: null, error: false });

    useEffect(() => {
        apiFetch('/api/weather/today')
            .then((res) => {
                if (!res.ok) throw new Error('Failed to load weather.');
                return res.json();
            })
            .then((data) => setState({ loading: false, slots: data.data?.slots || [], bestUpcoming: data.data?.bestUpcoming || null, error: false }))
            .catch(() => setState({ loading: false, slots: [], bestUpcoming: null, error: true }));
    }, []);

    const upcoming = state.slots.filter((s) => s.start_time > nowTimeString());

    return (
        <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-8">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-slate-800 text-lg font-serif italic flex items-center gap-2">
                    <CloudSun size={20} className="text-amber-500" /> Today's Play Conditions
                </h3>
            </div>

            {state.loading && (
                <p className="text-slate-400 text-[10px] uppercase tracking-widest font-black py-6 text-center">Checking the forecast...</p>
            )}

            {!state.loading && state.error && (
                <p className="text-slate-400 text-[10px] uppercase tracking-widest font-black py-6 text-center">Weather data is unavailable right now.</p>
            )}

            {!state.loading && !state.error && (
                <>
                    {state.bestUpcoming ? (
                        <div className="flex items-center gap-4 bg-emerald-50 border border-emerald-100 rounded-2xl p-5 mb-6">
                            <div className="w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                                <CloudSun size={20} />
                            </div>
                            <div>
                                <p className="text-emerald-700 text-xs font-black uppercase tracking-widest">Best time to play today</p>
                                <p className="text-slate-900 text-sm font-bold mt-0.5">
                                    {formatTime(state.bestUpcoming.start_time)} · {Math.round(state.bestUpcoming.temperature)}°C · {state.bestUpcoming.condition}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-4 bg-amber-50 border border-amber-100 rounded-2xl p-5 mb-6">
                            <div className="w-11 h-11 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
                                <Droplets size={20} />
                            </div>
                            <p className="text-amber-800 text-xs font-bold leading-relaxed">
                                No ideal play windows left today — conditions may improve tomorrow.
                            </p>
                        </div>
                    )}

                    <div className="flex gap-3 overflow-x-auto pb-1">
                        {upcoming.length === 0 && (
                            <p className="text-slate-400 text-[10px] uppercase tracking-widest font-black py-2">No more slots today.</p>
                        )}
                        {upcoming.map((s) => (
                            <div key={s.slot_id} className="shrink-0 w-28 bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
                                <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest">{formatTime(s.start_time)}</p>
                                <p className="text-slate-900 text-lg font-serif mt-1">{s.temperature !== null ? `${Math.round(s.temperature)}°` : '—'}</p>
                                <div className="flex items-center justify-center gap-1 mt-1">
                                    <span className={`w-1.5 h-1.5 rounded-full ${RATING_DOT[s.rating]}`} />
                                    <span className="text-[8px] font-bold uppercase text-slate-400 tracking-wide">{RATING_LABEL[s.rating]}</span>
                                </div>
                                <div className="flex items-center justify-center gap-2 mt-2 text-slate-400">
                                    <span className="flex items-center gap-0.5 text-[8px] font-bold"><Droplets size={9} /> {s.rainChance ?? '—'}%</span>
                                    <span className="flex items-center gap-0.5 text-[8px] font-bold"><Wind size={9} /> {s.windSpeed !== null ? Math.round(s.windSpeed) : '—'}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default CourtWeather;

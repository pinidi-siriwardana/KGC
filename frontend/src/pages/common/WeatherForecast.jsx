import React, { useState, useEffect } from 'react';
import { CloudSun, Sunrise, Sunset, Thermometer, Gauge, Droplets, Wind } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { apiFetch } from '../../utils/api';

const RATING_DOT = { good: 'bg-emerald-500', caution: 'bg-amber-500', avoid: 'bg-rose-500', unknown: 'bg-slate-300' };
const RATING_LABEL = { good: 'Good to Play', caution: 'Caution', avoid: 'Avoid', unknown: 'No Data' };
const RATING_CARD = {
    good: 'border-emerald-100 bg-emerald-50/50',
    caution: 'border-amber-100 bg-amber-50/50',
    avoid: 'border-rose-100 bg-rose-50/50',
    unknown: 'border-slate-100 bg-slate-50',
};
const TREND_COLOR = '#2a78d6';
const CHART_INK = { grid: '#e2e8f0', axis: '#cbd5e1', muted: '#94a3b8' };

const nowTimeString = () => new Date().toTimeString().slice(0, 8); // "HH:MM:SS"

const formatTime = (t) => {
    if (!t) return '';
    const [h, m] = t.split(':');
    const hour = Number(h);
    const suffix = hour >= 12 ? 'PM' : 'AM';
    const hour12 = ((hour + 11) % 12) + 1;
    return `${hour12}:${m} ${suffix}`;
};

// Sunrise/sunset come back as ISO datetimes ("2026-07-15T06:12"), not
// "HH:MM:SS" like the slot times, so they need their own formatter.
const formatISOTime = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};

const ChartTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white border border-slate-200 rounded-lg shadow-md px-3 py-2 text-xs">
            <p className="text-slate-400 font-bold uppercase tracking-wide text-[9px] mb-1">{label}</p>
            <p className="text-slate-900 font-bold font-mono">{payload[0].value}°C</p>
        </div>
    );
};

const SummaryTile = ({ icon: Icon, label, value }) => (
    <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-5 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-slate-900/5 flex items-center justify-center text-slate-600 shrink-0">
            <Icon size={18} />
        </div>
        <div>
            <p className="text-slate-400 text-[9px] uppercase tracking-widest font-black mb-0.5">{label}</p>
            <p className="text-slate-900 text-lg font-serif">{value}</p>
        </div>
    </div>
);

// Shared by both the member and coach portals — weather isn't role-specific,
// so unlike most page-per-role pairs in this app, one component covers both.
const WeatherForecast = () => {
    const [state, setState] = useState({ loading: true, slots: [], bestUpcoming: null, daily: null, error: false });

    useEffect(() => {
        apiFetch('/api/weather/today')
            .then((res) => {
                if (!res.ok) throw new Error('Failed to load weather.');
                return res.json();
            })
            .then((data) => setState({
                loading: false,
                slots: data.data?.slots || [],
                bestUpcoming: data.data?.bestUpcoming || null,
                daily: data.data?.daily || null,
                error: false,
            }))
            .catch(() => setState({ loading: false, slots: [], bestUpcoming: null, daily: null, error: true }));
    }, []);

    const now = nowTimeString();
    const chartData = state.slots
        .filter((s) => s.temperature !== null)
        .map((s) => ({ label: formatTime(s.start_time), temperature: Math.round(s.temperature * 10) / 10 }));

    return (
        <div className="relative space-y-8 animate-in fade-in duration-700">
            <header className="relative z-10 flex items-center gap-5">
                <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <CloudSun size={32} strokeWidth={1.5} />
                </div>
                <div>
                    <h1 className="text-slate-900 text-4xl font-serif italic">Weather &amp; Court Conditions</h1>
                    <p className="text-emerald-600 text-[10px] font-black uppercase tracking-[0.3em] mt-2">
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} · Kandy Garden Club
                    </p>
                </div>
            </header>

            {state.loading && (
                <p className="text-slate-400 text-[10px] uppercase tracking-widest font-black py-16 text-center">Loading today's forecast...</p>
            )}

            {!state.loading && state.error && (
                <p className="text-slate-400 text-[10px] uppercase tracking-widest font-black py-16 text-center">Weather data is unavailable right now.</p>
            )}

            {!state.loading && !state.error && (
                <>
                    {/* Daily summary */}
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                        <SummaryTile icon={Thermometer} label="High" value={state.daily?.tempMax != null ? `${Math.round(state.daily.tempMax)}°C` : '—'} />
                        <SummaryTile icon={Thermometer} label="Low" value={state.daily?.tempMin != null ? `${Math.round(state.daily.tempMin)}°C` : '—'} />
                        <SummaryTile icon={Gauge} label="UV Index" value={state.daily?.uvIndexMax != null ? Math.round(state.daily.uvIndexMax) : '—'} />
                        <SummaryTile icon={Sunrise} label="Sunrise" value={formatISOTime(state.daily?.sunrise)} />
                        <SummaryTile icon={Sunset} label="Sunset" value={formatISOTime(state.daily?.sunset)} />
                    </div>

                    {/* Best time banner */}
                    {state.bestUpcoming ? (
                        <div className="flex items-center gap-4 bg-emerald-50 border border-emerald-100 rounded-2xl p-6">
                            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                                <CloudSun size={22} />
                            </div>
                            <div>
                                <p className="text-emerald-700 text-xs font-black uppercase tracking-widest">Best Time To Play Today</p>
                                <p className="text-slate-900 text-base font-bold mt-0.5">
                                    {formatTime(state.bestUpcoming.start_time)}–{formatTime(state.bestUpcoming.end_time)} · {Math.round(state.bestUpcoming.temperature)}°C · {state.bestUpcoming.condition} · {state.bestUpcoming.rainChance}% rain chance
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-4 bg-amber-50 border border-amber-100 rounded-2xl p-6">
                            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
                                <Droplets size={22} />
                            </div>
                            <p className="text-amber-800 text-sm font-bold">No ideal play windows left today — check tomorrow's forecast.</p>
                        </div>
                    )}

                    {/* Temperature chart across club hours */}
                    <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-8">
                        <h3 className="text-slate-800 text-lg font-serif italic mb-6">Temperature Through The Day</h3>
                        <ResponsiveContainer width="100%" height={260}>
                            <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="tempFill" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor={TREND_COLOR} stopOpacity={0.25} />
                                        <stop offset="100%" stopColor={TREND_COLOR} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid vertical={false} stroke={CHART_INK.grid} />
                                <XAxis dataKey="label" tick={{ fontSize: 10, fill: CHART_INK.muted }} axisLine={{ stroke: CHART_INK.axis }} tickLine={false} />
                                <YAxis tick={{ fontSize: 10, fill: CHART_INK.muted }} axisLine={false} tickLine={false} width={36} tickFormatter={(v) => `${v}°`} />
                                <Tooltip content={<ChartTooltip />} cursor={{ stroke: CHART_INK.axis, strokeWidth: 1 }} />
                                <Area
                                    type="monotone" dataKey="temperature" stroke={TREND_COLOR} strokeWidth={2}
                                    fill="url(#tempFill)" dot={{ r: 3, fill: TREND_COLOR, strokeWidth: 0 }} activeDot={{ r: 5 }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Full-day slot breakdown */}
                    <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-8">
                        <h3 className="text-slate-800 text-lg font-serif italic mb-6">Hour-By-Hour Breakdown</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                            {state.slots.map((s) => {
                                const isPast = s.start_time <= now;
                                return (
                                    <div
                                        key={s.slot_id}
                                        className={`rounded-xl border p-3 text-center ${RATING_CARD[s.rating]} ${isPast ? 'opacity-40' : ''}`}
                                    >
                                        <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest">{formatTime(s.start_time)}</p>
                                        <p className="text-slate-900 text-xl font-serif mt-1">{s.temperature !== null ? `${Math.round(s.temperature)}°` : '—'}</p>
                                        <div className="flex items-center justify-center gap-1 mt-1.5">
                                            <span className={`w-1.5 h-1.5 rounded-full ${RATING_DOT[s.rating]}`} />
                                            <span className="text-[8px] font-bold uppercase text-slate-500 tracking-wide">{RATING_LABEL[s.rating]}</span>
                                        </div>
                                        <div className="flex items-center justify-center gap-2 mt-2 text-slate-400">
                                            <span className="flex items-center gap-0.5 text-[8px] font-bold"><Droplets size={9} /> {s.rainChance ?? '—'}%</span>
                                            <span className="flex items-center gap-0.5 text-[8px] font-bold"><Wind size={9} /> {s.windSpeed !== null ? Math.round(s.windSpeed) : '—'}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default WeatherForecast;

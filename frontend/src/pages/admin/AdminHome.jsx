import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Users, DollarSign, Activity, CalendarCheck, TrendingUp, TrendingDown,
    ShieldCheck, MessageSquare, Trophy, UserCheck, ArrowRight, ClipboardCheck, Bell, CheckCircle2,
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import StatCard from '../../components/common/StatCard';
import { apiFetch } from '../../utils/api';

const TREND_COLOR = '#2a78d6';
const CHART_INK = { grid: '#e1e0d9', axis: '#c3c2b7', muted: '#898781' };

const ACTIVITY_ICON = { booking: CalendarCheck, verification: ShieldCheck, inquiry: MessageSquare };
const ACTIVITY_DOT = { booking: 'bg-emerald-500', verification: 'bg-amber-500', inquiry: 'bg-blue-500' };

const NOTIFICATION_ICON = { members_awaiting_plan: Users, pending_verifications: ShieldCheck, unread_inquiries: MessageSquare };
const NOTIFICATION_TONE = {
    warning: { icon: 'bg-amber-100 text-amber-600', hover: 'hover:border-amber-200 hover:bg-amber-50/50', arrow: 'group-hover/notif:text-amber-500' },
    info: { icon: 'bg-blue-100 text-blue-600', hover: 'hover:border-blue-200 hover:bg-blue-50/50', arrow: 'group-hover/notif:text-blue-500' },
};

const QUICK_LINKS = [
    { label: 'Verify Receipts', to: '/admin/verify-payments', icon: ShieldCheck },
    { label: 'Live Bookings', to: '/admin/bookings', icon: CalendarCheck },
    { label: 'Revenue Reports', to: '/admin/reports', icon: TrendingUp },
    { label: 'Member Directory', to: '/admin/members', icon: Users },
];

const formatLKR = (n) => `LKR ${Number(n || 0).toLocaleString('en-LK', { maximumFractionDigits: 0 })}`;

const formatDayLabel = (period) => new Date(period).toLocaleDateString('en-LK', { month: 'short', day: 'numeric' });

const timeAgo = (timestamp) => {
    const seconds = Math.max(0, Math.round((Date.now() - new Date(timestamp).getTime()) / 1000));
    if (seconds < 60) return 'just now';
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.round(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString('en-LK', { month: 'short', day: 'numeric' });
};

const ChartTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white border border-slate-200 rounded-lg shadow-md px-3 py-2 text-xs">
            <p className="text-slate-400 font-bold uppercase tracking-wide text-[9px] mb-1">{label}</p>
            <p className="text-slate-900 font-bold font-mono">{formatLKR(payload[0].value)}</p>
        </div>
    );
};

const DetailChip = ({ icon: Icon, label, value }) => (
    <div className="flex items-center gap-3 bg-white border border-slate-100 shadow-sm rounded-2xl px-5 py-4">
        <div className="p-2 bg-slate-900/5 rounded-xl">
            <Icon size={16} className="text-slate-600" />
        </div>
        <div>
            <p className="text-slate-900 text-base font-bold font-mono leading-none">{value}</p>
            <p className="text-slate-400 text-[9px] uppercase tracking-widest font-black mt-1">{label}</p>
        </div>
    </div>
);

const AdminHome = () => {
    const [overview, setOverview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');

    const storedUser = (() => {
        try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
    })();

    const fetchOverview = () => {
        apiFetch('/api/admin/dashboard')
            .then((res) => {
                if (!res.ok) throw new Error('Failed to load dashboard data.');
                return res.json();
            })
            .then((data) => {
                setOverview(data.data || null);
                setLoadError('');
            })
            // A failed load must not render as "every stat is 0, all caught
            // up" — that's indistinguishable from a genuinely quiet dashboard.
            .catch((err) => setLoadError(err.message || 'Failed to load dashboard data.'))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchOverview(); }, []);

    const handleRetry = () => {
        setLoading(true);
        setLoadError('');
        fetchOverview();
    };

    const revenueTrend = overview?.revenue?.trendPercent ?? 0;
    const timeseriesData = (overview?.revenue?.timeseries || []).map((row) => ({
        label: formatDayLabel(row.period),
        total: Number(row.total),
    }));

    return (
        <div className="relative space-y-12">

            {/* --- ATMOSPHERIC GLOWS (Softened for Light Mode) --- */}
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/5 blur-[150px] rounded-full pointer-events-none" />

            {loadError && (
                <div className="relative z-10 flex items-center justify-between gap-4 bg-rose-50 border border-rose-100 text-rose-700 text-xs font-bold px-4 py-3 rounded-2xl">
                    <span>{loadError}</span>
                    <button onClick={handleRetry} className="shrink-0 uppercase tracking-widest text-[10px] underline hover:no-underline">Retry</button>
                </div>
            )}

            {/* Header Section */}
            <header className="relative z-10 flex justify-between items-end">
                <div>
                    <h1 className="text-slate-900 text-5xl font-serif italic tracking-tight">
                        Welcome, <span className="text-amber-600">{storedUser?.username || 'Superintendent'}.</span>
                    </h1>
                    <div className="flex items-center gap-3 mt-3">
                        <span className="h-px w-8 bg-emerald-500" />
                        <p className="text-emerald-600/60 text-[10px] uppercase tracking-[0.3em] font-black">
                            Executive Overview • {new Date().toLocaleDateString('en-LK', { month: 'long', year: 'numeric' })}
                        </p>
                    </div>
                </div>
                <div className="hidden lg:block text-right">
                    <p className="text-slate-400 text-[10px] uppercase font-black tracking-widest">Club Status</p>
                    <p className="text-emerald-600 font-mono text-sm">OPERATIONAL</p>
                </div>
            </header>

            {/* Stats Grid */}
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="hover:translate-y-[-4px] transition-transform duration-300">
                    <StatCard
                        label="Revenue (30d)"
                        value={loading ? '···' : formatLKR(overview?.revenue?.total)}
                        trend={loading ? undefined : (
                            <span className="flex items-center gap-1">
                                {revenueTrend >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                                {Math.abs(revenueTrend).toFixed(1)}%
                            </span>
                        )}
                        tone={revenueTrend >= 0 ? 'positive' : 'warning'}
                        icon={DollarSign}
                    />
                </div>
                <div className="hover:translate-y-[-4px] transition-transform duration-300">
                    <StatCard
                        label="Pending Applications"
                        value={loading ? '···' : overview?.pendingApplications ?? 0}
                        trend={loading ? undefined : (overview?.pendingApplications > 0 ? 'Action Required' : 'All Clear')}
                        tone={overview?.pendingApplications > 0 ? 'warning' : 'positive'}
                        icon={Activity}
                    />
                </div>
                <div className="hover:translate-y-[-4px] transition-transform duration-300">
                    <StatCard
                        label="Total Members"
                        value={loading ? '···' : (overview?.members?.total ?? 0).toLocaleString()}
                        trend={loading ? undefined : `${overview?.members?.active ?? 0} Active`}
                        tone="neutral"
                        icon={Users}
                    />
                </div>
                <div className="hover:translate-y-[-4px] transition-transform duration-300">
                    <StatCard
                        label="Court Bookings"
                        value={loading ? '···' : overview?.todayBookings ?? 0}
                        trend="Today"
                        tone="neutral"
                        icon={CalendarCheck}
                    />
                </div>
            </div>

            {/* Detail chips — secondary at-a-glance figures */}
            <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-4">
                <DetailChip icon={Trophy} label="Courts Available" value={loading ? '···' : `${overview?.courts?.available ?? 0} / ${overview?.courts?.total ?? 0}`} />
                <DetailChip icon={ClipboardCheck} label="Checked In Now" value={loading ? '···' : overview?.checkedInNow ?? 0} />
                <DetailChip icon={MessageSquare} label="Unread Inquiries" value={loading ? '···' : overview?.unreadInquiries ?? 0} />
                <DetailChip icon={UserCheck} label="Active Coaches" value={loading ? '···' : overview?.activeCoaches ?? 0} />
            </div>

            {/* Main Content: Charts & Activity */}
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Revenue Chart */}
                <div className="lg:col-span-2 group relative bg-white border border-slate-100 shadow-sm rounded-3xl p-8 h-[450px] overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50/50 blur-3xl group-hover:bg-emerald-100/50 transition-colors" />

                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h3 className="text-slate-800 text-lg font-serif italic">Revenue Analytics</h3>
                            <p className="text-slate-400 text-[10px] uppercase tracking-widest mt-1">Last 30 days, completed payments</p>
                        </div>
                        <TrendingUp className="text-emerald-500" size={20} />
                    </div>

                    {loading ? (
                        <div className="w-full h-[320px] flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                            </div>
                            <p className="text-slate-400 text-xs uppercase tracking-tighter italic font-medium">Loading financial data...</p>
                        </div>
                    ) : timeseriesData.length === 0 ? (
                        <div className="w-full h-[320px] flex items-center justify-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                            <p className="text-slate-400 text-xs uppercase tracking-widest font-bold">No revenue recorded in the last 30 days</p>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={320}>
                            <AreaChart data={timeseriesData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="homeRevenueFill" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor={TREND_COLOR} stopOpacity={0.25} />
                                        <stop offset="100%" stopColor={TREND_COLOR} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid vertical={false} stroke={CHART_INK.grid} />
                                <XAxis dataKey="label" tick={{ fontSize: 10, fill: CHART_INK.muted }} axisLine={{ stroke: CHART_INK.axis }} tickLine={false} />
                                <YAxis
                                    tick={{ fontSize: 10, fill: CHART_INK.muted }} axisLine={false} tickLine={false}
                                    tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)} width={40}
                                />
                                <Tooltip content={<ChartTooltip />} cursor={{ stroke: CHART_INK.axis, strokeWidth: 1 }} />
                                <Area
                                    type="monotone" dataKey="total" stroke={TREND_COLOR} strokeWidth={2}
                                    fill="url(#homeRevenueFill)" dot={{ r: 3, fill: TREND_COLOR, strokeWidth: 0 }} activeDot={{ r: 5 }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Right column: Notifications above Recent Pulse */}
                <div className="flex flex-col gap-8">

                    {/* Notifications — pending work that needs a look, replaces the old blocking banner */}
                    <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-8">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-slate-800 text-lg font-serif italic">Notifications</h3>
                            {!loading && (overview?.notifications || []).length > 0 && (
                                <span className="text-[9px] font-black uppercase tracking-widest bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full">
                                    {overview.notifications.length} Pending
                                </span>
                            )}
                        </div>

                        <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                            {loading ? (
                                <p className="text-slate-400 text-xs uppercase tracking-widest font-bold">Loading...</p>
                            ) : (overview?.notifications || []).length === 0 ? (
                                <div className="flex items-center gap-3 py-2">
                                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                                    <p className="text-slate-400 text-xs font-bold">All caught up — nothing pending</p>
                                </div>
                            ) : (
                                overview.notifications.map((item) => {
                                    const Icon = NOTIFICATION_ICON[item.type] || Bell;
                                    const tone = NOTIFICATION_TONE[item.severity] || NOTIFICATION_TONE.info;
                                    return (
                                        <Link
                                            key={item.type} to={item.link}
                                            className={`group/notif flex items-start gap-3 border border-slate-100 rounded-xl px-3 py-3 no-underline transition-all ${tone.hover}`}
                                        >
                                            <div className={`p-1.5 rounded-lg shrink-0 ${tone.icon}`}>
                                                <Icon size={14} />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-slate-700 text-xs font-bold leading-tight">{item.title}</p>
                                                <p className="text-slate-400 text-[10px] mt-0.5 truncate" title={item.message}>{item.message}</p>
                                            </div>
                                            <ArrowRight size={12} className={`shrink-0 mt-1 text-slate-300 transition-colors ${tone.arrow}`} />
                                        </Link>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Activity Sidebar */}
                    <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-8 flex-1 flex flex-col">
                        <h3 className="text-slate-800 text-lg font-serif italic mb-6">Recent Pulse</h3>
                        <div className="space-y-5 overflow-y-auto flex-1 pr-1">
                            {loading ? (
                                <p className="text-slate-400 text-xs uppercase tracking-widest font-bold">Loading...</p>
                            ) : (overview?.recentActivity || []).length === 0 ? (
                                <p className="text-slate-400 text-xs uppercase tracking-widest font-bold">No recent activity</p>
                            ) : (
                                overview.recentActivity.map((item) => (
                                    <div key={`${item.type}-${item.timestamp}-${item.title}`} className="flex gap-4 items-start">
                                        <div className={`w-2 h-2 rounded-full mt-1.5 shadow-[0_0_8px_rgba(0,0,0,0.15)] ${ACTIVITY_DOT[item.type] || 'bg-slate-400'}`} />
                                        <div className="min-w-0">
                                            <p className="text-slate-700 text-xs font-bold leading-tight">{item.title}</p>
                                            <p className="text-slate-400 text-[10px] mt-0.5 truncate" title={item.subtitle}>{item.subtitle}</p>
                                            <p className="text-slate-300 text-[9px] uppercase mt-1 font-bold tracking-widest">{timeAgo(item.timestamp)}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="space-y-1.5 mt-6 pt-6 border-t border-slate-100">
                            {QUICK_LINKS.map(({ label, to, icon: Icon }) => (
                                <Link
                                    key={to} to={to}
                                    className="flex items-center justify-between gap-2 py-2.5 px-3 border border-slate-200 rounded-xl text-[9px] text-slate-600 uppercase tracking-wide font-black hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all no-underline group/link"
                                >
                                    <span className="flex items-center gap-2"><Icon size={12} className="shrink-0" /> {label}</span>
                                    <ArrowRight size={10} className="opacity-0 group-hover/link:opacity-100 transition-opacity shrink-0" />
                                </Link>
                            ))}
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
};

export default AdminHome;

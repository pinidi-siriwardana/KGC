import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    DollarSign, Receipt, TrendingUp, TrendingDown, Download,
    BarChart3, Wallet, Trophy, UserCheck, Ban, Heart, UserX, CreditCard,
} from 'lucide-react';
import {
    ResponsiveContainer, AreaChart, Area, BarChart, Bar, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas-pro';
import { apiFetch } from '../../utils/api';
import { todayISO, daysAgoISO } from '../../utils/date';
import SearchInput from '../../components/common/SearchInput';
import FilterSelect from '../../components/common/FilterSelect';

// Fixed hue-per-type mapping (never reassigned by sort order) — matches the
// order already used for the type icons in AdminPayments.jsx.
const PAYMENT_TYPE_COLORS = {
    membership: '#2a78d6',
    booking_fee: '#1baf7a',
    coach_registration: '#eda100',
    other: '#008300',
    cancellation_fee: '#4a3aa7',
    donation: '#e34948',
    tournament_fee: '#e87ba4',
    no_show_fee: '#eb6834',
};

const PAYMENT_TYPE_ICON = {
    membership: Wallet,
    booking_fee: Trophy,
    coach_registration: UserCheck,
    other: Receipt,
    cancellation_fee: Ban,
    donation: Heart,
    tournament_fee: Trophy,
    no_show_fee: UserX,
};

const CHART_INK = { grid: '#e1e0d9', axis: '#c3c2b7', muted: '#898781', primary: '#0b0b0b' };
const TREND_COLOR = '#2a78d6';

const formatLKR = (n) => `LKR ${Number(n || 0).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatPeriodLabel = (period, groupBy) => {
    const d = new Date(period);
    if (groupBy === 'month') return d.toLocaleDateString('en-LK', { month: 'short', year: '2-digit' });
    if (groupBy === 'week') return `Wk ${d.toLocaleDateString('en-LK', { month: 'short', day: 'numeric' })}`;
    return d.toLocaleDateString('en-LK', { month: 'short', day: 'numeric' });
};

const resolveGroupBy = (from, to) => {
    const days = Math.round((new Date(to) - new Date(from)) / 86400000) + 1;
    if (days <= 31) return 'day';
    if (days <= 180) return 'week';
    return 'month';
};

const StatTile = ({ label, value, icon: Icon, trend }) => (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 bg-slate-900/5 rounded-xl">
                <Icon size={18} className="text-slate-700" />
            </div>
            {trend !== undefined && (
                <span className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest ${
                    trend >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}>
                    {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {Math.abs(trend).toFixed(1)}%
                </span>
            )}
        </div>
        <p className="text-slate-400 text-[10px] uppercase tracking-widest font-black mb-1">{label}</p>
        <h3 className="text-slate-900 text-2xl font-bold font-mono">{value}</h3>
    </div>
);

const ChartTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white border border-slate-200 rounded-lg shadow-md px-3 py-2 text-xs">
            <p className="text-slate-400 font-bold uppercase tracking-wide text-[9px] mb-1">{label}</p>
            <p className="text-slate-900 font-bold font-mono">{formatLKR(payload[0].value)}</p>
        </div>
    );
};

const AdminReports = () => {
    const [filters, setFilters] = useState({ from: daysAgoISO(29), to: todayISO(), type: '', search: '' });
    const [summary, setSummary] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const chartsRef = useRef(null);

    const groupBy = useMemo(() => resolveGroupBy(filters.from, filters.to), [filters.from, filters.to]);

    const buildQuery = () => {
        const params = new URLSearchParams();
        if (filters.from) params.append('from', filters.from);
        if (filters.to) params.append('to', filters.to);
        if (filters.type) params.append('type', filters.type);
        if (filters.search) params.append('search', filters.search);
        params.append('groupBy', groupBy);
        return params.toString();
    };

    useEffect(() => {
        setLoading(true);
        const query = buildQuery();
        Promise.all([
            apiFetch(`/api/revenue/summary?${query}`).then((r) => r.json()),
            apiFetch(`/api/revenue/transactions?${query}`).then((r) => r.json()),
        ])
            .then(([summaryData, txData]) => {
                setSummary(summaryData.data || null);
                setTransactions(txData.data || []);
            })
            .finally(() => setLoading(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters]);

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const timeseriesData = useMemo(() => {
        if (!summary?.timeseries) return [];
        return summary.timeseries.map((row) => ({
            period: row.period,
            label: formatPeriodLabel(row.period, summary.range?.groupBy || groupBy),
            total: Number(row.total),
        }));
    }, [summary, groupBy]);

    const byTypeData = useMemo(() => {
        if (!summary?.byType) return [];
        return summary.byType.map((row) => ({
            type: row.payment_type,
            label: row.payment_type.replace(/_/g, ' '),
            total: Number(row.total),
        }));
    }, [summary]);

    const handleDownloadPdf = async () => {
        if (!chartsRef.current) return;
        setExporting(true);
        try {
            const canvas = await html2canvas(chartsRef.current, { scale: 2, backgroundColor: '#ffffff' });
            const imgData = canvas.toDataURL('image/png');

            const doc = new jsPDF({ unit: 'pt', format: 'a4' });
            const pageWidth = doc.internal.pageSize.getWidth();
            const margin = 40;

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(16);
            doc.text('Kandy Garden Club — Revenue Report', margin, 50);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.setTextColor(100);
            const filterSummary = `Range: ${filters.from} to ${filters.to}` +
                (filters.type ? ` · Type: ${filters.type.replace(/_/g, ' ')}` : '') +
                (filters.search ? ` · Search: "${filters.search}"` : '') +
                ` · Generated: ${new Date().toLocaleString('en-LK')}`;
            doc.text(filterSummary, margin, 66);

            doc.setTextColor(20);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
            const kpiY = 92;
            doc.text(`Total Revenue: ${formatLKR(summary?.totalRevenue)}`, margin, kpiY);
            doc.text(`Transactions: ${summary?.transactionCount ?? 0}`, margin, kpiY + 16);
            doc.text(`Average Transaction: ${formatLKR(summary?.averageAmount)}`, margin, kpiY + 32);
            doc.text(`Trend vs Previous Period: ${(summary?.trendPercent ?? 0).toFixed(1)}%`, margin, kpiY + 48);

            const imgWidth = pageWidth - margin * 2;
            const imgHeight = (canvas.height / canvas.width) * imgWidth;
            doc.addImage(imgData, 'PNG', margin, kpiY + 66, imgWidth, imgHeight);

            autoTable(doc, {
                startY: kpiY + 66 + imgHeight + 24,
                margin: { left: margin, right: margin },
                head: [['Date', 'Payer', 'Type', 'Amount', 'Handled By']],
                body: transactions.map((t) => [
                    new Date(t.payment_date).toLocaleDateString('en-LK'),
                    t.payer_name || 'Unknown',
                    t.payment_type.replace(/_/g, ' '),
                    formatLKR(t.amount),
                    t.handled_by_username || '—',
                ]),
                styles: { fontSize: 8, cellPadding: 5 },
                headStyles: { fillColor: [11, 11, 11], textColor: 255 },
                alternateRowStyles: { fillColor: [249, 249, 247] },
            });

            doc.save(`revenue-report-${filters.from}-to-${filters.to}.pdf`);
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-slate-900 text-xl font-serif">Revenue Reports</h1>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Financial performance & analytics</p>
                </div>

                <div className="flex flex-wrap gap-3">
                    <input
                        type="date" name="from" value={filters.from} onChange={handleFilterChange}
                        max={filters.to}
                        className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-4 focus:ring-slate-900/5"
                    />
                    <input
                        type="date" name="to" value={filters.to} onChange={handleFilterChange}
                        min={filters.from} max={todayISO()}
                        className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-4 focus:ring-slate-900/5"
                    />
                    <FilterSelect
                        name="type" value={filters.type} onChange={handleFilterChange}
                        options={[
                            { value: '', label: 'All Types' },
                            { value: 'membership', label: 'Membership' },
                            { value: 'booking_fee', label: 'Booking Fee' },
                            { value: 'coach_registration', label: 'Coach Registration' },
                            { value: 'cancellation_fee', label: 'Cancellation Fee' },
                            { value: 'no_show_fee', label: 'No-Show Fee' },
                            { value: 'donation', label: 'Donation' },
                            { value: 'tournament_fee', label: 'Tournament Fee' },
                            { value: 'other', label: 'Other' },
                        ]}
                    />
                    <SearchInput
                        value={filters.search}
                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                        placeholder="Search payer..."
                    />
                    <button
                        onClick={handleDownloadPdf}
                        disabled={exporting || loading || !summary}
                        className="flex items-center justify-center gap-2 text-[10px] bg-slate-900 text-white font-black px-4 py-2.5 rounded-xl uppercase tracking-widest hover:bg-slate-800 transition-all disabled:opacity-50"
                    >
                        <Download size={14} /> {exporting ? 'Preparing...' : 'Download PDF'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatTile label="Total Revenue" value={formatLKR(summary?.totalRevenue)} icon={DollarSign} trend={summary?.trendPercent} />
                <StatTile label="Transactions" value={summary?.transactionCount ?? 0} icon={Receipt} />
                <StatTile label="Average Transaction" value={formatLKR(summary?.averageAmount)} icon={CreditCard} />
                <StatTile label="Previous Period" value={formatLKR(summary?.previousRevenue)} icon={BarChart3} />
            </div>

            <div ref={chartsRef} className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-white p-2 rounded-2xl">
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
                    <h2 className="text-slate-900 text-xs font-black uppercase tracking-[0.3em] mb-1">Revenue Over Time</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-4">Grouped by {groupBy}</p>
                    <ResponsiveContainer width="100%" height={280}>
                        <AreaChart data={timeseriesData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={TREND_COLOR} stopOpacity={0.25} />
                                    <stop offset="100%" stopColor={TREND_COLOR} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid vertical={false} stroke={CHART_INK.grid} />
                            <XAxis
                                dataKey="label" tick={{ fontSize: 10, fill: CHART_INK.muted }}
                                axisLine={{ stroke: CHART_INK.axis }} tickLine={false}
                            />
                            <YAxis
                                tick={{ fontSize: 10, fill: CHART_INK.muted }} axisLine={false} tickLine={false}
                                tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
                                width={40}
                            />
                            <Tooltip content={<ChartTooltip />} cursor={{ stroke: CHART_INK.axis, strokeWidth: 1 }} />
                            <Area
                                type="monotone" dataKey="total" stroke={TREND_COLOR} strokeWidth={2}
                                fill="url(#revenueFill)" dot={{ r: 3, fill: TREND_COLOR, strokeWidth: 0 }}
                                activeDot={{ r: 5 }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
                    <h2 className="text-slate-900 text-xs font-black uppercase tracking-[0.3em] mb-1">Revenue By Type</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-4">Breakdown for selected range</p>
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={byTypeData} layout="vertical" margin={{ top: 8, right: 24, left: 0, bottom: 0 }}>
                            <CartesianGrid horizontal={false} stroke={CHART_INK.grid} />
                            <XAxis
                                type="number" tick={{ fontSize: 10, fill: CHART_INK.muted }}
                                axisLine={false} tickLine={false}
                                tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
                            />
                            <YAxis
                                type="category" dataKey="label" tick={{ fontSize: 10, fill: CHART_INK.muted }}
                                axisLine={false} tickLine={false} width={110}
                            />
                            <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
                            <Bar dataKey="total" radius={[0, 4, 4, 0]} maxBarSize={22}>
                                {byTypeData.map((entry) => (
                                    <Cell key={entry.type} fill={PAYMENT_TYPE_COLORS[entry.type] || CHART_INK.axis} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                    <h2 className="text-slate-900 text-xs font-black uppercase tracking-[0.3em]">Transactions</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{transactions.length} completed payment{transactions.length === 1 ? '' : 's'} in range</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-slate-400 text-[9px] uppercase tracking-widest bg-slate-50/50">
                                <th className="p-4 font-black">Payer</th>
                                <th className="p-4 font-black">Type</th>
                                <th className="p-4 font-black">Amount</th>
                                <th className="p-4 font-black">Date</th>
                                <th className="p-4 font-black">Handled By</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {transactions.map((t) => {
                                const Icon = PAYMENT_TYPE_ICON[t.payment_type] || Receipt;
                                return (
                                    <tr key={t.payment_id} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                                                    <Icon size={16} />
                                                </div>
                                                <p className="text-slate-900 text-sm font-bold">{t.payer_name || 'Unknown'}</p>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-[9px] font-black uppercase px-2 py-1 rounded-md border bg-slate-50 text-slate-600 border-slate-100">
                                                {t.payment_type.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <p className="text-slate-900 text-sm font-bold font-mono">{formatLKR(t.amount)}</p>
                                        </td>
                                        <td className="p-4">
                                            <p className="text-[11px] text-slate-600 font-medium">{new Date(t.payment_date).toLocaleString()}</p>
                                        </td>
                                        <td className="p-4">
                                            <p className="text-[11px] text-slate-500 font-medium">{t.handled_by_username || '—'}</p>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {!loading && transactions.length === 0 && (
                        <div className="p-16 text-center">
                            <Receipt className="mx-auto text-slate-300 mb-3" size={28} />
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">No revenue in this range</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminReports;

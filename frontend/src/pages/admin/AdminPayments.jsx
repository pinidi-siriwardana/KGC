import React, { useState, useEffect } from 'react';
import { Wallet, Search, Filter, Trophy, CreditCard } from 'lucide-react';
import { apiFetch } from '../../utils/api';

const AdminPayments = () => {
    const [payments, setPayments] = useState([]);
    const [filters, setFilters] = useState({ type: '', date: '', search: '' });
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchPayments(); }, [filters]);

    const fetchPayments = async () => {
        const params = new URLSearchParams();
        if (filters.type) params.append('type', filters.type);
        if (filters.date) params.append('date', filters.date);
        if (filters.search) params.append('search', filters.search);

        const res = await apiFetch(`/api/payments?${params.toString()}`);
        const data = await res.json();
        setPayments(data.data || []);
        setLoading(false);
    };

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    return (
        <div className="p-6 space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-50/50">
                    <div>
                        <h2 className="text-slate-900 text-xs font-black uppercase tracking-[0.3em]">Payment History</h2>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Full Revenue Ledger</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <select
                                name="type"
                                value={filters.type}
                                onChange={handleFilterChange}
                                className="pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-wide outline-none focus:ring-4 focus:ring-slate-900/5 appearance-none cursor-pointer"
                            >
                                <option value="">All Types</option>
                                <option value="membership">Membership</option>
                                <option value="booking_fee">Booking Fee</option>
                            </select>
                        </div>

                        <input
                            type="date"
                            name="date"
                            value={filters.date}
                            onChange={handleFilterChange}
                            className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-4 focus:ring-slate-900/5"
                        />

                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <input
                                type="text"
                                name="search"
                                placeholder="Search by name..."
                                value={filters.search}
                                onChange={handleFilterChange}
                                className="pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-4 focus:ring-slate-900/5 w-48"
                            />
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-slate-400 text-[9px] uppercase tracking-widest bg-slate-50/50">
                                <th className="p-4 font-black">Payer</th>
                                <th className="p-4 font-black">Type</th>
                                <th className="p-4 font-black">Amount</th>
                                <th className="p-4 font-black">Date</th>
                                <th className="p-4 font-black">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {payments.map((p) => (
                                <tr key={p.payment_id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                                                {p.payment_type === 'membership' ? <Wallet size={16} /> : <Trophy size={16} />}
                                            </div>
                                            <p className="text-slate-900 text-sm font-bold">{p.payer_name || 'Unknown'}</p>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className="text-[9px] font-black uppercase px-2 py-1 rounded-md border bg-slate-50 text-slate-600 border-slate-100">
                                            {p.payment_type.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <p className="text-slate-900 text-sm font-bold font-mono">LKR {p.amount}</p>
                                    </td>
                                    <td className="p-4">
                                        <p className="text-[11px] text-slate-600 font-medium">{new Date(p.payment_date).toLocaleString()}</p>
                                    </td>
                                    <td className="p-4">
                                        <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-full border ${
                                            p.status === 'completed' ? 'text-emerald-600 bg-emerald-50 border-emerald-100' :
                                            p.status === 'refunded' ? 'text-rose-600 bg-rose-50 border-rose-100' :
                                            'text-amber-600 bg-amber-50 border-amber-100'
                                        }`}>
                                            {p.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {!loading && payments.length === 0 && (
                        <div className="p-16 text-center">
                            <CreditCard className="mx-auto text-slate-300 mb-3" size={28} />
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">No payments match these filters</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminPayments;

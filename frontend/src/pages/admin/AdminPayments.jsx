import React, { useState, useEffect } from 'react';
import { Wallet, Search, Filter, Trophy, CreditCard, UserCheck, Receipt, Plus, Pencil, ShieldCheck, Ban, CircleCheck, CircleSlash, Heart, Landmark, UserX } from 'lucide-react';
import { apiFetch } from '../../utils/api';
import { todayISO } from '../../utils/date';
import Modal from '../../components/common/Modal';

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

const emptyFormData = () => ({
    purpose: 'new_member',
    amount: '',
    payment_date: todayISO(),
    notes: '',
    username: '', password: '', full_name: '', email: '', phone: '',
    membership_type_id: '', start_date: todayISO(),
    specialization: '', experience_years: 0,
    member_id: '',
});

const AdminPayments = () => {
    const [payments, setPayments] = useState([]);
    const [filters, setFilters] = useState({ type: '', date: '', search: '' });
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState(emptyFormData);
    const [membershipTypes, setMembershipTypes] = useState([]);
    const [members, setMembers] = useState([]);
    const [editingPayment, setEditingPayment] = useState(null);
    const [editForm, setEditForm] = useState({ amount: '', payment_date: '', notes: '', status: 'completed' });
    const [settings, setSettings] = useState(null);
    const [editingSettings, setEditingSettings] = useState(false);
    const [settingsForm, setSettingsForm] = useState({});
    const [savingSettings, setSavingSettings] = useState(false);

    const buildPaymentsQuery = () => {
        const params = new URLSearchParams();
        if (filters.type) params.append('type', filters.type);
        if (filters.date) params.append('date', filters.date);
        if (filters.search) params.append('search', filters.search);
        return params.toString();
    };

    const fetchPayments = async () => {
        const res = await apiFetch(`/api/payments?${buildPaymentsQuery()}`);
        const data = await res.json();
        setPayments(data.data || []);
        setLoading(false);
    };

    useEffect(() => {
        apiFetch(`/api/payments?${buildPaymentsQuery()}`)
            .then((res) => res.json())
            .then((data) => setPayments(data.data || []))
            .finally(() => setLoading(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters]);

    useEffect(() => {
        apiFetch('/api/membership-types').then((res) => res.json()).then((data) => setMembershipTypes(data.data || []));
        apiFetch('/api/members').then((res) => res.json()).then((data) => setMembers(data.data || []));
        apiFetch('/api/settings').then((res) => res.json()).then((data) => setSettings(data.data || null));
    }, []);

    const handleEditSettings = () => {
        setSettingsForm({
            bank_name: settings?.bank_name || '',
            account_name: settings?.account_name || '',
            account_number: settings?.account_number || '',
            branch: settings?.branch || '',
            payment_instructions: settings?.payment_instructions || '',
            guest_booking_fee: settings?.guest_booking_fee || '',
            no_show_fee: settings?.no_show_fee || '',
        });
        setEditingSettings(true);
    };

    const handleSaveSettings = async () => {
        setSavingSettings(true);
        const res = await apiFetch('/api/settings', {
            method: 'PATCH',
            body: JSON.stringify(settingsForm),
        });
        setSavingSettings(false);
        if (res.ok) {
            setSettings({ ...settings, ...settingsForm });
            setEditingSettings(false);
        } else {
            const err = await res.json();
            alert(err.message || 'Failed to update payment details.');
        }
    };

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const handleOpenModal = () => {
        setFormData(emptyFormData());
        setIsModalOpen(true);
    };

    const handlePlanChange = (e) => {
        const membership_type_id = e.target.value;
        const plan = membershipTypes.find((t) => String(t.membership_type_id) === membership_type_id);
        setFormData({ ...formData, membership_type_id, amount: plan ? plan.price : formData.amount });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const res = await apiFetch('/api/payments/manual', {
            method: 'POST',
            body: JSON.stringify(formData),
        });

        if (res.ok) {
            setIsModalOpen(false);
            fetchPayments();
        } else {
            const err = await res.json();
            alert(err.message || 'Failed to record payment.');
        }
    };

    const handleOpenEdit = (payment) => {
        setEditingPayment(payment);
        setEditForm({
            amount: payment.amount,
            // payment_date already arrives as "YYYY-MM-DD HH:MM:SS" (the
            // backend's dateStrings:true) — slicing it directly avoids
            // round-tripping through Date/toISOString, which would silently
            // shift the date by the browser's UTC offset.
            payment_date: payment.payment_date.slice(0, 10),
            notes: payment.notes || '',
            status: payment.status,
        });
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        const res = await apiFetch(`/api/payments/update/${editingPayment.payment_id}`, {
            method: 'PATCH',
            body: JSON.stringify(editForm),
        });

        if (res.ok) {
            setEditingPayment(null);
            fetchPayments();
        } else {
            const err = await res.json();
            alert(err.message || 'Failed to update payment.');
        }
    };

    const handleQuickStatus = async (payment, status) => {
        if (status === 'waived' && !window.confirm('Waive this fee? The member/coach will no longer owe this amount.')) return;

        const res = await apiFetch(`/api/payments/update/${payment.payment_id}`, {
            method: 'PATCH',
            body: JSON.stringify({ status }),
        });

        if (res.ok) {
            fetchPayments();
        } else {
            const err = await res.json();
            alert(err.message || 'Failed to update payment.');
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Landmark size={16} className="text-slate-400" />
                        <h2 className="text-slate-900 text-xs font-black uppercase tracking-[0.3em]">Club Payment Details</h2>
                    </div>
                    {!editingSettings && (
                        <button onClick={handleEditSettings} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                            <Pencil size={14} />
                        </button>
                    )}
                </div>

                {editingSettings ? (
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-[9px] font-black uppercase text-slate-400">Bank Name</label>
                                <input type="text" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                                    value={settingsForm.bank_name} onChange={(e) => setSettingsForm({ ...settingsForm, bank_name: e.target.value })} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-black uppercase text-slate-400">Account Name</label>
                                <input type="text" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                                    value={settingsForm.account_name} onChange={(e) => setSettingsForm({ ...settingsForm, account_name: e.target.value })} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-black uppercase text-slate-400">Account Number</label>
                                <input type="text" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                                    value={settingsForm.account_number} onChange={(e) => setSettingsForm({ ...settingsForm, account_number: e.target.value })} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-black uppercase text-slate-400">Branch</label>
                                <input type="text" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                                    value={settingsForm.branch} onChange={(e) => setSettingsForm({ ...settingsForm, branch: e.target.value })} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-black uppercase text-slate-400">Guest Booking Fee (LKR)</label>
                                <input type="number" step="0.01" min="0" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                                    value={settingsForm.guest_booking_fee} onChange={(e) => setSettingsForm({ ...settingsForm, guest_booking_fee: e.target.value })} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-black uppercase text-slate-400">No-Show Fee (LKR)</label>
                                <input type="number" step="0.01" min="0" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                                    value={settingsForm.no_show_fee} onChange={(e) => setSettingsForm({ ...settingsForm, no_show_fee: e.target.value })} />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-slate-400">Instructions shown to members</label>
                            <textarea rows={2} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                                value={settingsForm.payment_instructions} onChange={(e) => setSettingsForm({ ...settingsForm, payment_instructions: e.target.value })} />
                        </div>
                        <div className="flex gap-2">
                            <button onClick={handleSaveSettings} disabled={savingSettings}
                                className="text-[9px] font-black uppercase tracking-widest bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-all disabled:opacity-50">
                                {savingSettings ? 'Saving...' : 'Save'}
                            </button>
                            <button onClick={() => setEditingSettings(false)} className="text-[9px] font-black uppercase tracking-widest text-slate-500 px-4 py-2">
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                            <p className="text-[9px] font-black uppercase text-slate-400">Bank</p>
                            <p className="text-slate-900 font-bold">{settings?.bank_name || '—'}</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-black uppercase text-slate-400">Account Name</p>
                            <p className="text-slate-900 font-bold">{settings?.account_name || '—'}</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-black uppercase text-slate-400">Account Number</p>
                            <p className="text-slate-900 font-bold font-mono">{settings?.account_number || '—'}</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-black uppercase text-slate-400">Branch</p>
                            <p className="text-slate-900 font-bold">{settings?.branch || '—'}</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-black uppercase text-slate-400">Guest Booking Fee</p>
                            <p className="text-slate-900 font-bold font-mono">LKR {settings?.guest_booking_fee || '—'}</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-black uppercase text-slate-400">No-Show Fee</p>
                            <p className="text-slate-900 font-bold font-mono">LKR {settings?.no_show_fee || '—'}</p>
                        </div>
                    </div>
                )}
            </div>

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
                                <option value="coach_registration">Coach Registration</option>
                                <option value="cancellation_fee">Cancellation Fee</option>
                                <option value="no_show_fee">No-Show Fee</option>
                                <option value="donation">Donation</option>
                                <option value="tournament_fee">Tournament Fee</option>
                                <option value="other">Other</option>
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

                        <button
                            onClick={handleOpenModal}
                            className="flex items-center justify-center gap-2 text-[10px] bg-slate-900 text-white font-black px-4 py-2.5 rounded-xl uppercase tracking-widest hover:bg-slate-800 transition-all"
                        >
                            <Plus size={14} /> Add Payment
                        </button>
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
                                <th className="p-4 font-black">Recorded By</th>
                                <th className="p-4 font-black text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {payments.map((p) => {
                                const Icon = PAYMENT_TYPE_ICON[p.payment_type] || CreditCard;
                                return (
                                    <tr key={p.payment_id} className="hover:bg-slate-50 group transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                                                    <Icon size={16} />
                                                </div>
                                                <p className="text-slate-900 text-sm font-bold">{p.payer_name || 'Unknown'}</p>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-[9px] font-black uppercase px-2 py-1 rounded-md border bg-slate-50 text-slate-600 border-slate-100">
                                                {p.payment_type.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <p className="text-slate-900 text-sm font-bold font-mono">LKR {p.amount}</p>
                                        </td>
                                        <td className="p-4">
                                            <p className="text-[11px] text-slate-600 font-medium">{new Date(p.payment_date).toLocaleString()}</p>
                                            {p.notes && (
                                                <p className="text-[10px] text-slate-400 mt-0.5 max-w-[200px] truncate" title={p.notes}>{p.notes}</p>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-full border ${
                                                p.status === 'completed' ? 'text-emerald-600 bg-emerald-50 border-emerald-100' :
                                                p.status === 'refunded' ? 'text-rose-600 bg-rose-50 border-rose-100' :
                                                p.status === 'waived' ? 'text-slate-500 bg-slate-100 border-slate-200' :
                                                'text-amber-600 bg-amber-50 border-amber-100'
                                            }`}>
                                                {p.status}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-medium">
                                                <ShieldCheck size={12} className="text-slate-400" />
                                                {p.handled_by_username || '—'}
                                            </div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                {p.status === 'recorded' && (
                                                    <>
                                                        <button onClick={() => handleQuickStatus(p, 'completed')} title="Mark as Paid"
                                                            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg">
                                                            <CircleCheck size={14} />
                                                        </button>
                                                        <button onClick={() => handleQuickStatus(p, 'waived')} title="Waive Fee"
                                                            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg">
                                                            <CircleSlash size={14} />
                                                        </button>
                                                    </>
                                                )}
                                                <button onClick={() => handleOpenEdit(p)} title="Edit"
                                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                                                    <Pencil size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
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

            <Modal
                isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}
                title="Add Payment"
                submitText="Record Payment"
                onSubmit={handleSubmit}
            >
                <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400">Purpose</label>
                    <select className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                        value={formData.purpose} onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}>
                        <option value="new_member">New Member Registration</option>
                        <option value="assign_plan">Assign Membership Plan (Existing Member)</option>
                        <option value="new_coach">New Coach Registration</option>
                        <option value="misc">Miscellaneous</option>
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-slate-400">Amount (LKR)</label>
                        <input type="number" step="0.01" min="0.01" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                            value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} required />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-slate-400">Payment Date</label>
                        <input type="date" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                            value={formData.payment_date} onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })} required />
                    </div>
                </div>

                {formData.purpose === 'new_member' && (
                    <>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[9px] font-black uppercase text-slate-400">Username</label>
                                <input type="text" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                                    value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} required />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-black uppercase text-slate-400">Password</label>
                                <input type="password" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                                    value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-slate-400">Full Name</label>
                            <input type="text" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                                value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[9px] font-black uppercase text-slate-400">Email</label>
                                <input type="email" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                                    value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-black uppercase text-slate-400">Phone</label>
                                <input type="tel" placeholder="07XXXXXXXX or +947XXXXXXXX" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                                    value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[9px] font-black uppercase text-slate-400">Membership Plan</label>
                                <select className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                                    value={formData.membership_type_id} onChange={handlePlanChange} required>
                                    <option value="" disabled>Select a plan...</option>
                                    {membershipTypes.map((t) => (
                                        <option key={t.membership_type_id} value={t.membership_type_id}>
                                            {t.name} — LKR {t.price} / {t.duration_months}mo
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-black uppercase text-slate-400">Start Date</label>
                                <input type="date" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                                    value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} required />
                            </div>
                        </div>
                    </>
                )}

                {formData.purpose === 'assign_plan' && (
                    <>
                        <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-slate-400">Member</label>
                            <select className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                                value={formData.member_id} onChange={(e) => setFormData({ ...formData, member_id: e.target.value })} required>
                                <option value="" disabled>Select a member...</option>
                                {members.map((m) => (
                                    <option key={m.member_id} value={m.member_id}>{m.full_name} — {m.email}</option>
                                ))}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[9px] font-black uppercase text-slate-400">Membership Plan</label>
                                <select className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                                    value={formData.membership_type_id} onChange={handlePlanChange} required>
                                    <option value="" disabled>Select a plan...</option>
                                    {membershipTypes.map((t) => (
                                        <option key={t.membership_type_id} value={t.membership_type_id}>
                                            {t.name} — LKR {t.price} / {t.duration_months}mo
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-black uppercase text-slate-400">Start Date</label>
                                <input type="date" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                                    value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} required />
                            </div>
                        </div>
                    </>
                )}

                {formData.purpose === 'new_coach' && (
                    <>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[9px] font-black uppercase text-slate-400">Username</label>
                                <input type="text" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                                    value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} required />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-black uppercase text-slate-400">Password</label>
                                <input type="password" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                                    value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-slate-400">Full Name</label>
                            <input type="text" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                                value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[9px] font-black uppercase text-slate-400">Email</label>
                                <input type="email" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                                    value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-black uppercase text-slate-400">Phone</label>
                                <input type="tel" placeholder="07XXXXXXXX or +947XXXXXXXX" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                                    value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[9px] font-black uppercase text-slate-400">Specialization</label>
                                <input type="text" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                                    value={formData.specialization} onChange={(e) => setFormData({ ...formData, specialization: e.target.value })} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-black uppercase text-slate-400">Experience (Years)</label>
                                <input type="number" min="0" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                                    value={formData.experience_years} onChange={(e) => setFormData({ ...formData, experience_years: parseInt(e.target.value) || 0 })} />
                            </div>
                        </div>
                    </>
                )}

                {formData.purpose === 'misc' && (
                    <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-slate-400">Link to Member (optional)</label>
                        <select className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                            value={formData.member_id} onChange={(e) => setFormData({ ...formData, member_id: e.target.value })}>
                            <option value="">No member (unlinked)</option>
                            {members.map((m) => (
                                <option key={m.member_id} value={m.member_id}>{m.full_name} — {m.email}</option>
                            ))}
                        </select>
                    </div>
                )}

                <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400">Notes (optional)</label>
                    <textarea className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none" rows={2}
                        value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
                </div>
            </Modal>

            <Modal
                isOpen={!!editingPayment} onClose={() => setEditingPayment(null)}
                title="Edit Payment"
                submitText="Save Changes"
                onSubmit={handleEditSubmit}
            >
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-slate-400">Amount (LKR)</label>
                        <input type="number" step="0.01" min="0.01" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                            value={editForm.amount} onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })} required />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-slate-400">Payment Date</label>
                        <input type="date" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                            value={editForm.payment_date} onChange={(e) => setEditForm({ ...editForm, payment_date: e.target.value })} required />
                    </div>
                </div>
                <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400">Status</label>
                    <select className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                        value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                        <option value="completed">Completed</option>
                        <option value="recorded">Recorded</option>
                        <option value="failed">Failed</option>
                        <option value="refunded">Refunded</option>
                        <option value="waived">Waived</option>
                    </select>
                </div>
                <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400">Notes</label>
                    <textarea className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none" rows={2}
                        value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} />
                </div>
            </Modal>
        </div>
    );
};

export default AdminPayments;

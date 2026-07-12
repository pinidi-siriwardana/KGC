import React, { useState, useEffect } from 'react';
import { Plus, Wallet, Trophy, UserCheck, Receipt, Ban, Heart, FileUp, CheckCircle2, ExternalLink } from 'lucide-react';
import { apiFetch, API_URL } from '../../utils/api';
import Modal from '../../components/common/Modal';

const PAYMENT_TYPE_ICON = {
    membership: Wallet,
    booking_fee: Trophy,
    coach_registration: UserCheck,
    other: Receipt,
    cancellation_fee: Ban,
    donation: Heart,
    tournament_fee: Trophy,
};

const STATUS_STYLE = {
    completed: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    approved: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    pending: 'text-amber-600 bg-amber-50 border-amber-100',
    recorded: 'text-amber-600 bg-amber-50 border-amber-100',
    rejected: 'text-red-600 bg-red-50 border-red-100',
    failed: 'text-red-600 bg-red-50 border-red-100',
    refunded: 'text-rose-600 bg-rose-50 border-rose-100',
    waived: 'text-slate-500 bg-slate-100 border-slate-200',
};

const emptyFormData = () => ({
    payment_type: 'donation',
    amount_declared: '',
    note: '',
});

const CoachPayments = () => {
    const [payments, setPayments] = useState([]);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [step, setStep] = useState('instructions');
    const [formData, setFormData] = useState(emptyFormData);
    const [receiptFile, setReceiptFile] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [payingFee, setPayingFee] = useState(null);

    const fetchHistory = () => {
        apiFetch('/api/coach/payments')
            .then((res) => res.json())
            .then((data) => {
                setPayments(data.payments || []);
                setRequests(data.requests || []);
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchHistory(); }, []);

    const handleOpenModal = () => {
        setStep('instructions');
        setFormData(emptyFormData());
        setReceiptFile(null);
        setError('');
        setPayingFee(null);
        apiFetch('/api/settings').then((res) => res.json()).then((data) => setSettings(data.data || null));
        setIsModalOpen(true);
    };

    const handlePayNow = (payment) => {
        setStep('instructions');
        setReceiptFile(null);
        setFormData(emptyFormData());
        setError('');
        setPayingFee(payment);
        apiFetch('/api/settings').then((res) => res.json()).then((data) => setSettings(data.data || null));
        setIsModalOpen(true);
    };

    const handleModalSubmit = async (e) => {
        e.preventDefault();

        if (step === 'instructions') {
            setStep('form');
            return;
        }

        if (!receiptFile) {
            setError('Please attach your payment slip.');
            return;
        }

        setSubmitting(true);
        setError('');

        let res;
        if (payingFee) {
            const body = new FormData();
            if (formData.note) body.append('note', formData.note);
            body.append('receipt', receiptFile);
            res = await apiFetch(`/api/coach/payments/${payingFee.payment_id}/pay`, { method: 'POST', body });
        } else {
            const body = new FormData();
            body.append('payment_type', formData.payment_type);
            body.append('amount_declared', formData.amount_declared);
            if (formData.note) body.append('note', formData.note);
            body.append('receipt', receiptFile);
            res = await apiFetch('/api/coach/payments', { method: 'POST', body });
        }

        setSubmitting(false);

        if (res.ok) {
            setIsModalOpen(false);
            setSuccess('Payment submitted for review. An admin will verify your receipt shortly.');
            fetchHistory();
            setTimeout(() => setSuccess(''), 5000);
        } else {
            const err = await res.json();
            setError(err.message || 'Failed to submit payment.');
        }
    };

    return (
        <div className="relative space-y-8 animate-in fade-in duration-700">
            <header className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-slate-900 text-4xl font-serif italic">My Payments.</h1>
                    <p className="text-emerald-600 text-[10px] font-black uppercase tracking-[0.3em] mt-2">Your Money Flow With The Club</p>
                </div>
                <button
                    onClick={handleOpenModal}
                    className="flex items-center gap-2 bg-amber-500 px-6 py-3 rounded-xl text-slate-950 font-black uppercase tracking-widest text-[10px] hover:bg-slate-900 hover:text-white transition-all shadow-lg shadow-amber-500/20"
                >
                    <Plus size={16} /> Make a Payment
                </button>
            </header>

            {success && (
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold px-4 py-3 rounded-xl">
                    <CheckCircle2 size={16} /> {success}
                </div>
            )}

            <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-8">
                <h3 className="text-slate-800 text-lg font-serif italic mb-6">Payment History</h3>
                {loading && (
                    <p className="text-slate-400 text-[10px] uppercase tracking-widest font-black py-6 text-center">Loading...</p>
                )}
                {!loading && payments.length === 0 && (
                    <p className="text-slate-400 text-[10px] uppercase tracking-widest font-black py-6 text-center">No payments recorded yet.</p>
                )}
                {payments.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-slate-400 text-[9px] uppercase tracking-widest bg-slate-50/50">
                                    <th className="p-4 font-black">Type</th>
                                    <th className="p-4 font-black">Amount</th>
                                    <th className="p-4 font-black">Date</th>
                                    <th className="p-4 font-black">Status</th>
                                    <th className="p-4 font-black text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {payments.map((p) => {
                                    const Icon = PAYMENT_TYPE_ICON[p.payment_type] || Receipt;
                                    return (
                                        <tr key={p.payment_id} className="hover:bg-slate-50 transition-colors">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                                                        <Icon size={16} />
                                                    </div>
                                                    <span className="text-slate-900 text-sm font-bold capitalize">{p.payment_type.replace('_', ' ')}</span>
                                                </div>
                                                {p.notes && <p className="text-[10px] text-slate-400 mt-1 ml-11">{p.notes}</p>}
                                            </td>
                                            <td className="p-4 text-slate-900 text-sm font-bold font-mono">LKR {p.amount}</td>
                                            <td className="p-4 text-[11px] text-slate-600 font-medium">{new Date(p.payment_date).toLocaleDateString()}</td>
                                            <td className="p-4">
                                                <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-full border ${STATUS_STYLE[p.status] || STATUS_STYLE.pending}`}>
                                                    {p.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                {p.status === 'recorded' && (
                                                    <button onClick={() => handlePayNow(p)}
                                                        className="text-[9px] font-black uppercase tracking-widest bg-slate-900 text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-all">
                                                        Pay Now
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-8">
                <h3 className="text-slate-800 text-lg font-serif italic mb-6">My Submissions</h3>
                {!loading && requests.length === 0 && (
                    <p className="text-slate-400 text-[10px] uppercase tracking-widest font-black py-6 text-center">No payment submissions yet.</p>
                )}
                {requests.length > 0 && (
                    <div className="space-y-4">
                        {requests.map((r) => (
                            <div key={r.verification_id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                                <div>
                                    <p className="text-slate-900 text-sm font-bold capitalize">{r.payment_type.replace('_', ' ')}</p>
                                    <p className="text-slate-500 text-[10px] uppercase">
                                        LKR {r.amount_declared} • Submitted {new Date(r.submitted_at).toLocaleDateString()}
                                    </p>
                                    {r.note && <p className="text-slate-400 text-[10px] mt-1 italic">{r.note}</p>}
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-full border ${STATUS_STYLE[r.status] || STATUS_STYLE.pending}`}>
                                        {r.status}
                                    </span>
                                    <a href={`${API_URL}${r.receipt_file_url}`} target="_blank" rel="noreferrer"
                                        className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors" title="View receipt">
                                        <ExternalLink size={14} />
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <Modal
                isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}
                title={step === 'instructions' ? 'Payment Instructions' : payingFee ? 'Pay Outstanding Fee' : 'Submit Payment'}
                submitText={submitting ? 'Submitting...' : step === 'instructions' ? 'Continue' : 'Submit Payment'}
                onSubmit={handleModalSubmit}
            >
                {step === 'instructions' && (
                    <div className="space-y-4">
                        <p className="text-slate-600 text-sm leading-relaxed">
                            {settings?.payment_instructions || 'Loading instructions...'}
                        </p>
                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-1">
                            <p className="text-[9px] font-black uppercase text-slate-400">Bank</p>
                            <p className="text-slate-900 text-sm font-bold">{settings?.bank_name}</p>
                            <p className="text-[9px] font-black uppercase text-slate-400 pt-2">Account Name</p>
                            <p className="text-slate-900 text-sm font-bold">{settings?.account_name}</p>
                            <p className="text-[9px] font-black uppercase text-slate-400 pt-2">Account Number</p>
                            <p className="text-slate-900 text-sm font-bold font-mono">{settings?.account_number}</p>
                            <p className="text-[9px] font-black uppercase text-slate-400 pt-2">Branch</p>
                            <p className="text-slate-900 text-sm font-bold">{settings?.branch}</p>
                        </div>
                    </div>
                )}

                {step === 'form' && (
                    <div className="space-y-4">
                        {payingFee ? (
                            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                                <p className="text-[9px] font-black uppercase text-slate-400">Settling</p>
                                <p className="text-slate-900 text-sm font-bold capitalize">{payingFee.payment_type.replace('_', ' ')}</p>
                                <p className="text-slate-900 text-lg font-bold font-mono mt-1">LKR {payingFee.amount}</p>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black uppercase text-slate-400">Purpose</label>
                                    <select className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                                        value={formData.payment_type} onChange={(e) => setFormData({ ...formData, payment_type: e.target.value })}>
                                        <option value="donation">Donation</option>
                                        <option value="tournament_fee">Tournament Fee</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black uppercase text-slate-400">Amount (LKR)</label>
                                    <input type="number" step="0.01" min="0.01" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                                        value={formData.amount_declared} onChange={(e) => setFormData({ ...formData, amount_declared: e.target.value })} required />
                                </div>
                            </>
                        )}

                        <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-slate-400">Note (optional)</label>
                            <input type="text" placeholder="e.g. Summer Open 2026"
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                                value={formData.note} onChange={(e) => setFormData({ ...formData, note: e.target.value })} />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-slate-400">Payment Slip</label>
                            <label className={`flex items-center gap-3 px-4 py-3 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                                receiptFile ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200 hover:border-emerald-300'
                            }`}>
                                <input type="file" accept="image/*,.pdf" className="hidden"
                                    onChange={(e) => setReceiptFile(e.target.files[0])} />
                                {receiptFile ? <CheckCircle2 className="text-emerald-600" size={18} /> : <FileUp className="text-slate-400" size={18} />}
                                <span className="text-slate-600 text-xs font-bold">{receiptFile ? receiptFile.name : 'Upload JPG, PNG or PDF (Max 5MB)'}</span>
                            </label>
                        </div>

                        {error && <p className="text-red-500 text-[11px] font-bold">{error}</p>}
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default CoachPayments;

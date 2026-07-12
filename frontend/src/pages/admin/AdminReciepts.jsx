import React, { useState, useEffect } from 'react';
import { Check, X, Eye, AlertCircle, Pencil, RotateCcw, ExternalLink } from 'lucide-react';
import { apiFetch, API_URL } from '../../utils/api';
import Modal from '../../components/common/Modal';

const ReceiptReview = () => {
    const [slips, setSlips] = useState([]);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingEntry, setEditingEntry] = useState(null);
    const [editForm, setEditForm] = useState({ remarks: '', amount_declared: '' });

    const fetchSlips = async () => {
        const res = await apiFetch('/api/payments/pending');
        const data = await res.json();
        setSlips(data);
        setLoading(false);
    };

    const fetchHistory = async () => {
        const res = await apiFetch('/api/payments/history');
        const data = await res.json();
        setHistory(data);
    };

    useEffect(() => {
        apiFetch('/api/payments/pending').then((res) => res.json()).then((data) => { setSlips(data); setLoading(false); });
        apiFetch('/api/payments/history').then((res) => res.json()).then((data) => setHistory(data));
    }, []);

    const handleApproval = async (id, status) => {
        const endpoint = status === 'approved' ? 'approve' : 'reject';
        const remarks = status === 'approved' ? 'Verified via Bank Portal' : 'Rejected after manual review';
        const res = await apiFetch(`/api/payments/${endpoint}/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ remarks })
        });

        if (res.ok) {
            fetchSlips();
            fetchHistory();
        } else {
            const err = await res.json();
            alert(err.message || 'Action failed.');
        }
    };

    const handleOpenEdit = (entry) => {
        setEditingEntry(entry);
        setEditForm({ remarks: entry.remarks || '', amount_declared: entry.amount_declared });
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        const res = await apiFetch(`/api/payments/edit/${editingEntry.verification_id}`, {
            method: 'PATCH',
            body: JSON.stringify(editForm)
        });

        if (res.ok) {
            setEditingEntry(null);
            fetchHistory();
        } else {
            const err = await res.json();
            alert(err.message || 'Failed to save changes.');
        }
    };

    const handleUndo = async (entry) => {
        const warning = entry.status === 'approved'
            ? `Undo this approval? This will DELETE the member account that was created for ${entry.full_name || 'this applicant'} and move the request back to pending.`
            : `Undo this rejection and move ${entry.full_name || 'this applicant'}'s request back to pending?`;

        if (!window.confirm(warning)) return;

        const res = await apiFetch(`/api/payments/undo/${entry.verification_id}`, { method: 'PATCH' });

        if (res.ok) {
            fetchSlips();
            fetchHistory();
        } else {
            const err = await res.json();
            alert(err.message || 'Failed to undo.');
        }
    };

    return (
        <div className="p-8 bg-slate-950 min-h-screen text-slate-200">
            <header className="mb-10 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter text-white">Receipt Audit</h1>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-2">Financial Verification Desk</p>
                </div>
                <div className="flex gap-4">
                   <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                        <AlertCircle size={20}/>
                   </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {slips.map((slip) => (
                    <div key={slip.verification_id} className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden flex flex-col md:flex-row shadow-2xl">
                        {/* Image Section */}
                        <div
                            className="md:w-1/3 h-48 md:h-auto bg-slate-800 relative group cursor-pointer"
                            onClick={() => window.open(`${API_URL}${slip.receipt_file_url}`, '_blank')}
                            title="Open full-size slip"
                        >
                            <img src={`${API_URL}${slip.receipt_file_url}`} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" alt="receipt"/>
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Eye className="text-white" size={24}/>
                            </div>
                        </div>

                        {/* Content Section */}
                        <div className="p-6 flex-1 flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-start">
                                    <span className="px-2 py-1 rounded bg-slate-800 text-[9px] font-black uppercase tracking-widest text-slate-400">{slip.payment_type}</span>
                                    <p className="text-emerald-400 font-mono font-bold">LKR {slip.amount_declared}</p>
                                </div>
                                {slip.settles_payment_id && (
                                    <span className="inline-block mt-3 px-2 py-1 rounded bg-amber-500/10 text-amber-400 text-[9px] font-black uppercase tracking-widest border border-amber-500/20">
                                        Settling outstanding fee #{slip.settles_payment_id}
                                    </span>
                                )}
                                <h3 className="text-lg font-bold text-white mt-4">{slip.full_name || 'Guest User'}</h3>
                                <p className="text-slate-500 text-xs font-medium">{slip.email || 'No Email Provided'}</p>
                                {slip.requested_plan_name && (
                                    <p className="text-amber-400 text-xs font-bold mt-2">Requested plan: {slip.requested_plan_name}</p>
                                )}
                                {slip.note && (
                                    <p className="text-slate-400 text-xs italic mt-2">"{slip.note}"</p>
                                )}
                            </div>

                            <div className="flex gap-3 mt-8">
                                <button
                                    onClick={() => handleApproval(slip.verification_id, 'approved')}
                                    className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 rounded-2xl text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                                >
                                    <Check size={14}/> Confirm
                                </button>
                                <button
                                    onClick={() => handleApproval(slip.verification_id, 'rejected')}
                                    className="flex-1 border border-slate-800 hover:bg-rose-500/10 hover:border-rose-500/50 text-slate-500 hover:text-rose-500 font-black py-3 rounded-2xl text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                                >
                                    <X size={14}/> Decline
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {!loading && slips.length === 0 && (
                    <div className="lg:col-span-2 p-16 text-center border border-dashed border-slate-800 rounded-3xl">
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">No pending receipts to review</p>
                    </div>
                )}
            </div>

            {/* --- DECISION HISTORY --- */}
            <div className="mt-14">
                <h2 className="text-white text-lg font-black uppercase tracking-tighter mb-1">Decision History</h2>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-6">Edit remarks/amount, or undo a decision</p>

                <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-slate-500 text-[9px] uppercase tracking-widest bg-slate-800/50">
                                <th className="p-4 font-black">Applicant</th>
                                <th className="p-4 font-black">Type</th>
                                <th className="p-4 font-black">Amount</th>
                                <th className="p-4 font-black">Status</th>
                                <th className="p-4 font-black">Reviewed</th>
                                <th className="p-4 font-black">Remarks</th>
                                <th className="p-4 font-black text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {history.map((entry) => (
                                <tr key={entry.verification_id} className="hover:bg-slate-800/40 transition-colors group">
                                    <td className="p-4">
                                        <p className="text-white text-sm font-bold">{entry.full_name || 'Guest User'}</p>
                                        <p className="text-slate-500 text-[10px]">{entry.email}</p>
                                    </td>
                                    <td className="p-4 text-slate-400 text-[10px] font-bold uppercase">{entry.payment_type}</td>
                                    <td className="p-4 text-emerald-400 font-mono font-bold text-sm">LKR {entry.amount_declared}</td>
                                    <td className="p-4">
                                        <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-full border ${
                                            entry.status === 'approved'
                                                ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                                                : 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                                        }`}>
                                            {entry.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-slate-400 text-[10px]">
                                        {entry.reviewed_at ? new Date(entry.reviewed_at).toLocaleString() : '—'}
                                    </td>
                                    <td className="p-4 text-slate-400 text-[10px] max-w-[160px] truncate" title={entry.remarks}>
                                        {entry.remarks || '—'}
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                            <button
                                                onClick={() => window.open(`${API_URL}${entry.receipt_file_url}`, '_blank')}
                                                title="View slip"
                                                className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                                            >
                                                <ExternalLink size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleOpenEdit(entry)}
                                                title="Edit remarks/amount"
                                                className="p-2 text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                                            >
                                                <Pencil size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleUndo(entry)}
                                                title="Undo decision"
                                                className="p-2 text-slate-500 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
                                            >
                                                <RotateCcw size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {history.length === 0 && (
                        <div className="p-16 text-center">
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">No reviewed receipts yet</p>
                        </div>
                    )}
                </div>
            </div>

            <Modal
                isOpen={!!editingEntry}
                onClose={() => setEditingEntry(null)}
                title="Edit Verification"
                submitText="Save Changes"
                onSubmit={handleEditSubmit}
            >
                <div className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Amount Recorded (LKR)</label>
                        <input
                            type="number"
                            step="0.01"
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none text-slate-900"
                            value={editForm.amount_declared}
                            onChange={(e) => setEditForm({ ...editForm, amount_declared: e.target.value })}
                            required
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Remarks</label>
                        <textarea
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none text-slate-900"
                            rows={3}
                            value={editForm.remarks}
                            onChange={(e) => setEditForm({ ...editForm, remarks: e.target.value })}
                        />
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default ReceiptReview;

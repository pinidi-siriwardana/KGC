import React, { useState, useEffect, useMemo } from 'react';
import { Check, X, Eye, AlertCircle, Pencil, RotateCcw, ExternalLink, ImageOff } from 'lucide-react';
import { apiFetch, API_URL, parseErrorMessage } from '../../utils/api';
import { openUploadedFile } from '../../utils/openUploadedFile';
import Modal from '../../components/common/Modal';
import SearchInput from '../../components/common/SearchInput';
import FilterSelect from '../../components/common/FilterSelect';

const FILE_NOT_FOUND_MESSAGE = 'This receipt file could not be found. It may have been moved or deleted from the server.';

const STATUS_OPTIONS = [
    { value: '', label: 'All Statuses' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
];

// Mirrors the backend's own undo guards (paymentVerificationController.js
// undoVerification) — an approved booking or membership renewal already
// cascaded into a confirmed booking / granted membership term that can't be
// safely auto-reversed, so undo is blocked server-side. Checking the same
// condition here lets the button show as disabled with an explanation up
// front, instead of the admin clicking it just to get a 409 back.
const isUndoBlocked = (entry) =>
    entry.status === 'approved' && (entry.payment_type === 'booking' || entry.payment_type === 'membership_renewal');

const undoBlockedReason = (entry) => {
    if (entry.payment_type === 'booking') {
        return "This booking is already confirmed and paid — cancel the booking directly (and handle any refund) instead of undoing here.";
    }
    return "This membership term can't be safely reversed — adjust the member's membership directly if it needs correcting.";
};

// Type-accurate confirmation copy — undoing a registration really does
// delete the account it created, but undoing anything else (a donation,
// tournament fee, cancellation/no-show fee, or fee settlement) only
// reverses a payments-ledger entry; showing the "delete the account" text
// for those would be actively misleading about what's about to happen.
const undoWarningText = (entry) => {
    if (entry.payment_type === 'registration' && entry.status === 'approved') {
        return `Undo this approval? This will DELETE the member account that was created for ${entry.full_name || 'this applicant'} and move the request back to pending.`;
    }
    if (entry.status === 'approved') {
        return `Undo this approval and move ${entry.full_name || 'this submission'}'s payment back to pending review? The recorded payment will be reversed until it's decided again.`;
    }
    return `Undo this rejection and move ${entry.full_name || 'this submission'}'s request back to pending?`;
};

const ReceiptReview = () => {
    const [slips, setSlips] = useState([]);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingEntry, setEditingEntry] = useState(null);
    const [editForm, setEditForm] = useState({ remarks: '', amount_declared: '' });
    const [modalError, setModalError] = useState('');
    const [savingModal, setSavingModal] = useState(false);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [brokenSlips, setBrokenSlips] = useState({});
    const [fileError, setFileError] = useState('');

    const filteredHistory = useMemo(() => {
        const q = search.trim().toLowerCase();
        return history.filter((h) => {
            const matchesSearch = !q || [h.full_name, h.email].some((v) => v?.toLowerCase().includes(q));
            const matchesStatus = !statusFilter || h.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [history, search, statusFilter]);

    // getPendingVerifications/getVerificationHistory return a bare array on
    // success but `{message, error}` on a 500 — without checking res.ok/
    // Array.isArray, a transient backend error would set slips/history to
    // that error object, and the very next render's .map()/.filter() would
    // crash the whole page (same guard AdminGuests.jsx already uses).
    const fetchSlips = async () => {
        const res = await apiFetch('/api/payments/pending');
        const data = await res.json();
        setSlips(res.ok && Array.isArray(data) ? data : []);
        setLoading(false);
    };

    const fetchHistory = async () => {
        const res = await apiFetch('/api/payments/history');
        const data = await res.json();
        setHistory(res.ok && Array.isArray(data) ? data : []);
    };

    const refreshBoth = () => {
        fetchSlips();
        fetchHistory();
    };

    useEffect(() => {
        fetchSlips();
        fetchHistory();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Quick decision straight from a pending card — the fast path for the
    // common case (nothing to correct, just confirm or decline).
    const handleApproval = async (id, status) => {
        const endpoint = status === 'approved' ? 'approve' : 'reject';
        const remarks = status === 'approved' ? 'Verified via Bank Portal' : 'Rejected after manual review';
        const res = await apiFetch(`/api/payments/${endpoint}/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ remarks })
        });

        if (res.ok) {
            refreshBoth();
        } else {
            alert(await parseErrorMessage(res, 'Action failed.'));
        }
    };

    // Dismisses a pending receipt that doesn't need a real decision — under
    // the hood this is still a reject (the only safe way to close one out;
    // there's no delete for payment_verification, same as everywhere else in
    // the admin dashboard), just with remarks that reflect "closed", not
    // "denied". This is also what actually unsticks a booking-type receipt
    // whose linked booking already moved on independently (e.g. its 5-minute
    // guest lock expired) — rejectGuestBooking now closes those out cleanly
    // instead of erroring, so this button always succeeds for a stuck one.
    const handleClose = async (slip) => {
        if (!window.confirm('Close this receipt without approving or declining its content? It will be marked rejected and removed from the pending queue.')) return;

        const res = await apiFetch(`/api/payments/reject/${slip.verification_id}`, {
            method: 'PATCH',
            body: JSON.stringify({ remarks: 'Closed by admin — no longer needs review.' }),
        });

        if (res.ok) {
            refreshBoth();
        } else {
            alert(await parseErrorMessage(res, 'Failed to close.'));
        }
    };

    // Opens the unified Manage modal — works for a still-pending slip
    // (adjust amount/remarks before deciding) just as well as an already-
    // reviewed history entry (edit remarks, or undo back to pending).
    const handleOpenEdit = (entry) => {
        setEditingEntry(entry);
        setEditForm({ remarks: entry.remarks || '', amount_declared: entry.amount_declared });
        setModalError('');
    };

    // Saves remarks (and amount, only while still pending — see
    // editVerification's own guard) without changing the decision itself.
    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setSavingModal(true);
        setModalError('');

        const body = { remarks: editForm.remarks };
        if (editingEntry.status === 'pending') body.amount_declared = editForm.amount_declared;

        const res = await apiFetch(`/api/payments/edit/${editingEntry.verification_id}`, {
            method: 'PATCH',
            body: JSON.stringify(body)
        });
        setSavingModal(false);

        if (res.ok) {
            setEditingEntry(null);
            refreshBoth();
        } else {
            setModalError(await parseErrorMessage(res, 'Failed to save changes.'));
        }
    };

    // Approve/Reject from inside the modal, carrying over whatever
    // remarks/amount the admin has typed instead of the quick-action's
    // generic boilerplate. Saves any pending amount/remarks edit first —
    // approve/reject only ever writes `remarks`, so without this step an
    // amount typed into the field but not explicitly "Saved" first would be
    // silently discarded and the stale original amount approved instead.
    const handleModalDecision = async (status) => {
        setSavingModal(true);
        setModalError('');

        if (editingEntry.status === 'pending') {
            const editRes = await apiFetch(`/api/payments/edit/${editingEntry.verification_id}`, {
                method: 'PATCH',
                body: JSON.stringify({ remarks: editForm.remarks, amount_declared: editForm.amount_declared }),
            });
            if (!editRes.ok) {
                setSavingModal(false);
                setModalError(await parseErrorMessage(editRes, 'Failed to save changes before deciding.'));
                return;
            }
        }

        const res = await apiFetch(`/api/payments/${status === 'approved' ? 'approve' : 'reject'}/${editingEntry.verification_id}`, {
            method: 'PATCH',
            body: JSON.stringify({ remarks: editForm.remarks || null }),
        });
        setSavingModal(false);

        if (res.ok) {
            setEditingEntry(null);
            refreshBoth();
        } else {
            setModalError(await parseErrorMessage(res, 'Action failed.'));
        }
    };

    const handleModalUndo = async () => {
        if (!window.confirm(undoWarningText(editingEntry))) return;
        setSavingModal(true);
        setModalError('');

        const res = await apiFetch(`/api/payments/undo/${editingEntry.verification_id}`, { method: 'PATCH' });
        setSavingModal(false);

        if (res.ok) {
            setEditingEntry(null);
            refreshBoth();
        } else {
            setModalError(await parseErrorMessage(res, 'Failed to undo.'));
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

            {fileError && (
                <div className="mb-6 flex items-center justify-between gap-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold px-4 py-3 rounded-xl">
                    <span>{fileError}</span>
                    <button onClick={() => setFileError('')} className="text-rose-400/70 hover:text-rose-300 shrink-0"><X size={14} /></button>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {slips.map((slip) => (
                    <div key={slip.verification_id} className="relative bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden flex flex-col md:flex-row shadow-2xl">
                        <button
                            onClick={() => handleClose(slip)}
                            title="Close — dismiss this receipt without approving or declining it"
                            className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-slate-950/60 text-slate-400 hover:text-white hover:bg-slate-950 transition-colors"
                        >
                            <X size={14} />
                        </button>
                        {/* Image Section */}
                        <div
                            className="md:w-1/3 h-48 md:h-auto bg-slate-800 relative group cursor-pointer"
                            onClick={() => {
                                if (brokenSlips[slip.verification_id]) {
                                    setFileError(FILE_NOT_FOUND_MESSAGE);
                                    return;
                                }
                                openUploadedFile(slip.receipt_file_url, () => {
                                    setBrokenSlips((b) => ({ ...b, [slip.verification_id]: true }));
                                    setFileError(FILE_NOT_FOUND_MESSAGE);
                                });
                            }}
                            title={brokenSlips[slip.verification_id] ? 'File not found' : 'Open full-size slip'}
                        >
                            {brokenSlips[slip.verification_id] ? (
                                <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-500">
                                    <ImageOff size={28} />
                                    <span className="text-[9px] font-black uppercase tracking-widest">File Not Found</span>
                                </div>
                            ) : (
                                <>
                                    <img
                                        src={`${API_URL}${slip.receipt_file_url}`}
                                        className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity"
                                        alt="receipt"
                                        onError={() => setBrokenSlips((b) => ({ ...b, [slip.verification_id]: true }))}
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Eye className="text-white" size={24}/>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Content Section */}
                        <div className="p-6 flex-1 flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-start">
                                    <span className="px-2 py-1 rounded bg-slate-800 text-[9px] font-black uppercase tracking-widest text-slate-400">{slip.payment_type}</span>
                                    <div className="flex items-center gap-2">
                                        <p className="text-emerald-400 font-mono font-bold">LKR {slip.amount_declared}</p>
                                        <button
                                            onClick={() => handleOpenEdit(slip)}
                                            title="Edit amount/remarks before deciding"
                                            className="p-1.5 text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                                        >
                                            <Pencil size={13} />
                                        </button>
                                    </div>
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
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                    <div>
                        <h2 className="text-white text-lg font-black uppercase tracking-tighter mb-1">Decision History</h2>
                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Manage a decision — edit remarks, or move it back to review</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <FilterSelect value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} options={STATUS_OPTIONS} dark />
                        <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name..." dark className="w-full sm:w-56" />
                    </div>
                </div>

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
                            {filteredHistory.map((entry) => (
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
                                                onClick={() => openUploadedFile(entry.receipt_file_url, () => setFileError(FILE_NOT_FOUND_MESSAGE))}
                                                title="View slip"
                                                className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                                            >
                                                <ExternalLink size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleOpenEdit(entry)}
                                                title="Manage — edit remarks or move back to review"
                                                className="p-2 text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                                            >
                                                <Pencil size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {filteredHistory.length === 0 && (
                        <div className="p-16 text-center">
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">
                                {history.length === 0 ? 'No reviewed receipts yet' : 'No receipts match these filters'}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Unified Manage modal — works the same for a pending slip (edit
                before deciding) and a reviewed history entry (edit remarks,
                or move back to review). The bottom action row is the
                "edit/reject/approve/move to review" flow in one place. */}
            <Modal
                isOpen={!!editingEntry}
                onClose={() => setEditingEntry(null)}
                title={`Manage Verification${editingEntry?.full_name ? ` — ${editingEntry.full_name}` : ''}`}
                submitText={savingModal ? 'Saving...' : 'Save Changes'}
                onSubmit={handleEditSubmit}
            >
                <div className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-slate-400 ml-1">
                            Amount Recorded (LKR)
                            {editingEntry && editingEntry.status !== 'pending' && (
                                <span className="normal-case font-medium text-slate-400"> — locked once decided; move back to review to change it</span>
                            )}
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            disabled={editingEntry?.status !== 'pending'}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
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

                    {modalError && (
                        <p className="text-red-500 text-[11px] font-bold">{modalError}</p>
                    )}

                    {editingEntry && (
                        <div className="pt-2 border-t border-slate-100 space-y-2">
                            <p className="text-[9px] font-black uppercase text-slate-400 ml-1">Decision</p>
                            {editingEntry.status === 'pending' ? (
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        disabled={savingModal}
                                        onClick={() => handleModalDecision('rejected')}
                                        className="flex-1 border border-slate-200 hover:bg-rose-50 hover:border-rose-200 text-slate-500 hover:text-rose-600 font-black py-3 rounded-xl text-[10px] uppercase tracking-widest transition-all disabled:opacity-50"
                                    >
                                        Reject
                                    </button>
                                    <button
                                        type="button"
                                        disabled={savingModal}
                                        onClick={() => handleModalDecision('approved')}
                                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 rounded-xl text-[10px] uppercase tracking-widest transition-all disabled:opacity-50"
                                    >
                                        Approve
                                    </button>
                                </div>
                            ) : (
                                <div>
                                    <button
                                        type="button"
                                        disabled={savingModal || isUndoBlocked(editingEntry)}
                                        onClick={handleModalUndo}
                                        title={isUndoBlocked(editingEntry) ? undoBlockedReason(editingEntry) : undefined}
                                        className="w-full flex items-center justify-center gap-2 border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-700 font-black py-3 rounded-xl text-[10px] uppercase tracking-widest transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        <RotateCcw size={12} /> Move Back to Review
                                    </button>
                                    {isUndoBlocked(editingEntry) && (
                                        <p className="text-[10px] text-slate-400 mt-2">{undoBlockedReason(editingEntry)}</p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
};

export default ReceiptReview;

import React, { useState, useEffect } from 'react';
import { Lock, Clock, ExternalLink } from 'lucide-react';
import { apiFetch, API_URL } from '../../utils/api';
import BankDetails from '../../components/common/BankDetails';
import ReceiptUploadField from '../../components/common/ReceiptUploadField';

const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

const POLL_INTERVAL_MS = 20000;

const MembershipExpired = ({ membership }) => {
    const [settings, setSettings] = useState(null);
    const [membershipTypes, setMembershipTypes] = useState([]);
    const [pendingRequest, setPendingRequest] = useState(undefined); // undefined = still loading
    const [membershipTypeId, setMembershipTypeId] = useState('');
    const [note, setNote] = useState('');
    const [receiptFile, setReceiptFile] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const fetchPendingRequest = () =>
        apiFetch('/api/member/payments')
            .then((res) => res.json())
            .then((data) => {
                const pending = (data.requests || []).find(
                    (r) => r.payment_type === 'membership_renewal' && r.status === 'pending'
                );
                setPendingRequest(pending || null);
            })
            .catch(() => setPendingRequest((prev) => (prev === undefined ? null : prev)));

    useEffect(() => {
        apiFetch('/api/settings').then((res) => res.json()).then((data) => setSettings(data.data || null)).catch(() => {});
        apiFetch('/api/membership-types').then((res) => res.json()).then((data) => setMembershipTypes(data.data || [])).catch(() => {});
        fetchPendingRequest();
    }, []);

    // A rejection doesn't change access_blocked (membership is still
    // expired), so MembershipGate never remounts this component and this
    // effect's one-shot fetch above would otherwise leave the member stuck
    // on the "awaiting review" panel forever. Keep checking while a request
    // is outstanding so a rejection reopens the resubmission form.
    useEffect(() => {
        if (!pendingRequest) return;
        const interval = setInterval(fetchPendingRequest, POLL_INTERVAL_MS);
        return () => clearInterval(interval);
    }, [Boolean(pendingRequest)]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!membershipTypeId) {
            setError('Please select a membership plan.');
            return;
        }
        if (!receiptFile) {
            setError('Please attach your payment slip.');
            return;
        }

        setSubmitting(true);
        setError('');

        const body = new FormData();
        body.append('payment_type', 'membership_renewal');
        body.append('membership_type_id', membershipTypeId);
        if (note) body.append('note', note);
        body.append('receipt', receiptFile);

        try {
            const res = await apiFetch('/api/member/payments', { method: 'POST', body });
            if (res.ok) {
                // Refetch rather than build the pending object locally so it
                // carries every field the server has (e.g. receipt_file_url).
                await fetchPendingRequest();
            } else {
                const err = await res.json();
                setError(err.message || 'Failed to submit payment.');
            }
        } catch {
            setError('Network error — please check your connection and try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="relative flex items-center justify-center min-h-[70vh] animate-in fade-in duration-700 py-10">
            <div className="max-w-lg w-full bg-white border border-slate-100 shadow-sm rounded-3xl p-10 space-y-6">
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-red-500">
                        <Lock size={28} />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-slate-900 text-2xl font-serif italic">Membership Expired</h1>
                        {membership ? (
                            <p className="text-slate-500 text-sm leading-relaxed">
                                Your <span className="font-bold text-slate-700">{membership.plan_name}</span> membership expired on{' '}
                                <span className="font-bold text-slate-700">{formatDate(membership.end_date)}</span>. Renew your
                                membership to regain access to the member portal.
                            </p>
                        ) : (
                            <p className="text-slate-500 text-sm leading-relaxed">
                                We couldn&apos;t find an active membership plan on your account. Select a plan below and
                                submit payment to activate one.
                            </p>
                        )}
                    </div>
                </div>

                {pendingRequest === undefined && (
                    <p className="text-slate-400 text-[10px] uppercase tracking-widest font-black text-center py-4">Loading...</p>
                )}

                {pendingRequest && (
                    <div className="border-t border-slate-100 pt-6 space-y-4">
                        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 text-center space-y-3">
                            <div className="w-12 h-12 mx-auto rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                                <Clock size={22} />
                            </div>
                            <p className="text-amber-800 text-sm font-bold">Renewal submitted — awaiting admin review</p>
                            <p className="text-amber-700 text-xs leading-relaxed">
                                {pendingRequest.requested_plan_name && (
                                    <>Requested plan: <span className="font-bold">{pendingRequest.requested_plan_name}</span><br /></>
                                )}
                                Submitted {formatDate(pendingRequest.submitted_at)}. You&apos;ll regain access to the
                                member portal automatically once an admin approves your payment.
                            </p>
                            {pendingRequest.receipt_file_url && (
                                <a
                                    href={`${API_URL}${pendingRequest.receipt_file_url}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 text-amber-700 text-[10px] font-black uppercase tracking-widest hover:text-amber-900 transition-colors"
                                >
                                    <ExternalLink size={12} /> View submitted slip
                                </a>
                            )}
                        </div>
                    </div>
                )}

                {pendingRequest === null && (
                    <form onSubmit={handleSubmit} className="border-t border-slate-100 pt-6 space-y-4">
                        <div>
                            <p className="text-[9px] font-black uppercase text-slate-400 mb-2">Payment Details</p>
                            <BankDetails
                                settings={settings}
                                note={
                                    <p className="text-slate-600 text-xs leading-relaxed mb-2">
                                        {settings?.payment_instructions || 'Transfer the membership fee to the account below, then upload your payment slip.'}
                                    </p>
                                }
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-slate-400">Membership Plan</label>
                            <select
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                                value={membershipTypeId}
                                onChange={(e) => setMembershipTypeId(e.target.value)}
                                required
                            >
                                <option value="" disabled>Select a plan...</option>
                                {membershipTypes.map((t) => (
                                    <option key={t.membership_type_id} value={t.membership_type_id}>
                                        {t.name} — LKR {t.price} / {t.duration_months}mo
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-slate-400">Note (optional)</label>
                            <input
                                type="text"
                                placeholder="e.g. Renewing Senior Membership"
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-slate-400">Payment Slip</label>
                            <ReceiptUploadField file={receiptFile} onChange={setReceiptFile} />
                        </div>

                        {error && <p className="text-red-500 text-[11px] font-bold">{error}</p>}

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] py-4 rounded-2xl hover:bg-slate-800 shadow-lg shadow-slate-200 transition-all active:scale-[0.98] disabled:opacity-50"
                        >
                            {submitting ? 'Submitting...' : 'Submit Renewal Payment'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default MembershipExpired;

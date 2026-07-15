import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, Loader2, CheckCircle2 } from 'lucide-react';
import { apiFetch } from '../../utils/api';

const CoachInquiry = () => {
    const [form, setForm] = useState({ full_name: '', email: '', phone: '', message: '' });
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState(null);

    useEffect(() => {
        apiFetch('/api/coach/me')
            .then((res) => res.json())
            .then((data) => {
                setForm((prev) => ({
                    ...prev,
                    full_name: data.coach?.full_name || '',
                    email: data.coach?.email || '',
                    phone: data.coach?.phone || '',
                }));
            })
            .finally(() => setLoading(false));
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setResult(null);

        const res = await apiFetch('/api/inquiries', {
            method: 'POST',
            body: JSON.stringify(form),
        });
        const data = await res.json();
        setSubmitting(false);

        if (res.ok) {
            setResult({ type: 'success', text: 'Your message has been sent to the club admin.' });
            setForm((prev) => ({ ...prev, message: '' }));
        } else {
            setResult({ type: 'error', text: data.message || 'Failed to send your message.' });
        }
    };

    return (
        <div className="relative space-y-10 animate-in fade-in duration-700">
            <div className="absolute -top-20 -right-20 w-80 h-80 bg-amber-500/10 blur-[100px] rounded-full pointer-events-none opacity-60" />

            <header className="relative z-10 flex items-center gap-5">
                <div className="w-20 h-20 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <MessageSquare size={40} strokeWidth={1.5} />
                </div>
                <div>
                    <h1 className="text-slate-900 text-4xl font-serif italic">Contact Admin</h1>
                    <p className="text-emerald-600 text-[10px] font-black uppercase tracking-[0.3em] mt-2">
                        Send a message directly to the club admin
                    </p>
                </div>
            </header>

            <div className="relative z-10 bg-white border border-slate-100 shadow-sm rounded-3xl p-8 max-w-2xl">
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Full Name</label>
                            <input
                                type="text" required disabled={loading}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-amber-500/10 disabled:opacity-50"
                                value={form.full_name}
                                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Email</label>
                            <input
                                type="email" required disabled={loading}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-amber-500/10 disabled:opacity-50"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Contact Number (optional)</label>
                        <input
                            type="text" disabled={loading}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-amber-500/10 disabled:opacity-50"
                            value={form.phone}
                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Message</label>
                        <textarea
                            required rows={5} placeholder="What would you like to tell the admin?"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-amber-500/10"
                            value={form.message}
                            onChange={(e) => setForm({ ...form, message: e.target.value })}
                        />
                    </div>

                    {result && (
                        <p className={`flex items-center gap-2 text-[11px] font-bold ${result.type === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {result.type === 'success' && <CheckCircle2 size={14} />}
                            {result.text}
                        </p>
                    )}

                    <button
                        type="submit" disabled={submitting || loading}
                        className="flex items-center gap-2 bg-amber-500 px-6 py-3 rounded-xl text-slate-950 font-black uppercase tracking-widest text-[10px] hover:bg-slate-900 hover:text-white transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
                    >
                        {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                        {submitting ? 'Sending...' : 'Send Message'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CoachInquiry;

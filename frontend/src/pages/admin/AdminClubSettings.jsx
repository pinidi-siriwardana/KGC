import React, { useState, useEffect } from 'react';
import { Building2, MapPin, Mail, Phone, Clock, Save, Loader2 } from 'lucide-react';
import { FaFacebookF, FaInstagram, FaXTwitter } from 'react-icons/fa6';
import { apiFetch } from '../../utils/api';

const emptyForm = {
    club_address: '', club_email: '', club_phone: '', club_opening_hours: '',
    club_facebook_url: '', club_instagram_url: '', club_twitter_url: '',
};

const FIELD_KEYS = Object.keys(emptyForm);

const AdminClubSettings = () => {
    const [form, setForm] = useState(emptyForm);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        apiFetch('/api/settings')
            .then((res) => res.json())
            .then((data) => {
                const values = data.data || {};
                setForm((f) => ({ ...f, ...Object.fromEntries(FIELD_KEYS.map((k) => [k, values[k] ?? ''])) }));
            })
            .finally(() => setLoading(false));
    }, []);

    const handleChange = (key) => (e) => setForm({ ...form, [key]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        const res = await apiFetch('/api/settings', {
            method: 'PATCH',
            body: JSON.stringify(form),
        });
        const data = await res.json();
        setSaving(false);

        if (res.ok) {
            setMessage({ type: 'success', text: 'Club settings updated — the home page, footer and membership page now reflect these details.' });
        } else {
            setMessage({ type: 'error', text: data.message || 'Failed to update club settings.' });
        }
    };

    return (
        <div className="relative space-y-10 animate-in fade-in duration-700">
            <div className="absolute -top-20 -right-20 w-80 h-80 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none opacity-60" />

            <header className="relative z-10 flex items-center gap-5">
                <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Building2 size={40} strokeWidth={1.5} />
                </div>
                <div>
                    <h1 className="text-slate-900 text-4xl font-serif italic">Club Settings</h1>
                    <p className="text-emerald-600 text-[10px] font-black uppercase tracking-[0.3em] mt-2">
                        Public contact details shown on the website
                    </p>
                </div>
            </header>

            <div className="relative z-10 bg-white border border-slate-100 shadow-sm rounded-3xl p-8 max-w-3xl">
                <form onSubmit={handleSubmit} className="space-y-5">

                    <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1.5">
                            <MapPin size={12} /> Club Address
                        </label>
                        <textarea
                            rows={2} disabled={loading} required
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-emerald-500/10 disabled:opacity-50 resize-none"
                            value={form.club_address} onChange={handleChange('club_address')}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1.5">
                                <Mail size={12} /> Contact Email
                            </label>
                            <input
                                type="email" disabled={loading} required
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-emerald-500/10 disabled:opacity-50"
                                value={form.club_email} onChange={handleChange('club_email')}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1.5">
                                <Phone size={12} /> Contact Number
                            </label>
                            <input
                                type="tel" disabled={loading} required
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-emerald-500/10 disabled:opacity-50"
                                value={form.club_phone} onChange={handleChange('club_phone')}
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1.5">
                            <Clock size={12} /> Opening Hours
                        </label>
                        <input
                            type="text" placeholder="e.g. Mon – Sun: 08:00 – 20:00" disabled={loading} required
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-emerald-500/10 disabled:opacity-50"
                            value={form.club_opening_hours} onChange={handleChange('club_opening_hours')}
                        />
                    </div>

                    <div className="pt-2">
                        <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-3">Social Media Links</p>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
                                    <FaFacebookF size={14} />
                                </div>
                                <input
                                    type="url" placeholder="https://facebook.com/yourpage" disabled={loading}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-emerald-500/10 disabled:opacity-50"
                                    value={form.club_facebook_url} onChange={handleChange('club_facebook_url')}
                                />
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
                                    <FaInstagram size={14} />
                                </div>
                                <input
                                    type="url" placeholder="https://instagram.com/yourpage" disabled={loading}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-emerald-500/10 disabled:opacity-50"
                                    value={form.club_instagram_url} onChange={handleChange('club_instagram_url')}
                                />
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
                                    <FaXTwitter size={14} />
                                </div>
                                <input
                                    type="url" placeholder="https://x.com/yourpage" disabled={loading}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-emerald-500/10 disabled:opacity-50"
                                    value={form.club_twitter_url} onChange={handleChange('club_twitter_url')}
                                />
                            </div>
                        </div>
                        <p className="text-slate-400 text-[10px] pt-2">Leave a link blank to hide that icon from the site footer.</p>
                    </div>

                    {message && (
                        <p className={`text-[11px] font-bold ${message.type === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {message.text}
                        </p>
                    )}

                    <button
                        type="submit" disabled={saving || loading}
                        className="flex items-center gap-2 bg-emerald-600 px-6 py-3 rounded-xl text-white font-black uppercase tracking-widest text-[10px] hover:bg-slate-900 transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                    >
                        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AdminClubSettings;

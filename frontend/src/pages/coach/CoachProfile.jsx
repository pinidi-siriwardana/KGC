import React, { useState, useEffect } from 'react';
import { CircleUserRound, KeyRound, Save, Loader2 } from 'lucide-react';
import { apiFetch } from '../../utils/api';

const emptyPasswordForm = { currentPassword: '', newPassword: '', confirmPassword: '' };

const CoachProfile = () => {
    const [coach, setCoach] = useState(null);
    const [loading, setLoading] = useState(true);
    const [profileForm, setProfileForm] = useState({ username: '', email: '', phone: '' });
    const [savingProfile, setSavingProfile] = useState(false);
    const [profileMessage, setProfileMessage] = useState(null);

    const [passwordForm, setPasswordForm] = useState(emptyPasswordForm);
    const [savingPassword, setSavingPassword] = useState(false);
    const [passwordMessage, setPasswordMessage] = useState(null);

    const storedUser = (() => {
        try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
    })();

    useEffect(() => {
        apiFetch('/api/coach/me')
            .then((res) => res.json())
            .then((data) => {
                setCoach(data.coach || null);
                setProfileForm({
                    username: storedUser?.username || '',
                    email: data.coach?.email || '',
                    phone: data.coach?.phone || '',
                });
            })
            .finally(() => setLoading(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setSavingProfile(true);
        setProfileMessage(null);

        const res = await apiFetch('/api/coach/me', {
            method: 'PATCH',
            body: JSON.stringify(profileForm),
        });
        const data = await res.json();
        setSavingProfile(false);

        if (res.ok) {
            setProfileMessage({ type: 'success', text: 'Profile updated.' });
            setCoach(data.coach);
            const updatedUser = { ...(storedUser || {}), username: profileForm.username };
            localStorage.setItem('user', JSON.stringify(updatedUser));
        } else {
            setProfileMessage({ type: 'error', text: data.message || 'Failed to update profile.' });
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setPasswordMessage(null);

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setPasswordMessage({ type: 'error', text: 'New password and confirmation do not match.' });
            return;
        }

        setSavingPassword(true);
        const res = await apiFetch('/api/coach/me', {
            method: 'PATCH',
            body: JSON.stringify({
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword,
            }),
        });
        const data = await res.json();
        setSavingPassword(false);

        if (res.ok) {
            setPasswordMessage({ type: 'success', text: 'Password changed.' });
            setPasswordForm(emptyPasswordForm);
        } else {
            setPasswordMessage({ type: 'error', text: data.message || 'Failed to change password.' });
        }
    };

    return (
        <div className="relative space-y-10 animate-in fade-in duration-700">
            <div className="absolute -top-20 -right-20 w-80 h-80 bg-amber-500/10 blur-[100px] rounded-full pointer-events-none opacity-60" />

            <header className="relative z-10 flex items-center gap-5">
                <div className="w-20 h-20 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <CircleUserRound size={44} strokeWidth={1.5} />
                </div>
                <div>
                    <h1 className="text-slate-900 text-4xl font-serif italic">Profile Settings</h1>
                    <p className="text-emerald-600 text-[10px] font-black uppercase tracking-[0.3em] mt-2">
                        {loading ? 'Loading...' : (coach?.full_name || 'Coach')}
                    </p>
                </div>
            </header>

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-8">
                    <h3 className="text-slate-800 text-lg font-serif italic mb-6">Account Details</h3>
                    <form onSubmit={handleProfileSubmit} className="space-y-5">
                        <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Username</label>
                            <input
                                type="text" required disabled={loading}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-amber-500/10 disabled:opacity-50"
                                value={profileForm.username}
                                onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Email</label>
                            <input
                                type="email" required disabled={loading}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-amber-500/10 disabled:opacity-50"
                                value={profileForm.email}
                                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Contact Number</label>
                            <input
                                type="text" required disabled={loading}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-amber-500/10 disabled:opacity-50"
                                value={profileForm.phone}
                                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                            />
                        </div>

                        {profileMessage && (
                            <p className={`text-[11px] font-bold ${profileMessage.type === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {profileMessage.text}
                            </p>
                        )}

                        <button
                            type="submit" disabled={savingProfile || loading}
                            className="flex items-center gap-2 bg-amber-500 px-6 py-3 rounded-xl text-slate-950 font-black uppercase tracking-widest text-[10px] hover:bg-slate-900 hover:text-white transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
                        >
                            {savingProfile ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                            {savingProfile ? 'Saving...' : 'Save Changes'}
                        </button>
                    </form>
                </div>

                <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-8">
                    <h3 className="text-slate-800 text-lg font-serif italic mb-6 flex items-center gap-2">
                        <KeyRound size={18} className="text-slate-400" /> Change Password
                    </h3>
                    <form onSubmit={handlePasswordSubmit} className="space-y-5">
                        <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Current Password</label>
                            <input
                                type="password" required
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-amber-500/10"
                                value={passwordForm.currentPassword}
                                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">New Password</label>
                            <input
                                type="password" required minLength={6}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-amber-500/10"
                                value={passwordForm.newPassword}
                                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Confirm New Password</label>
                            <input
                                type="password" required minLength={6}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-amber-500/10"
                                value={passwordForm.confirmPassword}
                                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                            />
                        </div>

                        {passwordMessage && (
                            <p className={`text-[11px] font-bold ${passwordMessage.type === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {passwordMessage.text}
                            </p>
                        )}

                        <button
                            type="submit" disabled={savingPassword}
                            className="flex items-center gap-2 bg-slate-900 px-6 py-3 rounded-xl text-white font-black uppercase tracking-widest text-[10px] hover:bg-amber-500 hover:text-slate-950 transition-all shadow-lg disabled:opacity-50"
                        >
                            {savingPassword ? <Loader2 size={14} className="animate-spin" /> : <KeyRound size={14} />}
                            {savingPassword ? 'Updating...' : 'Update Password'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CoachProfile;

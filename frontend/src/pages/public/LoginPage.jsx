import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Lock, ArrowRight, ArrowLeft, ShieldCheck, Globe } from 'lucide-react';

// Optional: Import a high-quality club interior or abstract tennis visual
import clubVisual from "../../assets/images/club-dusk.jpg";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const LoginPage = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Login failed.');
            }

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            navigate(`/${data.user.role}/dashboard`);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        /* --- NEW PREMIUM BACKGROUND STACK --- */
        /* Swapped bg-alabaster for a deep base and integrated blur imagery */
        <div className="min-h-screen bg-[#060807] flex flex-col items-center justify-center p-6 font-sans relative overflow-hidden">

            {/* 1. Deep Atmosphere Layer (Static Blur) */}
            <div className="absolute inset-0 opacity-80 pointer-events-none">
                <img
                    src={clubVisual}// Replace with clubVisual for KGC specific shot
                    alt="Club Atmosphere"
                    className="w-full h-full object-cover  scale-110"
                />
            </div>

            {/* 2. Dynamic Accent Blurs (Mixed Orange/Emerald) */}
            <div className="absolute top-0 right-1/4 w-[800px] h-[800px] bg-orange-950/20 blur-[150px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-emerald-950/20 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />

            {/* 3. Global Base Vignette for Depth */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/80 pointer-events-none" />


            {/* --- Main Portal Box --- */}
            <div className="w-full max-w-5xl min-h-[600px] bg-obsidian rounded-club overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.6)] border border-white/5 flex flex-col lg:flex-row relative z-10 animate-in fade-in duration-700">

                {/* --- LEFT SIDE: Brand Visual --- */}
                <div className="lg:w-5/12 bg-emerald p-10 md:p-12 flex flex-col justify-between relative overflow-hidden">

                    <div className="absolute top-[-10%] left-[-10%] w-[80%] h-[80%] bg-amber/20 rounded-full blur-[100px] pointer-events-none" />

                    {/* Compact Return Link */}
                    <Link to="/" className="relative z-10 flex items-center gap-3 no-underline group w-fit">
                        <div className="w-9 h-9 bg-white/10 backdrop-blur-md border border-white/10 rounded-xl flex items-center justify-center group-hover:bg-amber group-hover:text-obsidian transition-all">
                            <ArrowLeft size={16} />
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-registry text-white/50 group-hover:text-white transition-colors">
                            Return
                        </span>
                    </Link>

                    {/* Scaled Down Typography */}
                    <div className="relative z-10 space-y-6">
                        <div className="w-10 h-1 bg-amber" />
                        <h1 className="text-white text-5xl md:text-6xl leading-[0.9] tracking-tighter">
                            Digital <br />
                            <span className="text-amber italic">Registry.</span>
                        </h1>
                        <p className="text-white/50 max-w-xs text-xs font-light leading-relaxed italic">
                            Official member portal for the Kandy Garden Club heritage network.
                        </p>
                    </div>

                    <div className="relative z-10 flex items-center gap-4">
                        <div className="p-2.5 bg-white/5 rounded-full border border-white/10">
                            <ShieldCheck className="text-amber" size={18} />
                        </div>
                        <p className="text-[9px] font-bold text-white uppercase tracking-widest">Secure Access Node</p>
                    </div>
                </div>

                {/* --- RIGHT SIDE: The Form --- */}
                <div className="flex-1 bg-[#080a0d] p-10 md:p-14 flex flex-col justify-center relative">

                    <div className="max-w-[340px] w-full mx-auto relative z-10">
                        <header className="mb-10">
                            <h2 className="text-white text-2xl font-black uppercase tracking-tighter mb-2">Member Access</h2>
                            <p className="text-muted text-[10px] uppercase tracking-widest font-bold">Secure Entry Point</p>
                        </header>

                        <form className="space-y-6" onSubmit={handleSubmit}>
                            {/* Registry ID */}
                            <div className="space-y-2 group">
                                <label className="text-[9px] font-black uppercase tracking-registry text-emerald/80 ml-1 group-focus-within:text-amber transition-colors">
                                    Registry ID
                                </label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-amber transition-colors" size={16} />
                                    <input
                                        type="text"
                                        placeholder="KGC-2026-XXXX"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        required
                                        className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-white text-sm outline-none focus:border-amber/50 focus:ring-4 focus:ring-amber/10 transition-all placeholder:text-white/5"
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div className="space-y-2 group">
                                <div className="flex justify-between items-center px-1">
                                    <label className="text-[9px] font-black uppercase tracking-registry text-emerald/80 group-focus-within:text-amber transition-colors">
                                        Password
                                    </label>
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-amber transition-colors" size={16} />
                                    <input
                                        type="password"
                                        placeholder="••••••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-white text-sm outline-none focus:border-amber/50 focus:ring-4 focus:ring-amber/10 transition-all"
                                    />
                                </div>
                            </div>

                            {error && (
                                <p className="text-red-400 text-[11px] font-bold text-center -mb-2">{error}</p>
                            )}

                            {/* Actions */}
                            <div className="space-y-4 pt-4">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-emerald hover:bg-emerald/80 text-white font-black uppercase tracking-registry text-[9px] py-4 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl shadow-emerald/20 group disabled:opacity-50 disabled:pointer-events-none"
                                >
                                    {loading ? 'Authenticating...' : 'Enter Portal'}
                                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                </button>

                                <div className="relative py-2">
                                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
                                    <div className="relative flex justify-center"><span className="bg-[#080a0d] px-3 text-[8px] font-black text-muted tracking-widest uppercase">New Membership</span></div>
                                </div>

                                <Link
                                    to="/membership"
                                    className="w-full border border-amber/20 text-amber hover:bg-amber/5 font-black uppercase tracking-registry text-[9px] py-4 rounded-2xl flex items-center justify-center gap-3 transition-all no-underline text-center"
                                >
                                    Request Registration
                                </Link>
                            </div>
                        </form>
                    </div>

                    <div className="absolute bottom-8 left-0 w-full flex justify-center opacity-5">
                        <span className="text-[8px] font-black uppercase tracking-[0.8em] text-white">Authenticated Access</span>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default LoginPage;
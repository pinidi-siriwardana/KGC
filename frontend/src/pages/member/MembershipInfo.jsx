import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Trophy, CalendarClock, BadgeCheck, CircleAlert } from 'lucide-react';
import { apiFetch } from '../../utils/api';

const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

const formatLKR = (n) => `LKR ${Number(n || 0).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const MembershipInfo = () => {
    const { member, membership } = useOutletContext();
    const [membershipTypes, setMembershipTypes] = useState([]);
    const [loadingTypes, setLoadingTypes] = useState(true);

    useEffect(() => {
        apiFetch('/api/membership-types')
            .then((res) => res.json())
            .then((data) => setMembershipTypes(data.data || []))
            .catch(() => setMembershipTypes([]))
            .finally(() => setLoadingTypes(false));
    }, []);

    return (
        <div className="relative space-y-10 animate-in fade-in duration-700">
            <div className="absolute -top-20 -right-20 w-80 h-80 bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none" />

            <header className="relative z-10 flex items-center gap-5">
                <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Trophy size={40} strokeWidth={1.5} />
                </div>
                <div>
                    <h1 className="text-slate-900 text-4xl font-serif italic">Membership Info</h1>
                    <p className="text-emerald-600 text-[10px] font-black uppercase tracking-[0.3em] mt-2">
                        {member ? member.full_name : 'Member'}
                    </p>
                </div>
            </header>

            {/* Current plan */}
            <div className="relative z-10 bg-white border border-slate-100 shadow-sm rounded-3xl p-8">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-slate-800 text-lg font-serif italic">Your Plan</h3>
                    {membership && (
                        <span className={`flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border ${
                            membership.is_expired
                                ? 'text-rose-600 bg-rose-50 border-rose-100'
                                : 'text-emerald-600 bg-emerald-50 border-emerald-100'
                        }`}>
                            {membership.is_expired ? <CircleAlert size={12} /> : <BadgeCheck size={12} />}
                            {membership.is_expired ? 'Expired' : 'Active'}
                        </span>
                    )}
                </div>

                {!membership ? (
                    <p className="text-slate-400 text-[10px] uppercase tracking-widest font-black">No membership plan on file.</p>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div>
                            <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Plan</p>
                            <p className="text-slate-900 text-xl font-serif">{membership.plan_name}</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Price Paid</p>
                            <p className="text-slate-900 text-xl font-serif">{formatLKR(membership.purchase_price)}</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Start Date</p>
                            <p className="text-slate-700 text-sm font-bold">{formatDate(membership.start_date)}</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Expiration Date</p>
                            <p className={`text-sm font-bold flex items-center gap-1.5 ${membership.is_expired ? 'text-rose-600' : 'text-slate-700'}`}>
                                <CalendarClock size={14} /> {formatDate(membership.end_date)}
                            </p>
                            {!membership.is_expired && (
                                <p className="text-[10px] text-slate-400 mt-1">{membership.days_remaining} day{membership.days_remaining === 1 ? '' : 's'} remaining</p>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Pricing */}
            <div className="relative z-10">
                <h3 className="text-slate-800 text-lg font-serif italic mb-6">Membership Pricing</h3>
                {loadingTypes ? (
                    <p className="text-slate-400 text-[10px] uppercase tracking-widest font-black">Loading plans...</p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {membershipTypes.map((t) => {
                            const isCurrent = membership && Number(membership.membership_type_id) === Number(t.membership_type_id);
                            return (
                                <div
                                    key={t.membership_type_id}
                                    className={`bg-white border shadow-sm rounded-3xl p-8 transition-all ${
                                        isCurrent ? 'border-emerald-300 ring-4 ring-emerald-600/10' : 'border-slate-100 hover:shadow-md'
                                    }`}
                                >
                                    {isCurrent && (
                                        <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full mb-4">
                                            <BadgeCheck size={11} /> Current Plan
                                        </span>
                                    )}
                                    <p className="text-slate-900 text-xl font-serif italic mb-1">{t.name}</p>
                                    <p className="text-slate-400 text-[10px] uppercase tracking-widest font-black mb-6">{t.duration_months} month{t.duration_months === 1 ? '' : 's'}</p>
                                    <p className="text-slate-900 text-3xl font-serif">{formatLKR(t.price)}</p>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MembershipInfo;

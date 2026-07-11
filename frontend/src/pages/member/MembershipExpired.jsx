import React from 'react';
import { Lock, Mail } from 'lucide-react';

const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

const MembershipExpired = ({ membership }) => (
    <div className="relative flex items-center justify-center min-h-[60vh] animate-in fade-in duration-700">
        <div className="max-w-md w-full bg-white border border-slate-100 shadow-sm rounded-3xl p-10 text-center space-y-6">
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
                        We couldn&apos;t find an active membership plan on your account. Please contact the club to set
                        one up.
                    </p>
                )}
            </div>
            <div className="pt-2 border-t border-slate-100">
                <p className="text-slate-400 text-[9px] uppercase tracking-widest font-black mb-3">Need help?</p>
                <div className="flex items-center justify-center gap-2 text-slate-600 text-sm font-medium">
                    <Mail size={14} className="text-emerald-600" />
                    Contact the club office to renew your membership.
                </div>
            </div>
        </div>
    </div>
);

export default MembershipExpired;

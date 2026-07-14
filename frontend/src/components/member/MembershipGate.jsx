import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { apiFetch } from '../../utils/api';
import MembershipExpired from '../../pages/member/MembershipExpired';

// Gates every member portal route behind an active membership check. Fails
// open on a network/5xx error so a transient API blip doesn't lock out a
// member who is actually in good standing.
const POLL_INTERVAL_MS = 20000;

const MembershipGate = () => {
    const [state, setState] = useState({ loading: true, data: null, error: false });

    const fetchMe = () =>
        apiFetch('/api/member/me')
            .then((res) => {
                if (!res.ok) throw new Error('Failed to load member profile.');
                return res.json();
            })
            .then((data) => setState({ loading: false, data, error: false }))
            .catch(() => setState((prev) => (prev.loading ? { loading: false, data: null, error: true } : prev)));

    useEffect(() => {
        fetchMe();
    }, []);

    // While access is blocked (pending renewal review), keep re-checking so
    // the member regains the real portal the moment an admin approves it —
    // no re-login required.
    useEffect(() => {
        if (!state.data?.access_blocked) return;
        const interval = setInterval(fetchMe, POLL_INTERVAL_MS);
        return () => clearInterval(interval);
    }, [state.data?.access_blocked]);

    if (state.loading) {
        return (
            <div className="py-20 text-center text-slate-400 text-[10px] uppercase tracking-widest font-black">
                Loading your profile...
            </div>
        );
    }

    if (state.error) {
        return <Outlet context={{ member: null, membership: null }} />;
    }

    if (state.data.access_blocked) {
        return <MembershipExpired membership={state.data.membership} />;
    }

    return <Outlet context={{ member: state.data.member, membership: state.data.membership }} />;
};

export default MembershipGate;

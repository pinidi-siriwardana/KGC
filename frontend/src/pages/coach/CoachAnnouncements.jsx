import React, { useState, useEffect } from 'react';
import { Trophy, Hammer, Bell, Megaphone } from 'lucide-react';
import { apiFetch } from '../../utils/api';

const CATEGORY_CONFIG = {
    CHAMPIONSHIP: { icon: <Trophy size={20} />, accent: 'bg-amber-500 text-white' },
    MAINTENANCE: { icon: <Hammer size={20} />, accent: 'bg-red-500 text-white' },
    'CLUB EVENT': { icon: <Bell size={20} />, accent: 'bg-slate-900 text-white' },
    GENERAL: { icon: <Megaphone size={20} />, accent: 'bg-emerald-600 text-white' },
};

const defaultConfig = { icon: <Megaphone size={20} />, accent: 'bg-emerald-600 text-white' };

const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

const CoachAnnouncements = () => {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiFetch('/api/announcements')
            .then((res) => res.json())
            .then((data) => setAnnouncements(data.data || []))
            .catch(() => setAnnouncements([]))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="relative space-y-10 animate-in fade-in duration-700">
            <header className="relative z-10">
                <h1 className="text-slate-900 text-4xl font-serif italic">Club Notices.</h1>
                <p className="text-emerald-600 text-[10px] font-black uppercase tracking-[0.3em] mt-2">
                    Announcements &amp; Updates
                </p>
            </header>

            <div className="relative z-10 bg-white border border-slate-100 shadow-sm rounded-3xl p-8">
                {loading && (
                    <p className="text-slate-400 text-[10px] uppercase tracking-widest font-black py-10 text-center">
                        Loading notices...
                    </p>
                )}

                {!loading && announcements.length === 0 && (
                    <p className="text-slate-400 text-[10px] uppercase tracking-widest font-black py-10 text-center">
                        No announcements at this time.
                    </p>
                )}

                <div className="space-y-6">
                    {announcements.map((item) => {
                        const config = CATEGORY_CONFIG[item.category] || defaultConfig;
                        return (
                            <div
                                key={item.announcement_id}
                                className="flex gap-6 items-start p-6 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-white hover:shadow-md transition-all"
                            >
                                <div className={`w-12 h-12 shrink-0 rounded-xl ${config.accent} flex items-center justify-center`}>
                                    {config.icon}
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <span className="text-emerald-700 text-[9px] font-black uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                                            {item.category}
                                        </span>
                                        <span className="text-slate-400 text-[10px] uppercase tracking-widest font-bold">
                                            {formatDate(item.created_at)}
                                        </span>
                                    </div>
                                    <p className="text-slate-900 text-base font-bold leading-tight">{item.title}</p>
                                    <p className="text-slate-600 text-sm leading-relaxed">{item.content}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default CoachAnnouncements;

import React, { useState, useEffect, useMemo } from 'react';
import { MessageSquare, Mail, Phone, Clock, Send, Trash2, ChevronRight, Inbox } from 'lucide-react';
import SearchInput from '../../components/common/SearchInput';
import FilterSelect from '../../components/common/FilterSelect';
import { apiFetch } from '../../utils/api';

const STATUS_STYLES = {
    unread:  'bg-amber-50 text-amber-700 border-amber-200',
    read:    'bg-slate-100 text-slate-500 border-slate-200',
    replied: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const STATUS_OPTIONS = [
    { value: '', label: 'All' },
    { value: 'unread', label: 'Unread' },
    { value: 'read', label: 'Read' },
    { value: 'replied', label: 'Replied' },
];

const AdminInquiries = () => {
    const [inquiries, setInquiries] = useState([]);
    const [selected, setSelected] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [sending, setSending] = useState(false);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const filteredInquiries = useMemo(() => {
        const q = search.trim().toLowerCase();
        return inquiries.filter((i) => {
            const matchesSearch = !q || [i.full_name, i.email, i.message].some((v) => v?.toLowerCase().includes(q));
            const matchesStatus = !statusFilter || i.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [inquiries, search, statusFilter]);

    useEffect(() => { fetchInquiries(); }, []);

    const fetchInquiries = async () => {
        setLoading(true);
        try {
            const res = await apiFetch('/api/inquiries');
            const data = await res.json();
            setInquiries(data.data || []);
        } catch (err) {
            console.error('Failed to fetch inquiries', err);
        } finally {
            setLoading(false);
        }
    };

    const openInquiry = async (inquiry) => {
        setSelected(inquiry);
        setReplyText('');

        if (inquiry.status === 'unread') {
            try {
                const res = await apiFetch(`/api/inquiries/${inquiry.inquiry_id}`);
                const data = await res.json();
                setSelected(data.data);
                setInquiries(prev =>
                    prev.map(i => i.inquiry_id === inquiry.inquiry_id ? { ...i, status: 'read' } : i)
                );
            } catch (err) {
                console.error('Failed to load inquiry', err);
            }
        }
    };

    const handleReply = async () => {
        if (!replyText.trim() || !selected) return;
        setSending(true);
        try {
            const res = await apiFetch(`/api/inquiries/${selected.inquiry_id}/reply`, {
                method: 'POST',
                body: JSON.stringify({ reply_message: replyText }),
            });

            if (res.ok) {
                const updatedStatus = 'replied';
                setSelected(prev => ({ ...prev, status: updatedStatus, reply_message: replyText }));
                setInquiries(prev =>
                    prev.map(i => i.inquiry_id === selected.inquiry_id ? { ...i, status: updatedStatus } : i)
                );
                setReplyText('');
            } else {
                const err = await res.json();
                alert(err.message || 'Failed to send reply.');
            }
        } catch (err) {
            alert('Network error. Could not send reply.');
        } finally {
            setSending(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this inquiry? This cannot be undone.')) return;
        try {
            const res = await apiFetch(`/api/inquiries/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setInquiries(prev => prev.filter(i => i.inquiry_id !== id));
                if (selected?.inquiry_id === id) setSelected(null);
            }
        } catch (err) {
            console.error('Delete failed', err);
        }
    };

    const unreadCount = inquiries.filter(i => i.status === 'unread').length;

    const formatDate = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden">

            {/* Left panel: inquiry list */}
            <div className="w-full max-w-sm border-r border-slate-100 bg-white flex flex-col">
                <div className="p-6 border-b border-slate-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-lg font-black text-slate-900 uppercase tracking-tighter">Inquiries</h1>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Public contact messages</p>
                        </div>
                        {unreadCount > 0 && (
                            <span className="bg-amber-400 text-white text-[10px] font-black px-2.5 py-1 rounded-full">
                                {unreadCount} new
                            </span>
                        )}
                    </div>
                    <div className="flex gap-2 mt-4">
                        <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search inquiries..." className="flex-1" />
                        <FilterSelect value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} options={STATUS_OPTIONS} />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
                    {loading && (
                        <div className="p-8 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">Loading...</div>
                    )}
                    {!loading && inquiries.length === 0 && (
                        <div className="p-12 text-center">
                            <Inbox size={32} className="text-slate-200 mx-auto mb-3" />
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">No inquiries yet</p>
                        </div>
                    )}
                    {!loading && inquiries.length > 0 && filteredInquiries.length === 0 && (
                        <div className="p-12 text-center">
                            <Inbox size={32} className="text-slate-200 mx-auto mb-3" />
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">No inquiries match these filters</p>
                        </div>
                    )}
                    {filteredInquiries.map((inquiry) => (
                        <button
                            key={inquiry.inquiry_id}
                            onClick={() => openInquiry(inquiry)}
                            className={`w-full text-left p-5 hover:bg-slate-50 transition-colors flex items-start gap-3 ${selected?.inquiry_id === inquiry.inquiry_id ? 'bg-slate-50' : ''}`}
                        >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black uppercase shrink-0 mt-0.5 ${inquiry.status === 'unread' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                                {inquiry.full_name.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2 mb-1">
                                    <p className={`text-sm truncate ${inquiry.status === 'unread' ? 'font-black text-slate-900' : 'font-semibold text-slate-700'}`}>
                                        {inquiry.full_name}
                                    </p>
                                    <ChevronRight size={14} className="text-slate-300 shrink-0" />
                                </div>
                                <p className="text-xs text-slate-500 truncate mb-2">{inquiry.message}</p>
                                <div className="flex items-center gap-2">
                                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${STATUS_STYLES[inquiry.status]}`}>
                                        {inquiry.status}
                                    </span>
                                    <span className="text-[9px] text-slate-300 font-bold">{formatDate(inquiry.created_at)}</span>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Right panel: inquiry detail + reply */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {!selected ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
                        <MessageSquare size={48} className="text-slate-200 mb-4" />
                        <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Select an inquiry to view</p>
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <div className="p-6 border-b border-slate-100 bg-white flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">{selected.full_name}</h2>
                                <div className="flex items-center gap-4 mt-2 flex-wrap">
                                    <a href={`mailto:${selected.email}`} className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold hover:text-slate-900 transition-colors">
                                        <Mail size={13} /> {selected.email}
                                    </a>
                                    {selected.phone && (
                                        <span className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold">
                                            <Phone size={13} /> {selected.phone}
                                        </span>
                                    )}
                                    <span className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold">
                                        <Clock size={13} /> {formatDate(selected.created_at)}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border ${STATUS_STYLES[selected.status]}`}>
                                    {selected.status}
                                </span>
                                <button
                                    onClick={() => handleDelete(selected.inquiry_id)}
                                    className="p-2 hover:bg-rose-50 rounded-xl text-slate-300 hover:text-rose-500 transition-all"
                                    title="Delete inquiry"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Message body */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            <div className="bg-white rounded-2xl border border-slate-100 p-6">
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-3">Message from {selected.full_name}</p>
                                <p className="text-slate-700 text-sm font-medium leading-relaxed whitespace-pre-wrap">{selected.message}</p>
                            </div>

                            {selected.reply_message && (
                                <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-6">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600 mb-3 flex items-center gap-2">
                                        <Send size={11} /> Your reply · {selected.replied_at ? formatDate(selected.replied_at) : ''}
                                    </p>
                                    <p className="text-slate-700 text-sm font-medium leading-relaxed whitespace-pre-wrap">{selected.reply_message}</p>
                                </div>
                            )}
                        </div>

                        {/* Reply compose */}
                        <div className="p-6 border-t border-slate-100 bg-white">
                            {selected.status === 'replied' ? (
                                <p className="text-center text-xs text-slate-400 font-bold uppercase tracking-widest py-2">
                                    Reply already sent — you can reply again if needed
                                </p>
                            ) : null}
                            <div className="flex flex-col gap-3">
                                <div className="relative">
                                    <textarea
                                        rows="4"
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        placeholder={`Reply to ${selected.full_name}...`}
                                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm text-slate-700 focus:ring-4 focus:ring-slate-900/5 outline-none resize-none transition-all font-medium placeholder:text-slate-300"
                                    />
                                </div>
                                <div className="flex justify-between items-center">
                                    <p className="text-[10px] text-slate-400 font-semibold">
                                        Email will be sent to <span className="font-black text-slate-600">{selected.email}</span>
                                    </p>
                                    <button
                                        onClick={handleReply}
                                        disabled={!replyText.trim() || sending}
                                        className="bg-slate-900 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-md active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        <Send size={14} />
                                        {sending ? 'Sending...' : 'Send Reply'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default AdminInquiries;

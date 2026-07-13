import React, { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, Megaphone, Trophy, Hammer, Bell, Clock, Radio } from 'lucide-react';
import Modal from '../../components/common/Modal';
import SearchInput from '../../components/common/SearchInput';
import { apiFetch } from '../../utils/api';

const CATEGORIES = ['GENERAL', 'CHAMPIONSHIP', 'MAINTENANCE', 'CLUB EVENT'];

const CATEGORY_ICONS = {
    CHAMPIONSHIP: <Trophy size={13} />,
    MAINTENANCE:  <Hammer size={13} />,
    'CLUB EVENT': <Bell size={13} />,
    GENERAL:      <Megaphone size={13} />,
};

const CATEGORY_COLORS = {
    CHAMPIONSHIP: 'bg-amber-50 text-amber-700 border-amber-200',
    MAINTENANCE:  'bg-emerald-50 text-emerald-700 border-emerald-200',
    'CLUB EVENT': 'bg-slate-100 text-slate-600 border-slate-200',
    GENERAL:      'bg-blue-50 text-blue-600 border-blue-200',
};

const isScheduled = (publish_at) => publish_at && new Date(publish_at) > new Date();

const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

const formatDateTime = (dateStr) =>
    new Date(dateStr).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

// Convert a UTC datetime string from the DB to a local datetime-local input value
const toLocalInputValue = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const emptyForm = { title: '', category: 'GENERAL', content: '', publish_at: '' };

const AdminAnnouncements = () => {
    const [announcements, setAnnouncements] = useState([]);
    const [filter, setFilter] = useState('all'); // all | live | scheduled
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [formData, setFormData] = useState(emptyForm);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchAnnouncements(); }, []);

    const fetchAnnouncements = async () => {
        setLoading(true);
        try {
            const res = await apiFetch('/api/announcements/admin/all');
            const data = await res.json();
            setAnnouncements(data.data || []);
        } catch (err) {
            console.error('Failed to fetch announcements', err);
        } finally {
            setLoading(false);
        }
    };

    const openCreate = () => {
        setEditing(null);
        setFormData(emptyForm);
        setIsModalOpen(true);
    };

    const openEdit = (a) => {
        setEditing(a);
        setFormData({
            title: a.title,
            category: a.category,
            content: a.content,
            publish_at: toLocalInputValue(a.publish_at),
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const url = editing ? `/api/announcements/${editing.announcement_id}` : '/api/announcements';
        const method = editing ? 'PUT' : 'POST';

        const payload = {
            ...formData,
            publish_at: formData.publish_at ? new Date(formData.publish_at).toISOString() : null,
        };

        const res = await apiFetch(url, { method, body: JSON.stringify(payload) });
        if (res.ok) {
            setIsModalOpen(false);
            fetchAnnouncements();
        } else {
            const err = await res.json();
            alert(err.message || 'Action failed.');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Remove this announcement from the public page? It will be kept in the database.')) return;
        const res = await apiFetch(`/api/announcements/${id}`, { method: 'DELETE' });
        if (res.ok) fetchAnnouncements();
    };

    const filtered = announcements.filter(a => {
        if (filter === 'live' && isScheduled(a.publish_at)) return false;
        if (filter === 'scheduled' && !isScheduled(a.publish_at)) return false;
        const q = search.trim().toLowerCase();
        if (q && ![a.title, a.content].some((v) => v?.toLowerCase().includes(q))) return false;
        return true;
    });

    const scheduledCount = announcements.filter(a => isScheduled(a.publish_at)).length;
    const liveCount = announcements.filter(a => !isScheduled(a.publish_at)).length;

    return (
        <div className="p-8 bg-slate-50 min-h-screen">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Announcements</h1>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 italic">Kandy Garden Club • Registry Board</p>
                </div>
                <button
                    onClick={openCreate}
                    className="bg-slate-900 text-white px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                >
                    <Plus size={16} /> New Announcement
                </button>
            </header>

            {/* Filter tabs */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
                <div className="flex items-center gap-2">
                    {[
                        { key: 'all', label: `All (${announcements.length})` },
                        { key: 'live', label: `Live (${liveCount})`, icon: <Radio size={11} /> },
                        { key: 'scheduled', label: `Scheduled (${scheduledCount})`, icon: <Clock size={11} /> },
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setFilter(tab.key)}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                filter === tab.key
                                    ? 'bg-slate-900 text-white shadow'
                                    : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-300'
                            }`}
                        >
                            {tab.icon}{tab.label}
                        </button>
                    ))}
                </div>
                <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search announcements..." className="w-full md:w-64" />
            </div>

            <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                            <th className="p-6 text-[9px] font-black uppercase text-slate-400 tracking-widest">Announcement</th>
                            <th className="p-6 text-[9px] font-black uppercase text-slate-400 tracking-widest">Category</th>
                            <th className="p-6 text-[9px] font-black uppercase text-slate-400 tracking-widest">Status</th>
                            <th className="p-6 text-[9px] font-black uppercase text-slate-400 tracking-widest">Date</th>
                            <th className="p-6 text-[9px] font-black uppercase text-slate-400 tracking-widest text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {loading && (
                            <tr><td colSpan={5} className="p-12 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">Loading...</td></tr>
                        )}
                        {!loading && filtered.length === 0 && (
                            <tr>
                                <td colSpan={5} className="p-16 text-center">
                                    <Megaphone size={32} className="text-slate-200 mx-auto mb-3" />
                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">No announcements</p>
                                </td>
                            </tr>
                        )}
                        {filtered.map((a) => {
                            const scheduled = isScheduled(a.publish_at);
                            return (
                                <tr key={a.announcement_id} className="group hover:bg-slate-50/50 transition-colors">
                                    <td className="p-6 max-w-xs">
                                        <p className="font-bold text-slate-900 text-sm mb-1 truncate">{a.title}</p>
                                        <p className="text-xs text-slate-400 font-medium line-clamp-2 leading-relaxed">{a.content}</p>
                                    </td>
                                    <td className="p-6">
                                        <span className={`inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${CATEGORY_COLORS[a.category] || CATEGORY_COLORS.GENERAL}`}>
                                            {CATEGORY_ICONS[a.category] || CATEGORY_ICONS.GENERAL}
                                            {a.category}
                                        </span>
                                    </td>
                                    <td className="p-6">
                                        {scheduled ? (
                                            <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border bg-violet-50 text-violet-600 border-violet-200">
                                                <Clock size={11} /> Scheduled
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
                                                <Radio size={11} /> Live
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-6">
                                        {scheduled ? (
                                            <div>
                                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Goes live</p>
                                                <p className="text-xs font-semibold text-violet-600">{formatDateTime(a.publish_at)}</p>
                                            </div>
                                        ) : (
                                            <span className="text-xs font-semibold text-slate-500">
                                                {formatDate(a.publish_at || a.created_at)}
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-6 text-right">
                                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => openEdit(a)}
                                                className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-900 transition-all"
                                                title="Edit"
                                            >
                                                <Edit3 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(a.announcement_id)}
                                                className="p-2.5 hover:bg-rose-50 rounded-xl text-slate-300 hover:text-rose-500 transition-all"
                                                title="Remove"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSubmit}
                title={editing ? 'Edit Announcement' : 'New Announcement'}
                submitText={editing ? 'Save Changes' : (formData.publish_at && new Date(formData.publish_at) > new Date() ? 'Schedule' : 'Publish Now')}
            >
                <div className="space-y-5">
                    <div>
                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest block mb-2 px-1">Title</label>
                        <input
                            required
                            type="text"
                            placeholder="Announcement title"
                            className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:ring-4 focus:ring-slate-900/5 outline-none transition-all"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest block mb-2 px-1">Category</label>
                        <select
                            className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:ring-4 focus:ring-slate-900/5 outline-none transition-all"
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        >
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest block mb-2 px-1">Content</label>
                        <textarea
                            required
                            rows={4}
                            placeholder="Announcement details..."
                            className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:ring-4 focus:ring-slate-900/5 outline-none transition-all resize-none"
                            value={formData.content}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest block mb-2 px-1">
                            Publish Date &amp; Time
                            <span className="ml-2 text-slate-300 normal-case font-semibold tracking-normal">— leave blank to publish immediately</span>
                        </label>
                        <input
                            type="datetime-local"
                            className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:ring-4 focus:ring-slate-900/5 outline-none transition-all"
                            value={formData.publish_at}
                            onChange={(e) => setFormData({ ...formData, publish_at: e.target.value })}
                        />
                        {formData.publish_at && new Date(formData.publish_at) > new Date() && (
                            <p className="mt-2 px-1 text-[10px] font-semibold text-violet-500 flex items-center gap-1.5">
                                <Clock size={11} />
                                Will go live on {formatDateTime(formData.publish_at)}
                            </p>
                        )}
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default AdminAnnouncements;

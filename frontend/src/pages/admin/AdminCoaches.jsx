import React, { useState, useEffect, useMemo } from 'react';
import { UserCheck, Mail, Award, Phone, Settings, Trash2, Plus, X } from 'lucide-react';
import Modal from '../../components/common/Modal';
import SearchInput from '../../components/common/SearchInput';
import FilterSelect from '../../components/common/FilterSelect';
import { apiFetch } from '../../utils/api';

const STATUS_OPTIONS = [
    { value: '', label: 'All Statuses' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'on-leave', label: 'On-Leave' },
];

const AdminCoaches = () => {
    const [coaches, setCoaches] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCoach, setEditingCoach] = useState(null); // Null for Add, Object for Edit
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const filteredCoaches = useMemo(() => {
        const q = search.trim().toLowerCase();
        return coaches.filter((c) => {
            const matchesSearch = !q || [c.full_name, c.email, c.specialization].some((v) => v?.toLowerCase().includes(q));
            const matchesStatus = !statusFilter || c.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [coaches, search, statusFilter]);

    // Form State
    const [formData, setFormData] = useState({
        username: '', password: '', full_name: '',
        email: '', phone: '', specialization: '',
        experience_years: 0, status: 'active'
    });

    useEffect(() => { fetchCoaches(); }, []);

    const fetchCoaches = () => {
        apiFetch('/api/coaches')
            .then(res => res.json())
            .then(res => setCoaches(res.data));
    };

    const handleOpenModal = (coach = null) => {
        if (coach) {
            setEditingCoach(coach);
            setFormData(coach); // Pre-fill for edit
        } else {
            setEditingCoach(null);
            setFormData({ username: '', password: '', full_name: '', email: '', phone: '', specialization: '', experience_years: 0, status: 'active' });
        }
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure? This will also delete the coach's login account.")) return;
        const res = await apiFetch(`/api/coaches/delete/${id}`, { method: 'DELETE' });
        if (res.ok) fetchCoaches();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const url = editingCoach
            ? `/api/coaches/update/${editingCoach.coach_id}`
            : '/api/coaches/add';

        try {
            const res = await apiFetch(url, {
                method: editingCoach ? 'PUT' : 'POST',
                body: JSON.stringify(formData)
            });

            const result = await res.json();

            if (res.ok) {
                setIsModalOpen(false);
                fetchCoaches();
            } else {
                // Show the specific error from Zod or MySQL
                alert(`Error: ${result.message || "Failed to save"}`);
                console.error("Server Error Detail:", result.errors);
            }
        } catch (err) {
            console.error("Network Error:", err);
            alert("Check your internet or server connection.");
        }
    };
    return (
        <div className="p-6">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                {/* Table Header */}
                <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-50/50">
                    <h2 className="text-slate-900 text-xs font-black uppercase tracking-[0.3em]">Coaching Staff</h2>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <FilterSelect value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} options={STATUS_OPTIONS} />
                        <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search coaches..." className="w-full sm:w-56" />
                        <button
                            onClick={() => handleOpenModal()}
                            className="flex items-center justify-center gap-2 text-[10px] bg-slate-900 text-white font-black px-4 py-2 rounded-lg uppercase tracking-widest hover:bg-slate-800 transition-all"
                        >
                            <Plus size={14} /> Add New Coach
                        </button>
                    </div>
                </div>

                {/* List View */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-slate-400 text-[9px] uppercase tracking-widest bg-slate-50/50 border-b border-slate-100">
                                <th className="p-4 font-black">Profile</th>
                                <th className="p-4 font-black">Expertise</th>
                                <th className="p-4 font-black">Status</th>
                                <th className="p-4 font-black text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredCoaches.map((coach) => (
                                <tr key={coach.coach_id} className="hover:bg-slate-50/80 transition-colors group">
                                    <td className="p-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200"><UserCheck size={18} /></div>
                                            <div>
                                                <p className="text-slate-900 text-sm font-bold">{coach.full_name}</p>
                                                <p className="text-[10px] text-slate-400 font-medium">{coach.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2"><Award size={14} className="text-blue-500" /><span className="text-slate-600 text-[10px] font-bold uppercase">{coach.specialization}</span></div>
                                        <p className="text-[9px] text-slate-400 mt-1 uppercase">{coach.experience_years} Years Experience</p>
                                    </td>
                                    <td className="p-4">
                                        <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-full border ${coach.status === 'active' ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 'text-slate-400 bg-slate-50 border-slate-200'}`}>{coach.status}</span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                            <button onClick={() => handleOpenModal(coach)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Settings size={16} /></button>
                                            <button onClick={() => handleDelete(coach.coach_id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredCoaches.length === 0 && (
                        <div className="p-16 text-center">
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">No coaches match these filters</p>
                        </div>
                    )}
                </div>

                {/* Reusable Modal Implementation */}
                <Modal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    title={editingCoach ? 'Edit Coach Profile' : 'Register New Coach'}
                    submitText={editingCoach ? 'Update Profile' : 'Confirm Registration'}
                    onSubmit={handleSubmit}
                >
                    {/* Form Fields as Children */}
                    {!editingCoach && (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Username</label>
                                <input type="text" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-900/5 outline-none"
                                    value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Password</label>
                                <input type="password" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-900/5 outline-none"
                                    value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                            </div>
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Full Name</label>
                        <input type="text" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                            value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Email Address</label>
                            <input type="email" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                                value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Phone Number</label>
                            <input type="text" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                                value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Specialization</label>
                            <input type="text" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                                value={formData.specialization} onChange={(e) => setFormData({ ...formData, specialization: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Experience (Years)</label>
                            <input
                                type="number"
                                required
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                                value={formData.experience_years}
                                // CHANGE THIS LINE:
                                onChange={(e) => setFormData({ ...formData, experience_years: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                    </div>

                    {editingCoach && (
                        <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Status</label>
                            <select className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                                value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="on-leave">On-Leave</option>
                            </select>
                        </div>
                    )}
                </Modal>
            </div>
        </div>
    );
};

export default AdminCoaches;
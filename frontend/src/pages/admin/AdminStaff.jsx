import React, { useState, useEffect, useMemo } from 'react';
import { UserPlus, Edit3, Search, Phone, Mail, ShieldCheck, Lock } from 'lucide-react';
import Modal from '../../components/common/Modal';
import FilterSelect from '../../components/common/FilterSelect';
import { apiFetch } from '../../utils/api';

const TYPE_OPTIONS = [
    { value: '', label: 'All Types' },
    { value: 'admin', label: 'Administrator' },
    { value: 'guard', label: 'Security Guard' },
    { value: 'other', label: 'Other Staff' },
];

const TYPE_LABEL = { admin: 'Administrator', guard: 'Security Guard', other: 'Other Staff' };
const TYPE_BADGE = {
    admin: 'bg-purple-50 text-purple-600 border-purple-100',
    guard: 'bg-blue-50 text-blue-600 border-blue-100',
    other: 'bg-slate-50 text-slate-600 border-slate-100',
};

const emptyFormData = () => ({ full_name: '', email: '', phone: '', staff_type: 'guard', position: '', status: 'active' });

const AdminStaff = () => {
    const [staff, setStaff] = useState([]);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStaff, setEditingStaff] = useState(null);
    const [formData, setFormData] = useState(emptyFormData);

    useEffect(() => { fetchStaff(); }, []);

    const fetchStaff = async () => {
        const res = await apiFetch('/api/staff');
        const data = await res.json();
        setStaff(data.data || []);
    };

    const filteredStaff = useMemo(() => {
        const q = search.trim().toLowerCase();
        return staff.filter((s) => {
            const matchesSearch = !q || [s.full_name, s.email, s.phone].some((v) => v?.toLowerCase().includes(q));
            const matchesType = !typeFilter || s.staff_type === typeFilter;
            return matchesSearch && matchesType;
        });
    }, [staff, search, typeFilter]);

    const handleOpenModal = (member = null) => {
        if (member) {
            setEditingStaff(member);
            setFormData({ ...emptyFormData(), ...member });
        } else {
            setEditingStaff(null);
            setFormData(emptyFormData());
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const url = editingStaff ? `/api/staff/${editingStaff.staff_id}` : '/api/staff';

        const res = await apiFetch(url, {
            method: editingStaff ? 'PUT' : 'POST',
            body: JSON.stringify(formData),
        });

        if (res.ok) {
            setIsModalOpen(false);
            fetchStaff();
        } else {
            const err = await res.json();
            alert(err.message || 'Failed to save staff member.');
        }
    };

    return (
        <div className="p-6">

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm">
                <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-50/50">
                    <div>
                        <h2 className="text-slate-900 text-xs font-black uppercase tracking-[0.3em]">Staff Directory</h2>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Administrators, guards &amp; other personnel</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <FilterSelect value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} options={TYPE_OPTIONS} />
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <input
                                type="text" placeholder="Search staff..." value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-4 focus:ring-slate-900/5 w-full sm:w-56"
                            />
                        </div>
                        <button onClick={() => handleOpenModal()} className="flex items-center justify-center gap-2 text-[10px] bg-slate-900 text-white font-black px-4 py-2 rounded-lg uppercase tracking-widest hover:bg-slate-800 transition-all">
                            <UserPlus size={14} /> Add Staff Member
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-slate-400 text-[9px] uppercase tracking-widest bg-slate-50/50">
                                <th className="p-4 font-black">Staff Member</th>
                                <th className="p-4 font-black">Type</th>
                                <th className="p-4 font-black">Contact</th>
                                <th className="p-4 font-black">Status</th>
                                <th className="p-4 font-black text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredStaff.map((s) => (
                                <tr key={s.staff_id} className="hover:bg-slate-50 group transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                                                <ShieldCheck size={16} />
                                            </div>
                                            <div>
                                                <p className="text-slate-900 text-sm font-bold">{s.full_name}</p>
                                                {s.position && <p className="text-[10px] text-slate-400">{s.position}</p>}
                                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">UID: S-00{s.staff_id}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-md border ${TYPE_BADGE[s.staff_type]}`}>
                                            {TYPE_LABEL[s.staff_type]}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <p className="text-[11px] text-slate-600 font-medium">{s.email || '—'}</p>
                                        <p className="text-[10px] text-slate-400">{s.phone || '—'}</p>
                                    </td>
                                    <td className="p-4">
                                        <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-full border ${s.status === 'active' ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 'text-amber-600 bg-amber-50 border-amber-100'}`}>{s.status}</span>
                                    </td>
                                    <td className="p-4 text-right">
                                        {s.staff_type === 'admin' ? (
                                            <div className="flex justify-end gap-1.5 text-slate-300" title="Administrators are managed from Access Management">
                                                <Lock size={14} />
                                            </div>
                                        ) : (
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                <button onClick={() => handleOpenModal(s)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit3 size={16} /></button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredStaff.length === 0 && (
                        <div className="p-16 text-center">
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">No staff match these filters</p>
                        </div>
                    )}
                </div>

                <Modal
                    isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}
                    title={editingStaff ? 'Edit Staff Member' : 'Add Staff Member'}
                    submitText={editingStaff ? 'Update' : 'Add'}
                    onSubmit={handleSubmit}
                >
                    <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-slate-400">Full Name</label>
                        <input type="text" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                            value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-slate-400">Role</label>
                            <select className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                                value={formData.staff_type} onChange={(e) => setFormData({ ...formData, staff_type: e.target.value })}>
                                <option value="guard">Security Guard</option>
                                <option value="other">Other Staff</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-slate-400">Position (optional)</label>
                            <input type="text" placeholder="e.g. Head of Security" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                                value={formData.position} onChange={(e) => setFormData({ ...formData, position: e.target.value })} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-slate-400">Email (optional)</label>
                            <input type="email" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                                value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-slate-400">Phone</label>
                            <input type="tel" placeholder="07XXXXXXXX or +947XXXXXXXX" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                                value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required />
                        </div>
                    </div>
                    {editingStaff && (
                        <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-slate-400">Status</label>
                            <select className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                                value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="suspended">Suspended</option>
                            </select>
                        </div>
                    )}
                </Modal>
            </div>
        </div>
    );
};

export default AdminStaff;

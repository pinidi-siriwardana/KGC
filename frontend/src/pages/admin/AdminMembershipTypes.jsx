import React, { useState, useEffect } from 'react';
import { Trophy, Pencil, Trash2, Plus } from 'lucide-react';
import Modal from '../../components/common/Modal';
import { apiFetch } from '../../utils/api';

const AdminMembershipTypes = () => {
    const [types, setTypes] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingType, setEditingType] = useState(null);
    const [formData, setFormData] = useState({ name: '', duration_months: '', price: '' });

    useEffect(() => { fetchTypes(); }, []);

    const fetchTypes = async () => {
        const res = await apiFetch('/api/membership-types');
        const data = await res.json();
        setTypes(data.data || []);
    };

    const handleOpenModal = (type = null) => {
        if (type) {
            setEditingType(type);
            setFormData({ name: type.name, duration_months: type.duration_months, price: type.price });
        } else {
            setEditingType(null);
            setFormData({ name: '', duration_months: '', price: '' });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const url = editingType ? `/api/membership-types/${editingType.membership_type_id}` : '/api/membership-types';

        const res = await apiFetch(url, {
            method: editingType ? 'PUT' : 'POST',
            body: JSON.stringify(formData)
        });

        if (res.ok) {
            setIsModalOpen(false);
            fetchTypes();
        } else {
            const err = await res.json();
            alert(err.message || 'Failed to save plan.');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this membership plan?')) return;

        const res = await apiFetch(`/api/membership-types/${id}`, { method: 'DELETE' });

        if (res.ok) {
            fetchTypes();
        } else {
            const err = await res.json();
            alert(err.message || 'Failed to delete plan.');
        }
    };

    return (
        <div className="p-6">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <h2 className="text-slate-900 text-xs font-black uppercase tracking-[0.3em]">Membership Plans</h2>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Subscription Tiers &amp; Pricing</p>
                    </div>
                    <button onClick={() => handleOpenModal()} className="flex items-center gap-2 text-[10px] bg-slate-900 text-white font-black px-4 py-2 rounded-lg uppercase tracking-widest hover:bg-slate-800 transition-all">
                        <Plus size={14} /> Add Plan
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-slate-400 text-[9px] uppercase tracking-widest bg-slate-50/50">
                                <th className="p-4 font-black">Plan</th>
                                <th className="p-4 font-black">Duration</th>
                                <th className="p-4 font-black">Price</th>
                                <th className="p-4 font-black text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {types.map((type) => (
                                <tr key={type.membership_type_id} className="hover:bg-slate-50 group transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                                                <Trophy size={16} />
                                            </div>
                                            <p className="text-slate-900 text-sm font-bold">{type.name}</p>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <p className="text-[11px] text-slate-600 font-medium">{type.duration_months} months</p>
                                    </td>
                                    <td className="p-4">
                                        <p className="text-slate-900 text-sm font-bold font-mono">LKR {type.price}</p>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                            <button onClick={() => handleOpenModal(type)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Pencil size={16} /></button>
                                            <button onClick={() => handleDelete(type.membership_type_id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {types.length === 0 && (
                        <div className="p-16 text-center">
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">No membership plans yet</p>
                        </div>
                    )}
                </div>

                <Modal
                    isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}
                    title={editingType ? 'Edit Membership Plan' : 'Add Membership Plan'}
                    onSubmit={handleSubmit}
                    submitText={editingType ? 'Update Plan' : 'Create Plan'}
                >
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Plan Name</label>
                            <input type="text" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-slate-400 transition-all"
                                value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Duration (Months)</label>
                                <input type="number" min="1" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-slate-400 transition-all"
                                    value={formData.duration_months} onChange={(e) => setFormData({ ...formData, duration_months: e.target.value })} required />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Price (LKR)</label>
                                <input type="number" min="0" step="0.01" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-slate-400 transition-all"
                                    value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} required />
                            </div>
                        </div>
                    </div>
                </Modal>
            </div>
        </div>
    );
};

export default AdminMembershipTypes;

import React, { useState, useEffect } from 'react';
import { UserCheck, Shield, UserCog, Trash2, Plus, Mail, MoreVertical } from 'lucide-react';
import Modal from '../../components/common/Modal';
import { apiFetch } from '../../utils/api';

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({ username: '', password: '', role: 'member', status: 'active' });

    useEffect(() => { fetchUsers(); }, []);

    const fetchUsers = async () => {
        try {
            const res = await apiFetch('/api/users');

            // Check if the response is actually OK (200)
            if (!res.ok) {
                throw new Error(`Server responded with ${res.status}`);
            }

            const data = await res.json();
            setUsers(data.data || []);
        } catch (err) {
            console.error("Failed to fetch users:", err.message);
            // Optionally set an error state here to show in the UI
        }
    };
    const handleOpenModal = (user = null) => {
        if (user) {
            setEditingUser(user);
            setFormData({ ...user, password: '' }); // Don't pre-fill password for security
        } else {
            setEditingUser(null);
            setFormData({ username: '', password: '', role: 'member', status: 'active' });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const url = editingUser ? `/api/users/update/${editingUser.user_id}` : '/api/users/add';
        const method = editingUser ? 'PUT' : 'POST';

        const res = await apiFetch(url, {
            method,
            body: JSON.stringify(formData)
        });

        if (res.ok) {
            setIsModalOpen(false);
            fetchUsers();
        }
    };

    // 1. Add this function inside your AdminUsers component
    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this user? This cannot be undone.")) {
            try {
                const res = await apiFetch(`/api/users/delete/${id}`, {
                    method: 'DELETE',
                });

                if (res.ok) {
                    // Refresh the list after successful deletion
                    fetchUsers();
                } else {
                    alert("Failed to delete user. Check backend console.");
                }
            } catch (err) {
                console.error("Delete error:", err);
            }
        }
    };



    return (
        <div className="p-6">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <h2 className="text-slate-900 text-xs font-black uppercase tracking-[0.3em]">Access Management</h2>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Control system roles and login permissions</p>
                    </div>
                    <button onClick={() => handleOpenModal()} className="flex items-center gap-2 text-[10px] bg-slate-900 text-white font-black px-4 py-2 rounded-lg uppercase tracking-widest hover:bg-slate-800 transition-all">
                        <Plus size={14} /> Create New User
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-slate-400 text-[9px] uppercase tracking-widest bg-slate-50/50">
                                <th className="p-4 font-black">Identity</th>
                                <th className="p-4 font-black">Access Level</th>
                                <th className="p-4 font-black">Status</th>
                                <th className="p-4 font-black text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {users.map((u) => (
                                <tr key={u.user_id} className="hover:bg-slate-50 group transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                                                {u.role === 'admin' ? <Shield size={16} /> : <UserCog size={16} />}
                                            </div>
                                            <p className="text-slate-900 text-sm font-bold">{u.username}</p>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-md border ${u.role === 'admin' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                                                u.role === 'coach' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-slate-50 text-slate-600 border-slate-100'
                                            }`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-1.5">
                                            <div className={`w-1.5 h-1.5 rounded-full ${u.status === 'active' ? 'bg-emerald-500' : u.status === 'pending' ? 'bg-amber-500' : 'bg-rose-500'}`} />
                                            <p className="text-[10px] font-black uppercase text-slate-600 tracking-tighter">{u.status}</p>
                                        </div>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                            <button onClick={() => handleOpenModal(u)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><UserCheck size={16} /></button>
                                            <button
                                                onClick={() => handleDelete(u.user_id)} // Make sure it's user_id, not id
                                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* User Management Modal */}
                <Modal
                    isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}
                    title={editingUser ? 'Modify User Access' : 'Create New Access Account'}
                    onSubmit={handleSubmit}
                    submitText={editingUser ? 'Update Permissions' : 'Create Account'}
                >
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Username</label>
                            <input type="text" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-slate-400 transition-all"
                                value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} required />
                        </div>

                        {!editingUser && (
                            <div className="space-y-1">
                                <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Temporary Password</label>
                                <input type="password" placeholder="••••••••" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-slate-400 transition-all"
                                    value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[9px] font-black uppercase text-slate-400 ml-1">System Role</label>
                                <select className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none appearance-none cursor-pointer"
                                    value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
                                    <option value="member">Member</option>
                                    <option value="coach">Coach</option>
                                    <option value="admin">Administrator</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Account Status</label>
                                <select className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none appearance-none cursor-pointer"
                                    value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                                    <option value="active">Active</option>
                                    <option value="pending">Pending</option>
                                    <option value="disabled">Disabled</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </Modal>
            </div>
        </div>
    );
};

export default AdminUsers;
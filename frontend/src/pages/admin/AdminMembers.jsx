import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Settings, Trash2, Plus, ShieldCheck } from 'lucide-react';
import Modal from '../../components/common/Modal';
import { apiFetch } from '../../utils/api';

const AdminMembers = () => {
  const [members, setMembers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [formData, setFormData] = useState({
    username: '', password: '', full_name: '', email: '', phone: '', status: 'active'
  });

  useEffect(() => { fetchMembers(); }, []);

  const fetchMembers = async () => {
    const res = await apiFetch('/api/members');
    const data = await res.json();
    setMembers(data.data || []);
  };

  const handleOpenModal = (member = null) => {
    if (member) {
      setEditingMember(member);
      setFormData(member);
    } else {
      setEditingMember(null);
      setFormData({ username: '', password: '', full_name: '', email: '', phone: '', status: 'active' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = editingMember
      ? `/api/members/update/${editingMember.member_id}`
      : '/api/members/add';

    const res = await apiFetch(url, {
      method: editingMember ? 'PUT' : 'POST',
      body: JSON.stringify(formData)
    });

    if (res.ok) {
      setIsModalOpen(false);
      fetchMembers();
    } else {
      alert("Error saving member.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete member and login account?")) return;
    await apiFetch(`/api/members/delete/${id}`, { method: 'DELETE' });
    fetchMembers();
  };

  return (
    <div className="p-6">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-slate-900 text-xs font-black uppercase tracking-[0.3em]">Club Members</h2>
          <button onClick={() => handleOpenModal()} className="flex items-center gap-2 text-[10px] bg-slate-900 text-white font-black px-4 py-2 rounded-lg uppercase tracking-widest hover:bg-slate-800 transition-all">
            <Plus size={14} /> Add New Member
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-400 text-[9px] uppercase tracking-widest bg-slate-50/50">
                <th className="p-4 font-black">Member</th>
                <th className="p-4 font-black">Contact</th>
                <th className="p-4 font-black">Status</th>
                <th className="p-4 font-black text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {members.map((m) => (
                <tr key={m.member_id} className="hover:bg-slate-50 group transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500"><User size={16} /></div>
                      <p className="text-slate-900 text-sm font-bold">{m.full_name}</p>
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="text-[11px] text-slate-600 font-medium">{m.email}</p>
                    <p className="text-[10px] text-slate-400">{m.phone}</p>
                  </td>
                  <td className="p-4">
                    <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-full border ${m.status === 'active' ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 'text-amber-600 bg-amber-50 border-amber-100'}`}>{m.status}</span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={() => handleOpenModal(m)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Settings size={16} /></button>
                      <button onClick={() => handleDelete(m.member_id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Modal 
          isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}
          title={editingMember ? 'Edit Member' : 'Add Member'}
          submitText={editingMember ? 'Update' : 'Register'}
          onSubmit={handleSubmit}
        >
          {!editingMember && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-400">Username</label>
                <input type="text" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none" 
                  value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} required />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-400">Password</label>
                <input type="password" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none" 
                  value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required />
              </div>
            </div>
          )}
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase text-slate-400">Full Name</label>
            <input type="text" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none" 
              value={formData.full_name} onChange={(e) => setFormData({...formData, full_name: e.target.value})} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-slate-400">Email</label>
              <input type="email" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none" 
                value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-slate-400">Phone</label>
              <input type="text" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none" 
                value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} required />
            </div>
          </div>
          {editingMember && (
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-slate-400">Status</label>
              <select className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none" 
                value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
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

export default AdminMembers;
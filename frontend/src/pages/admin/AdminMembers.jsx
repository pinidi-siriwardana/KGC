import React, { useState, useEffect, useMemo } from 'react';
import { User, Mail, Phone, Settings, Trash2, Plus, ShieldCheck } from 'lucide-react';
import Modal from '../../components/common/Modal';
import MembershipStatusBadge from '../../components/common/MembershipStatusBadge';
import SearchInput from '../../components/common/SearchInput';
import FilterSelect from '../../components/common/FilterSelect';
import { apiFetch } from '../../utils/api';
import { todayISO } from '../../utils/date';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'suspended', label: 'Suspended' },
];

const formatDate = (dateStr) =>
  dateStr ? new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

const emptyFormData = () => ({
  username: '', password: '', full_name: '', email: '', phone: '', status: 'active',
  membership_type_id: '', start_date: todayISO(),
});

const AdminMembers = () => {
  const [members, setMembers] = useState([]);
  const [membershipTypes, setMembershipTypes] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [formData, setFormData] = useState(emptyFormData);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filteredMembers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return members.filter((m) => {
      const matchesSearch = !q || [m.full_name, m.email, m.phone].some((v) => v?.toLowerCase().includes(q));
      const matchesStatus = !statusFilter || m.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [members, search, statusFilter]);

  const fetchMembers = async () => {
    const res = await apiFetch('/api/members');
    const data = await res.json();
    setMembers(data.data || []);
  };

  useEffect(() => {
    apiFetch('/api/members').then((res) => res.json()).then((data) => setMembers(data.data || []));
    apiFetch('/api/membership-types').then((res) => res.json()).then((data) => setMembershipTypes(data.data || []));
  }, []);

  const handleOpenModal = (member = null) => {
    if (member) {
      setEditingMember(member);
      setFormData({
        ...member,
        membership_type_id: member.membership_type_id || '',
        start_date: member.membership_start_date ? member.membership_start_date.slice(0, 10) : todayISO(),
      });
    } else {
      setEditingMember(null);
      setFormData(emptyFormData());
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

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err.message || "Error saving member.");
      return;
    }

    // Editing an existing member doesn't touch their plan via /update — that
    // goes through the dedicated membership endpoint so the linked payment
    // stays in sync, and only runs if a plan is actually selected.
    if (editingMember && formData.membership_type_id) {
      const planRes = await apiFetch(`/api/members/${editingMember.member_id}/membership`, {
        method: 'PUT',
        body: JSON.stringify({ membership_type_id: formData.membership_type_id, start_date: formData.start_date }),
      });
      if (!planRes.ok) {
        const err = await planRes.json().catch(() => ({}));
        alert(err.message || "Member details saved, but updating the plan failed.");
      }
    }

    setIsModalOpen(false);
    fetchMembers();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete member and login account?")) return;
    const res = await apiFetch(`/api/members/delete/${id}`, { method: 'DELETE' });
    if (res.ok) {
      fetchMembers();
    } else {
      const err = await res.json();
      alert(err.message || 'Failed to delete member.');
    }
  };

  return (
    <div className="p-6">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-50/50">
          <h2 className="text-slate-900 text-xs font-black uppercase tracking-[0.3em]">Club Members</h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <FilterSelect value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} options={STATUS_OPTIONS} />
            <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search members..." className="w-full sm:w-56" />
            <button onClick={() => handleOpenModal()} className="flex items-center justify-center gap-2 text-[10px] bg-slate-900 text-white font-black px-4 py-2 rounded-lg uppercase tracking-widest hover:bg-slate-800 transition-all">
              <Plus size={14} /> Add New Member
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-400 text-[9px] uppercase tracking-widest bg-slate-50/50">
                <th className="p-4 font-black">Member</th>
                <th className="p-4 font-black">Contact</th>
                <th className="p-4 font-black">Membership</th>
                <th className="p-4 font-black">Status</th>
                <th className="p-4 font-black text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMembers.map((m) => (
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
                    <p className="text-[11px] text-slate-700 font-bold">{m.membership_plan || '—'}</p>
                    <p className="text-[10px] text-slate-400 mb-1">Exp: {formatDate(m.membership_end_date)}</p>
                    <MembershipStatusBadge endDate={m.membership_end_date} isExpired={m.is_expired} />
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
          {filteredMembers.length === 0 && (
            <div className="p-16 text-center">
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">No members match these filters</p>
            </div>
          )}
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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-slate-400">Membership Plan</label>
              <select className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                value={formData.membership_type_id} onChange={(e) => setFormData({...formData, membership_type_id: e.target.value})}>
                <option value="">No plan yet — pay later</option>
                {membershipTypes.map((t) => (
                  <option key={t.membership_type_id} value={t.membership_type_id}>
                    {t.name} — LKR {t.price} / {t.duration_months}mo
                  </option>
                ))}
              </select>
              <p className="text-[9px] text-slate-400">
                {editingMember
                  ? 'Changing the plan updates the matching payment to the new price.'
                  : 'Selecting a plan records it as paid. Leave unselected to add the plan and payment later.'}
              </p>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-slate-400">Start Date</label>
              <input type="date" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                value={formData.start_date} onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                disabled={!formData.membership_type_id} />
            </div>
          </div>
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
              <input type="tel" placeholder="07XXXXXXXX or +947XXXXXXXX" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
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
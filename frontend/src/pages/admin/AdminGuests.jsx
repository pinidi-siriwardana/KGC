import React, { useState, useEffect, useRef } from 'react';
import { UserPlus, Edit3, Trash2, Search, Phone, Mail, RotateCcw } from 'lucide-react';
import Modal from '../../components/common/Modal';
import { apiFetch, parseErrorMessage } from '../../utils/api';

const UNDO_TIMEOUT_MS = 8000;

const GuestDashboard = () => {
    const [guests, setGuests] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingGuest, setEditingGuest] = useState(null);
    const [formData, setFormData] = useState({ full_name: '', phone: '', email: '' });
    const [undoInfo, setUndoInfo] = useState(null);
    const [loadError, setLoadError] = useState('');
    const undoTimerRef = useRef(null);

    useEffect(() => () => clearTimeout(undoTimerRef.current), []);

    // Initial Load
    useEffect(() => { 
        fetchGuests(); 
    }, []);

    // 1. GET GUESTS (Updated to support Backend Search)
const fetchGuests = async (searchQuery = "") => {
    try {
        const url = searchQuery
            ? `/api/guests?search=${encodeURIComponent(searchQuery)}`
            : `/api/guests`;

        const res = await apiFetch(url);
        const data = await res.json();

        // Only set state if the data is actually an array — a non-ok
        // response sends {message, error} instead, which must not be
        // treated as "genuinely zero guests" (that's what an admin would
        // see otherwise: an empty directory with no indication anything
        // went wrong).
        if (res.ok && Array.isArray(data)) {
            setGuests(data);
            setLoadError('');
        } else {
            setGuests([]);
            setLoadError(data?.message || 'Failed to load guests.');
        }
    } catch {
        setGuests([]);
        setLoadError('Failed to load guests. Check your internet or server connection.');
    }
};

    // 2. SEARCH HANDLER (Triggers Backend Search)
    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        fetchGuests(value); // Calls the backend controller with the search query
    };

    const handleOpenModal = (guest = null) => {
        if (guest) {
            setEditingGuest(guest);
            setFormData({ full_name: guest.full_name, phone: guest.phone, email: guest.email || '' });
        } else {
            setEditingGuest(null);
            setFormData({ full_name: '', phone: '', email: '' });
        }
        setIsModalOpen(true);
    };

    // 3. ADD & UPDATE (Matches your POST and PUT routes)
    const handleFormSubmit = async (e) => {
        e.preventDefault();
        const isUpdate = !!editingGuest;
        
        // Matches your controller params: req.params.id
        const url = isUpdate
            ? `/api/guests/${editingGuest.guest_id}`
            : '/api/guests';

        const res = await apiFetch(url, {
            method: isUpdate ? 'PUT' : 'POST',
            body: JSON.stringify(formData)
        });

        if (res.ok) {
            setIsModalOpen(false);
            fetchGuests(searchTerm); // Refresh with current search context
        } else {
            alert(await parseErrorMessage(res, "Action failed"));
        }
    };

    // 4. DELETE (soft-delete — the guest can be brought back with Undo)
    const handleDelete = async (guest) => {
        if (!window.confirm(`Remove ${guest.full_name} from the guest directory?`)) return;

        try {
            const res = await apiFetch(`/api/guests/${guest.guest_id}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                fetchGuests(searchTerm); // Refresh list
                clearTimeout(undoTimerRef.current);
                setUndoInfo({ guest_id: guest.guest_id, full_name: guest.full_name });
                undoTimerRef.current = setTimeout(() => setUndoInfo(null), UNDO_TIMEOUT_MS);
            } else {
                alert(await parseErrorMessage(res, "Delete failed"));
            }
        } catch {
            alert("Check your internet or server connection.");
        }
    };

    const handleUndoDelete = async () => {
        if (!undoInfo) return;
        clearTimeout(undoTimerRef.current);

        const res = await apiFetch(`/api/guests/${undoInfo.guest_id}/restore`, { method: 'PATCH' });
        if (res.ok) {
            setUndoInfo(null);
            fetchGuests(searchTerm);
        } else {
            alert(await parseErrorMessage(res, "Restore failed"));
        }
    };

    return (
        <div className="p-8 bg-slate-50 min-h-screen">
            {loadError && (
                <div className="mb-6 flex items-center justify-between gap-4 bg-rose-50 border border-rose-100 text-rose-700 text-xs font-bold px-4 py-3 rounded-2xl">
                    <span>{loadError}</span>
                    <button onClick={() => fetchGuests(searchTerm)} className="shrink-0 uppercase tracking-widest text-[10px] underline hover:no-underline">Retry</button>
                </div>
            )}
            {undoInfo && (
                <div className="mb-6 flex items-center gap-4 bg-slate-900 text-white rounded-2xl px-5 py-3.5 shadow-lg">
                    <p className="text-xs font-semibold flex-1">
                        <span className="font-black">{undoInfo.full_name}</span> removed from the guest directory.
                    </p>
                    <button
                        onClick={handleUndoDelete}
                        className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-all"
                    >
                        <RotateCcw size={12} /> Undo
                    </button>
                </div>
            )}

            <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter text-glow">Guest Directory</h1>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 italic">Kandy Garden Club Ecosystem</p>
                </div>

                <div className="flex gap-3 w-full md:w-auto">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search by name or phone..."
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-slate-900/5 outline-none transition-all shadow-sm"
                            value={searchTerm}
                            onChange={handleSearchChange} 
                        />
                    </div>
                    <button
                        onClick={() => handleOpenModal()}
                        className="bg-slate-900 text-white px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                    >
                        <UserPlus size={16} /> New Entry
                    </button>
                </div>
            </header>

            <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                            <th className="p-6 text-[9px] font-black uppercase text-slate-400 tracking-widest">Profile</th>
                            <th className="p-6 text-[9px] font-black uppercase text-slate-400 tracking-widest">Contact details</th>
                            <th className="p-6 text-[9px] font-black uppercase text-slate-400 tracking-widest text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {guests.map((guest) => (
                            <tr key={guest.guest_id} className="group hover:bg-slate-50/50 transition-colors">
                                <td className="p-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 text-xs font-black uppercase">
                                            {guest.full_name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 text-sm">{guest.full_name}</p>
                                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">UID: G-00{guest.guest_id}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-6">
                                    <div className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
                                        <span className="flex items-center gap-2"><Phone size={12} className="text-slate-300" /> {guest.phone}</span>
                                        <span className="flex items-center gap-2 text-slate-400 font-medium"><Mail size={12} /> {guest.email || 'No email provided'}</span>
                                    </div>
                                </td>
                                <td className="p-6 text-right">
                                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={() => handleOpenModal(guest)} 
                                            className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-900 transition-all"
                                            title="Edit Profile"
                                        >
                                            <Edit3 size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(guest)}
                                            className="p-2.5 hover:bg-rose-50 rounded-xl text-slate-300 hover:text-rose-500 transition-all"
                                            title="Delete Guest"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {guests.length === 0 && (
                    <div className="p-20 text-center">
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">No guests found in the system</p>
                    </div>
                )}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleFormSubmit}
                title={editingGuest ? "Modify Guest Identity" : "Create Guest Identity"}
                submitText={editingGuest ? "Update Records" : "Confirm & Save"}
            >
                <div className="space-y-5">
                    <div className="group">
                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest block mb-2 px-1">Legal Full Name</label>
                        <input
                            required
                            type="text"
                            placeholder="e.g. John Doe"
                            className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:ring-4 focus:ring-slate-900/5 focus:border-slate-200 outline-none transition-all"
                            value={formData.full_name}
                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest block mb-2 px-1">Primary Mobile</label>
                        <input
                            required
                            type="tel"
                            placeholder="07XXXXXXXX or +947XXXXXXXX"
                            className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:ring-4 focus:ring-slate-900/5 focus:border-slate-200 outline-none transition-all"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest block mb-2 px-1">Email (Electronic Mail)</label>
                        <input
                            type="email"
                            placeholder="optional@email.com"
                            className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:ring-4 focus:ring-slate-900/5 focus:border-slate-200 outline-none transition-all"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default GuestDashboard;
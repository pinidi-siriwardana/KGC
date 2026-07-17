import React, { useState, useEffect, useMemo } from 'react';
import { Trophy, Settings, Hammer, CheckCircle, Activity, Camera, Loader2 } from 'lucide-react';
import SearchInput from '../../components/common/SearchInput';
import FilterSelect from '../../components/common/FilterSelect';
import { apiFetch, API_URL, parseErrorMessage } from '../../utils/api';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'available', label: 'Available' },
  { value: 'maintenance', label: 'Maintenance' },
];

const AdminCourts = () => {
  const [courts, setCourts] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [uploadingPhotoFor, setUploadingPhotoFor] = useState(null);
  const [photoErrors, setPhotoErrors] = useState({});
  const [brokenPhotos, setBrokenPhotos] = useState({});

  const filteredCourts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return courts.filter((c) => {
      const matchesSearch = !q || [c.court_name, c.court_type].some((v) => v?.toLowerCase().includes(q));
      const matchesStatus = !statusFilter || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [courts, search, statusFilter]);

  // Fetch initial court data from our new API
  useEffect(() => {
    apiFetch('/api/courts/all')
      .then(res => res.json())
      .then(res => setCourts(res.data))
      .catch(err => console.error("Error loading courts:", err));
  }, []);

  // Uploads immediately on file select, same pattern as the coach photo
  // upload — no add/edit form exists for courts, so this is its own
  // dedicated action rather than part of a larger save.
  const handlePhotoUpload = async (court_id, file) => {
    if (!file) return;
    setUploadingPhotoFor(court_id);
    setPhotoErrors((e) => ({ ...e, [court_id]: '' }));

    const body = new FormData();
    body.append('photo', file);

    const res = await apiFetch(`/api/courts/${court_id}/photo`, { method: 'POST', body });
    setUploadingPhotoFor(null);

    if (res.ok) {
      const data = await res.json();
      setCourts((cs) => cs.map((c) => (c.court_id === court_id ? { ...c, photo_url: data.photo_url } : c)));
      setBrokenPhotos((b) => ({ ...b, [court_id]: false }));
    } else {
      const message = await parseErrorMessage(res, 'Failed to upload photo.');
      setPhotoErrors((e) => ({ ...e, [court_id]: message }));
    }
  };

  // Handle status toggle (Available vs Maintenance)
  const handleStatusToggle = async (id, currentStatus) => {
    const newStatus = currentStatus === 'available' ? 'maintenance' : 'available';
    
    const res = await apiFetch(`/api/courts/status/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status: newStatus })
    });

    if (res.ok) {
      // Optimistic UI update
      setCourts(courts.map(court => 
        court.court_id === id ? { ...court, status: newStatus } : court
      ));
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Header Section */}
      <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-50/50">
        <div>
          <h2 className="text-slate-900 text-xs font-black uppercase tracking-[0.3em]">Court Management</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">KGC Facility Overview</p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <FilterSelect value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} options={STATUS_OPTIONS} />
          <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search courts..." className="w-full sm:w-56" />
          <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-3 py-1 rounded-full uppercase border border-blue-100 flex items-center gap-2 whitespace-nowrap">
            <Activity size={12} /> {courts.length} Registered Tracks
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-slate-400 text-[9px] uppercase tracking-widest bg-slate-50/50">
              <th className="p-4 font-black">Resource Name</th>
              <th className="p-4 font-black">Surface Type</th>
              <th className="p-4 font-black">Current Status</th>
              <th className="p-4 font-black text-right">Operational Control</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredCourts.map((court) => (
              <tr key={court.court_id} className="hover:bg-slate-50 group transition-colors">
                {/* Court Name column */}
                <td className="p-4">
                  <div className="flex items-center gap-4">
                    {court.photo_url && !brokenPhotos[court.court_id] ? (
                      <img
                        src={`${API_URL}${court.photo_url}`}
                        alt={court.court_name}
                        onError={() => setBrokenPhotos((b) => ({ ...b, [court.court_id]: true }))}
                        className="w-10 h-10 rounded-xl object-cover border border-slate-200"
                      />
                    ) : (
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-colors ${
                        court.status === 'available'
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                        : 'bg-slate-100 text-slate-400 border-slate-200'
                      }`}>
                        <Trophy size={18} />
                      </div>
                    )}
                    <div>
                      <p className="text-slate-900 text-sm font-bold tracking-tight">{court.court_name}</p>
                      <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest">ID: KGC-CT-{court.court_id}</p>
                      {photoErrors[court.court_id] && (
                        <p className="text-[9px] text-red-500 font-bold mt-0.5">{photoErrors[court.court_id]}</p>
                      )}
                    </div>
                  </div>
                </td>

                {/* Surface Type column */}
                <td className="p-4">
                   <span className="text-slate-600 text-[10px] font-bold uppercase tracking-tighter bg-slate-100 px-2 py-1 rounded border border-slate-200">
                      {court.court_type}
                   </span>
                </td>

                {/* Status column */}
                <td className="p-4">
                  {court.status === 'available' ? (
                    <div className="flex items-center gap-2 text-emerald-600">
                      <CheckCircle size={14} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Available</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-amber-600">
                      <Hammer size={14} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Maintenance</span>
                    </div>
                  )}
                </td>

                {/* Actions column */}
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                    <button 
                      onClick={() => handleStatusToggle(court.court_id, court.status)}
                      title={court.status === 'available' ? "Move to Maintenance" : "Make Available"}
                      className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all border ${
                        court.status === 'available' 
                        ? 'text-amber-600 bg-amber-50 border-amber-100 hover:bg-amber-600 hover:text-white' 
                        : 'text-emerald-600 bg-emerald-50 border-emerald-100 hover:bg-emerald-600 hover:text-white'
                      }`}
                    >
                      {court.status === 'available' ? <Settings size={18} /> : <CheckCircle size={18} />}
                    </button>
                    
                    <label
                      title={court.photo_url ? 'Change Photo' : 'Upload Photo'}
                      className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all border cursor-pointer ${
                        uploadingPhotoFor === court.court_id
                          ? 'text-slate-300 bg-slate-50 border-slate-100'
                          : 'text-slate-400 bg-slate-50 hover:bg-slate-900 hover:text-white border-slate-100'
                      }`}
                    >
                      {uploadingPhotoFor === court.court_id ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        disabled={uploadingPhotoFor === court.court_id}
                        onChange={(e) => handlePhotoUpload(court.court_id, e.target.files[0])}
                      />
                    </label>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredCourts.length === 0 && (
          <div className="p-20 text-center italic text-slate-300 text-xs tracking-[0.2em] uppercase font-medium">
            {courts.length === 0 ? 'No court data found in system registry.' : 'No courts match these filters.'}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCourts;
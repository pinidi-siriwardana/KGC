import React, { useState, useEffect } from 'react';
import { Trophy, Settings, Hammer, CheckCircle, Activity, ShieldAlert } from 'lucide-react';
import { apiFetch } from '../../utils/api';

const AdminCourts = () => {
  const [courts, setCourts] = useState([]);

  // Fetch initial court data from our new API
  useEffect(() => {
    apiFetch('/api/courts/all')
      .then(res => res.json())
      .then(res => setCourts(res.data))
      .catch(err => console.error("Error loading courts:", err));
  }, []);

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
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <div>
          <h2 className="text-slate-900 text-xs font-black uppercase tracking-[0.3em]">Court Management</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">KGC Facility Overview</p>
        </div>
        <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-3 py-1 rounded-full uppercase border border-blue-100 flex items-center gap-2">
          <Activity size={12} /> {courts.length} Registered Tracks
        </span>
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
            {courts.map((court) => (
              <tr key={court.court_id} className="hover:bg-slate-50 group transition-colors">
                {/* Court Name column */}
                <td className="p-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-colors ${
                      court.status === 'available' 
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                      : 'bg-slate-100 text-slate-400 border-slate-200'
                    }`}>
                      <Trophy size={18} />
                    </div>
                    <div>
                      <p className="text-slate-900 text-sm font-bold tracking-tight">{court.court_name}</p>
                      <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest">ID: KGC-CT-{court.court_id}</p>
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
                    
                    <button className="w-10 h-10 flex items-center justify-center text-slate-400 bg-slate-50 hover:bg-slate-900 hover:text-white rounded-xl transition-all border border-slate-100">
                      <ShieldAlert size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {courts.length === 0 && (
          <div className="p-20 text-center italic text-slate-300 text-xs tracking-[0.2em] uppercase font-medium">
            No court data found in system registry.
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCourts;
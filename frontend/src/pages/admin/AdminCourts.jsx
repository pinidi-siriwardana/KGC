import React, { useState, useEffect, useMemo } from 'react';
import { Trophy, Activity, Camera, Loader2, CalendarClock } from 'lucide-react';
import SearchInput from '../../components/common/SearchInput';
import Modal from '../../components/common/Modal';
import { apiFetch, API_URL, parseErrorMessage } from '../../utils/api';
import { todayISO } from '../../utils/date';

const AdminCourts = () => {
  const [courts, setCourts] = useState([]);
  const [search, setSearch] = useState('');
  const [uploadingPhotoFor, setUploadingPhotoFor] = useState(null);
  const [photoErrors, setPhotoErrors] = useState({});
  const [brokenPhotos, setBrokenPhotos] = useState({});

  // Scheduled maintenance window — blocks out specific date+slot cells (via
  // a 'maintenance' booking_type row, same occupancy mechanism real
  // bookings use) rather than closing the whole court indefinitely. This is
  // the only maintenance mechanism now — there's no whole-court toggle.
  const [timeSlots, setTimeSlots] = useState([]);
  const [schedulingCourt, setSchedulingCourt] = useState(null);
  const [maintDate, setMaintDate] = useState(todayISO());
  const [maintSlots, setMaintSlots] = useState([]);
  const [daySlotStates, setDaySlotStates] = useState({});
  const [maintBookingIds, setMaintBookingIds] = useState({});
  const [loadingDayStates, setLoadingDayStates] = useState(false);
  const [maintError, setMaintError] = useState('');
  const [savingMaint, setSavingMaint] = useState(false);
  const [undoingSlot, setUndoingSlot] = useState(null);

  const filteredCourts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return courts.filter((c) => !q || [c.court_name, c.court_type].some((v) => v?.toLowerCase().includes(q)));
  }, [courts, search]);

  // Fetch initial court data from our new API
  useEffect(() => {
    apiFetch('/api/courts/all')
      .then(res => res.json())
      .then(res => setCourts(res.data))
      .catch(err => console.error("Error loading courts:", err));
    apiFetch('/api/time-slots')
      .then(res => res.json())
      .then(res => setTimeSlots(res.data || []))
      .catch(err => console.error("Error loading time slots:", err));
  }, []);

  // Which of this court's slots are already taken on the chosen date, so the
  // picker below can't let an admin select one that's already booked/locked
  // — same occupancy data the booking grid itself uses — plus, separately,
  // the actual booking_id behind any already-scheduled maintenance slot, so
  // that one can be cancelled (undone) straight from the same picker.
  const fetchDayStates = (court_id, date) => {
    setLoadingDayStates(true);
    Promise.all([
      apiFetch(`/api/bookings/availability?date=${date}`).then((res) => res.json()),
      apiFetch(`/api/bookings?court_id=${court_id}&date=${date}&booking_type=maintenance&status=confirmed`).then((res) => res.json()),
    ])
      .then(([availability, maintenance]) => {
        const states = {};
        (availability.data || []).forEach((row) => {
          if (row.court_id === court_id) states[row.slot_id] = row.state;
        });
        setDaySlotStates(states);

        const ids = {};
        (maintenance.data || []).forEach((row) => { ids[row.slot_id] = row.booking_id; });
        setMaintBookingIds(ids);
      })
      .catch(() => { setDaySlotStates({}); setMaintBookingIds({}); })
      .finally(() => setLoadingDayStates(false));
  };

  const handleOpenScheduleMaintenance = (court) => {
    setSchedulingCourt(court);
    setMaintDate(todayISO());
    setMaintSlots([]);
    setMaintError('');
    fetchDayStates(court.court_id, todayISO());
  };

  const handleMaintDateChange = (date) => {
    setMaintDate(date);
    setMaintSlots([]);
    setMaintError('');
    if (schedulingCourt) fetchDayStates(schedulingCourt.court_id, date);
  };

  const toggleMaintSlot = (slot_id) => {
    setMaintSlots((prev) => (prev.includes(slot_id) ? prev.filter((id) => id !== slot_id) : [...prev, slot_id]));
  };

  // Undoes a previously-scheduled maintenance slot — reuses the same
  // generic admin cancel action every other booking type already uses
  // (PATCH /:id, action: 'cancel'), since a maintenance row is just a
  // 'confirmed' booking like any other and needs no special-casing there.
  const handleUndoMaintenance = async (slot) => {
    const booking_id = maintBookingIds[slot.slot_id];
    if (!booking_id) return;
    if (!window.confirm(`Cancel the scheduled maintenance for ${slot.slot_name} on ${maintDate}?`)) return;

    setUndoingSlot(slot.slot_id);
    const res = await apiFetch(`/api/bookings/${booking_id}`, {
      method: 'PATCH',
      body: JSON.stringify({ action: 'cancel' }),
    });
    setUndoingSlot(null);

    if (res.ok) {
      fetchDayStates(schedulingCourt.court_id, maintDate);
    } else {
      setMaintError(await parseErrorMessage(res, 'Failed to cancel maintenance.'));
    }
  };

  const handleScheduleMaintenance = async (e) => {
    e.preventDefault();
    if (maintSlots.length === 0) {
      setMaintError('Select at least one time slot.');
      return;
    }
    setSavingMaint(true);
    setMaintError('');

    const res = await apiFetch('/api/bookings/maintenance', {
      method: 'POST',
      body: JSON.stringify({ court_id: schedulingCourt.court_id, booking_date: maintDate, slot_ids: maintSlots }),
    });
    setSavingMaint(false);

    if (res.ok) {
      setSchedulingCourt(null);
    } else {
      const message = await parseErrorMessage(res, 'Failed to schedule maintenance.');
      setMaintError(message);
      // A conflict means someone else booked one of these slots since the
      // picker last loaded — refresh so the now-stale "available" cell
      // shows its real state instead of letting the admin retry blind.
      fetchDayStates(schedulingCourt.court_id, maintDate);
    }
  };

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

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Header Section */}
      <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-50/50">
        <div>
          <h2 className="text-slate-900 text-xs font-black uppercase tracking-[0.3em]">Court Management</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">KGC Facility Overview</p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
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
                        court.is_active
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

                {/* Actions column */}
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                    <button
                      onClick={() => handleOpenScheduleMaintenance(court)}
                      title="Schedule Maintenance Window"
                      className="w-10 h-10 flex items-center justify-center rounded-xl transition-all border text-blue-600 bg-blue-50 border-blue-100 hover:bg-blue-600 hover:text-white"
                    >
                      <CalendarClock size={18} />
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
            {courts.length === 0 ? 'No court data found in system registry.' : 'No courts match this search.'}
          </div>
        )}
      </div>

      <Modal
        isOpen={!!schedulingCourt}
        onClose={() => setSchedulingCourt(null)}
        title={`Schedule Maintenance — ${schedulingCourt?.court_name || ''}`}
        submitText={savingMaint ? 'Scheduling...' : `Schedule (${maintSlots.length} Slot${maintSlots.length === 1 ? '' : 's'})`}
        onSubmit={handleScheduleMaintenance}
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Date</label>
            <input
              type="date"
              min={todayISO()}
              value={maintDate}
              onChange={(e) => handleMaintDateChange(e.target.value)}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase text-slate-400 ml-1">
              Time Slots — select every slot this window covers, or tap an existing maintenance slot to undo it
            </label>
            {loadingDayStates ? (
              <p className="text-slate-400 text-xs py-6 text-center">Loading availability...</p>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto border border-slate-200 rounded-xl p-2">
                {timeSlots.map((slot) => {
                  const state = daySlotStates[slot.slot_id] || 'available';
                  const isFree = state === 'available';
                  const isMaintenance = state === 'maintenance' && maintBookingIds[slot.slot_id];
                  const isLocked = !isFree && !isMaintenance;
                  const isSelected = maintSlots.includes(slot.slot_id);
                  const isUndoing = undoingSlot === slot.slot_id;

                  return (
                    <button
                      type="button"
                      key={slot.slot_id}
                      disabled={isLocked || isUndoing}
                      onClick={() => (isMaintenance ? handleUndoMaintenance(slot) : toggleMaintSlot(slot.slot_id))}
                      title={isMaintenance ? 'Tap to undo this scheduled maintenance' : undefined}
                      className={`px-3 py-2 rounded-lg text-[10px] font-bold text-left transition-colors ${
                        isSelected
                          ? 'bg-slate-900 text-white'
                          : isMaintenance
                            ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 cursor-pointer'
                            : isLocked
                              ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      }`}
                    >
                      {slot.slot_name}
                      {isMaintenance && (
                        <span className="block text-[8px] uppercase opacity-70">{isUndoing ? 'Cancelling...' : 'Maintenance — tap to undo'}</span>
                      )}
                      {isLocked && <span className="block text-[8px] uppercase opacity-70">{state}</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {maintError && (
            <p className="text-red-500 text-[11px] font-bold">{maintError}</p>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default AdminCourts;
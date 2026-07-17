import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../utils/api';

// Shared by every booking surface (guest/member/coach/admin) that renders
// CourtSlotGrid. Previously each page fetched courts/time-slots with no
// `.catch()` and no `res.ok` check at all — a network hiccup, or simply a
// stale/expired login token (a valid-JSON 401), left `courts`/`slots`
// permanently empty with no error surfaced, so CourtSlotGrid's own "Loading
// courts and time slots..." (driven purely by `!courts.length`) never
// cleared. This gives every caller a real error state and a retry, instead
// of a silent, permanent spinner.
export const useCourtsAndSlots = () => {
    const [courts, setCourts] = useState([]);
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const load = useCallback(() => {
        setLoading(true);
        setError('');

        Promise.all([
            apiFetch('/api/courts').then((res) => {
                if (!res.ok) throw new Error('Failed to load courts.');
                return res.json();
            }),
            apiFetch('/api/time-slots').then((res) => {
                if (!res.ok) throw new Error('Failed to load time slots.');
                return res.json();
            }),
        ])
            .then(([courtsData, slotsData]) => {
                setCourts(courtsData.data || []);
                setSlots(slotsData.data || []);
            })
            .catch(() => setError('Failed to load courts and time slots. Please check your connection and try again.'))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { load(); }, [load]);

    return { courts, slots, loading, error, retry: load };
};

import { useEffect, useState } from 'react';
import { API_URL } from '../utils/api';

// GET /api/settings is public and returns the whole club_settings key/value
// store in one shot — every consumer (public Contact/footer sections, the
// admin Club Settings page) fetches it independently, same convention the
// bank-detail/fee consumers already use. Keeping the current hardcoded copy
// as the fallback means a slow/failed fetch never blanks out the page.
const FALLBACK = {
    club_address: 'Peradeniya Road, Kandy, Sri Lanka',
    club_email: 'hello@kandygardenclub.lk',
    club_phone: '+94 (81) 222-3333',
    club_opening_hours: 'Mon – Sun: 08:00 – 20:00',
    club_facebook_url: '',
    club_instagram_url: '',
    club_twitter_url: '',
};

export const useClubSettings = () => {
    const [settings, setSettings] = useState(FALLBACK);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${API_URL}/api/settings`)
            .then((res) => res.json())
            .then((data) => setSettings({ ...FALLBACK, ...(data.data || {}) }))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    return { settings, loading };
};

// Fixed single-location club (Kandy Garden Club, Kandy) — no per-user
// location needed, so the coordinates are just a constant.
const KANDY_COORDS = { latitude: 7.2906, longitude: 80.6337 };

// Open-Meteo needs no API key and has a generous free tier, but there's no
// reason to hit it once per dashboard page-load — an in-memory cache keyed
// by date is enough for a single-process app like this one. If this ever
// runs as multiple instances, move this to a DB-backed cache instead.
let cache = { date: null, data: null };

// Fixed +5:30 offset rather than `new Date().toISOString()` (always UTC) —
// the forecast itself is already requested in Asia/Colombo time below, so
// the cache key should roll over at Colombo's local midnight too, not at
// UTC midnight (5:30am local), which would otherwise serve a stale cached
// forecast for the first ~5.5 hours of every real day.
const SRI_LANKA_OFFSET_MS = 5.5 * 60 * 60 * 1000;

const fetchTodayForecast = async () => {
    const today = new Date(Date.now() + SRI_LANKA_OFFSET_MS).toISOString().slice(0, 10);
    if (cache.date === today && cache.data) return cache.data;

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${KANDY_COORDS.latitude}&longitude=${KANDY_COORDS.longitude}` +
        `&hourly=temperature_2m,precipitation_probability,wind_speed_10m,weather_code` +
        `&daily=temperature_2m_max,temperature_2m_min,uv_index_max,precipitation_sum,sunrise,sunset` +
        `&timezone=Asia%2FColombo&forecast_days=1`;

    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`Weather provider responded with ${res.status}`);
    }
    const data = await res.json();

    cache = { date: today, data };
    return data;
};

module.exports = { fetchTodayForecast, SRI_LANKA_OFFSET_MS };

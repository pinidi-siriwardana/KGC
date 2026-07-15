const pool = require('../config/db');
const { fetchTodayForecast } = require('../utils/weather');

const nowTimeString = () => new Date().toTimeString().slice(0, 8); // "HH:MM:SS"

// WMO weather codes (used by Open-Meteo) collapsed into short labels — the
// full table has ~30 codes, but a player only needs the gist.
const WEATHER_LABEL = (code) => {
    if (code === 0) return 'Clear';
    if ([1, 2, 3].includes(code)) return 'Partly Cloudy';
    if ([45, 48].includes(code)) return 'Foggy';
    if ([51, 53, 55, 56, 57].includes(code)) return 'Drizzle';
    if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'Rain';
    if ([71, 73, 75, 77, 85, 86].includes(code)) return 'Snow';
    if ([95, 96, 99].includes(code)) return 'Thunderstorm';
    return 'Unsettled';
};

// Rain is the real blocker for clay courts; heat/wind are comfort/safety
// factors on top of that. Thresholds are intentionally simple and easy to
// tune later rather than derived from any external standard.
const scoreSlot = ({ precipitation_probability, temperature_2m, wind_speed_10m }) => {
    if (precipitation_probability > 50 || wind_speed_10m > 35) return 'avoid';
    if (precipitation_probability > 20 || temperature_2m > 33 || wind_speed_10m > 20) return 'caution';
    return 'good';
};

const getTodayWeather = async (req, res) => {
    try {
        const [slots] = await pool.query('SELECT slot_id, slot_name, start_time, end_time FROM time_slots ORDER BY start_time ASC');
        const forecast = await fetchTodayForecast();
        const hourly = forecast.hourly;

        const slotForecasts = slots.map((slot) => {
            const slotHHMM = slot.start_time.slice(0, 5);
            const hourIndex = hourly.time.findIndex((t) => t.slice(11, 16) === slotHHMM);

            if (hourIndex === -1) {
                return { ...slot, temperature: null, rainChance: null, windSpeed: null, condition: null, rating: 'unknown' };
            }

            const point = {
                temperature_2m: hourly.temperature_2m[hourIndex],
                precipitation_probability: hourly.precipitation_probability[hourIndex],
                wind_speed_10m: hourly.wind_speed_10m[hourIndex],
            };

            return {
                slot_id: slot.slot_id,
                slot_name: slot.slot_name,
                start_time: slot.start_time,
                end_time: slot.end_time,
                temperature: point.temperature_2m,
                rainChance: point.precipitation_probability,
                windSpeed: point.wind_speed_10m,
                condition: WEATHER_LABEL(hourly.weather_code[hourIndex]),
                rating: scoreSlot(point),
            };
        });

        const now = nowTimeString();
        const bestUpcoming = slotForecasts.find((s) => s.rating === 'good' && s.start_time > now) || null;

        const daily = forecast.daily;
        const dailySummary = daily ? {
            tempMax: daily.temperature_2m_max?.[0] ?? null,
            tempMin: daily.temperature_2m_min?.[0] ?? null,
            uvIndexMax: daily.uv_index_max?.[0] ?? null,
            precipitationSum: daily.precipitation_sum?.[0] ?? null,
            sunrise: daily.sunrise?.[0] ?? null,
            sunset: daily.sunset?.[0] ?? null,
        } : null;

        res.json({ data: { slots: slotForecasts, bestUpcoming, daily: dailySummary } });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch weather.', error: err.message });
    }
};

module.exports = { getTodayWeather };

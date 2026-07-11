const pool = require('../config/db');

const getSettings = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT setting_key, setting_value FROM club_settings');
        const data = {};
        rows.forEach((row) => { data[row.setting_key] = row.setting_value; });
        res.json({ data });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch settings.', error: err.message });
    }
};

const updateSettings = async (req, res) => {
    const entries = Object.entries(req.body || {});

    if (entries.length === 0) {
        return res.status(400).json({ message: 'Nothing to update.' });
    }

    if (req.body.cancellation_fee !== undefined) {
        const numericFee = Number(req.body.cancellation_fee);
        if (!Number.isFinite(numericFee) || numericFee < 0) {
            return res.status(400).json({ message: 'cancellation_fee must be a non-negative number.' });
        }
    }

    try {
        await Promise.all(entries.map(([key, value]) =>
            pool.query(
                `INSERT INTO club_settings (setting_key, setting_value) VALUES (?, ?)
                 ON DUPLICATE KEY UPDATE setting_value = ?`,
                [key, String(value), String(value)]
            )
        ));

        res.json({ message: 'Settings updated.' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to update settings.', error: err.message });
    }
};

module.exports = { getSettings, updateSettings };

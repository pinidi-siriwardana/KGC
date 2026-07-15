const pool = require('../config/db');
const { updateSelfProfile } = require('../utils/selfProfile');

// Self-service profile for the logged-in coach.
const getMe = async (req, res) => {
    try {
        const [[coach]] = await pool.query(
            `SELECT coach_id, user_id, full_name, email, phone, specialization, experience_years, status, created_at
             FROM coaches WHERE user_id = ?`,
            [req.user.user_id]
        );

        if (!coach) {
            return res.status(404).json({ message: 'Coach profile not found.' });
        }

        res.json({ coach });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch coach profile.', error: err.message });
    }
};

const updateMe = async (req, res) => {
    const { username, email, phone, currentPassword, newPassword } = req.body;

    try {
        await updateSelfProfile({ userId: req.user.user_id, table: 'coaches', username, email, phone, currentPassword, newPassword });

        const [[coach]] = await pool.query(
            `SELECT coach_id, user_id, full_name, email, phone, specialization, experience_years, status, created_at
             FROM coaches WHERE user_id = ?`,
            [req.user.user_id]
        );

        res.json({ message: 'Profile updated.', coach });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Username or email is already in use.' });
        }
        if (err.statusCode) {
            return res.status(err.statusCode).json({ message: err.message });
        }
        res.status(500).json({ message: 'Failed to update profile.', error: err.message });
    }
};

module.exports = { getMe, updateMe };

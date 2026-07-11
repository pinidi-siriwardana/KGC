const pool = require('../config/db');

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

module.exports = { getMe };

const pool = require('../config/db');
const { updateSelfProfile } = require('../utils/selfProfile');

// Self-service profile for the logged-in admin. Admins have no linked
// members/coaches-style profile row — username/password on `users` is the
// whole account, so this only ever touches that one table.
const getMe = async (req, res) => {
    try {
        const [[admin]] = await pool.query(
            'SELECT user_id, username, role, status, created_at FROM users WHERE user_id = ?',
            [req.user.user_id]
        );

        if (!admin) {
            return res.status(404).json({ message: 'Admin account not found.' });
        }

        res.json({ admin });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch admin profile.', error: err.message });
    }
};

const updateMe = async (req, res) => {
    const { username, currentPassword, newPassword } = req.body;

    try {
        await updateSelfProfile({ userId: req.user.user_id, username, currentPassword, newPassword });

        const [[admin]] = await pool.query(
            'SELECT user_id, username, role, status, created_at FROM users WHERE user_id = ?',
            [req.user.user_id]
        );

        res.json({ message: 'Profile updated.', admin });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Username is already taken.' });
        }
        if (err.statusCode) {
            return res.status(err.statusCode).json({ message: err.message });
        }
        res.status(500).json({ message: 'Failed to update profile.', error: err.message });
    }
};

module.exports = { getMe, updateMe };

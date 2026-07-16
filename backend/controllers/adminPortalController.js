const pool = require('../config/db');
const { updateSelfProfile } = require('../utils/selfProfile');

const ADMIN_SELECT = `
    SELECT u.user_id, u.username, u.role, u.status, u.created_at, s.full_name, s.email, s.phone
    FROM users u
    LEFT JOIN staff s ON s.user_id = u.user_id
    WHERE u.user_id = ?
`;

// Self-service profile for the logged-in admin: username/password on
// `users`, plus full_name/email/phone on their linked `staff` row — same
// two-table shape members/coaches already have.
const getMe = async (req, res) => {
    try {
        const [[admin]] = await pool.query(ADMIN_SELECT, [req.user.user_id]);

        if (!admin) {
            return res.status(404).json({ message: 'Admin account not found.' });
        }

        res.json({ admin });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch admin profile.', error: err.message });
    }
};

const updateMe = async (req, res) => {
    const { username, email, phone, currentPassword, newPassword } = req.body;

    try {
        await updateSelfProfile({ userId: req.user.user_id, table: 'staff', username, email, phone, currentPassword, newPassword });

        const [[admin]] = await pool.query(ADMIN_SELECT, [req.user.user_id]);

        res.json({ message: 'Profile updated.', admin });
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

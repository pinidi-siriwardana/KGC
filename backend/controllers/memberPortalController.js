const pool = require('../config/db');
const { getCurrentMembership } = require('../utils/membership');
const { updateSelfProfile } = require('../utils/selfProfile');

// Self-service profile for the logged-in member: their own details plus their
// current membership term. Never gated by expiry — an expired member still
// needs this to see why their portal access is locked.
const getMe = async (req, res) => {
    try {
        const [[member]] = await pool.query(
            `SELECT member_id, user_id, full_name, email, phone, status, created_at
             FROM members WHERE user_id = ?`,
            [req.user.user_id]
        );

        if (!member) {
            return res.status(404).json({ message: 'Member profile not found.' });
        }

        const membership = await getCurrentMembership(member.member_id);

        res.json({
            member,
            membership,
            access_blocked: !membership || membership.is_expired,
        });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch member profile.', error: err.message });
    }
};

const updateMe = async (req, res) => {
    const { username, email, phone, currentPassword, newPassword } = req.body;

    try {
        await updateSelfProfile({ userId: req.user.user_id, table: 'members', username, email, phone, currentPassword, newPassword });

        const [[member]] = await pool.query(
            `SELECT member_id, user_id, full_name, email, phone, status, created_at
             FROM members WHERE user_id = ?`,
            [req.user.user_id]
        );

        res.json({ message: 'Profile updated.', member });
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

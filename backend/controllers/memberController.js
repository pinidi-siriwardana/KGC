const pool = require('../config/db');
const { withTransaction } = pool;
const { hashPassword } = require('../utils/password');
const { createMemberAccount } = require('../utils/memberAccount');

const getMembers = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT member_id, user_id, full_name, email, phone, status, created_at
             FROM members ORDER BY created_at DESC`
        );
        res.json({ data: rows });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch members.', error: err.message });
    }
};

const createMember = async (req, res) => {
    const { username, password, full_name, email, phone, status } = req.body;

    if (!username || !password || !full_name || !email || !phone) {
        return res.status(400).json({ message: 'username, password, full_name, email and phone are required.' });
    }

    try {
        const { member_id } = await withTransaction(async (connection) => {
            const password_hash = await hashPassword(password);
            return createMemberAccount(connection, { username, password_hash, full_name, email, phone, status });
        });

        res.status(201).json({ message: 'Member created.', member_id });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Username or email is already in use.' });
        }
        res.status(500).json({ message: 'Failed to create member.', error: err.message });
    }
};

const updateMember = async (req, res) => {
    const { id } = req.params;
    const { full_name, email, phone, status } = req.body;

    try {
        const [result] = await pool.query(
            'UPDATE members SET full_name = ?, email = ?, phone = ?, status = ? WHERE member_id = ?',
            [full_name, email, phone, status, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Member not found.' });
        }

        res.json({ message: 'Member updated.' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Email is already in use.' });
        }
        res.status(500).json({ message: 'Failed to update member.', error: err.message });
    }
};

const deleteMember = async (req, res) => {
    const { id } = req.params;

    try {
        const [[member]] = await pool.query('SELECT user_id FROM members WHERE member_id = ?', [id]);

        if (!member) {
            return res.status(404).json({ message: 'Member not found.' });
        }

        // Deleting the user cascades to the members row (fk_member_user ON DELETE CASCADE).
        await pool.query('DELETE FROM users WHERE user_id = ?', [member.user_id]);

        res.json({ message: 'Member and login account deleted.' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to delete member.', error: err.message });
    }
};

module.exports = { getMembers, createMember, updateMember, deleteMember };

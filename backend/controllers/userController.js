const pool = require('../config/db');
const { hashPassword } = require('../utils/password');

const SAFE_FIELDS = 'user_id, username, role, status, created_at';

// True if removing/demoting/disabling `id` would leave the system with zero
// active administrators — checked by counting every *other* active admin.
const isLastActiveAdmin = async (id) => {
    const [[target]] = await pool.query('SELECT role, status FROM users WHERE user_id = ?', [id]);
    if (!target || target.role !== 'admin' || target.status !== 'active') return false;

    const [[{ c }]] = await pool.query(
        "SELECT COUNT(*) AS c FROM users WHERE role = 'admin' AND status = 'active' AND user_id != ?",
        [id]
    );
    return c === 0;
};

const getUsers = async (req, res) => {
    try {
        const [rows] = await pool.query(`SELECT ${SAFE_FIELDS} FROM users ORDER BY created_at DESC`);
        res.json({ data: rows });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch users.', error: err.message });
    }
};

const createUser = async (req, res) => {
    const { username, password, role, status } = req.body;

    try {
        const password_hash = await hashPassword(password);
        const [result] = await pool.query(
            'INSERT INTO users (username, password_hash, role, status) VALUES (?, ?, ?, ?)',
            [username, password_hash, role, status || 'active']
        );
        res.status(201).json({ message: 'User created.', user_id: result.insertId });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Username is already taken.' });
        }
        res.status(500).json({ message: 'Failed to create user.', error: err.message });
    }
};

const updateUser = async (req, res) => {
    const { id } = req.params;
    const { username, password, role, status } = req.body;

    // An admin editing their own account can't demote or disable themselves —
    // there'd be no one left with access to undo it.
    if (id === req.user.user_id) {
        if (role !== undefined && role !== 'admin') {
            return res.status(400).json({ message: 'You cannot change your own role.' });
        }
        if (status !== undefined && status !== 'active') {
            return res.status(400).json({ message: 'You cannot disable your own account.' });
        }
    }

    try {
        const demotingOrDisabling = (role !== undefined && role !== 'admin') || (status !== undefined && status !== 'active');
        if (demotingOrDisabling && (await isLastActiveAdmin(id))) {
            return res.status(400).json({ message: 'Cannot remove the last active administrator.' });
        }

        const fields = [];
        const values = [];

        if (username !== undefined) { fields.push('username = ?'); values.push(username); }
        if (role !== undefined) { fields.push('role = ?'); values.push(role); }
        if (status !== undefined) { fields.push('status = ?'); values.push(status); }
        if (password) { fields.push('password_hash = ?'); values.push(await hashPassword(password)); }

        if (fields.length === 0) {
            return res.status(400).json({ message: 'No fields to update.' });
        }

        const [result] = await pool.query(
            `UPDATE users SET ${fields.join(', ')} WHERE user_id = ?`,
            [...values, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.json({ message: 'User updated.' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Username is already taken.' });
        }
        res.status(500).json({ message: 'Failed to update user.', error: err.message });
    }
};

const deleteUser = async (req, res) => {
    const { id } = req.params;

    if (id === req.user.user_id) {
        return res.status(400).json({ message: 'You cannot delete your own account.' });
    }

    try {
        if (await isLastActiveAdmin(id)) {
            return res.status(400).json({ message: 'Cannot delete the last active administrator.' });
        }

        const [result] = await pool.query('DELETE FROM users WHERE user_id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.json({ message: 'User deleted.' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to delete user.', error: err.message });
    }
};

module.exports = { getUsers, createUser, updateUser, deleteUser };

const pool = require('../config/db');
const { hashPassword } = require('../utils/password');

const SAFE_FIELDS = 'user_id, username, role, status, created_at';

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

    if (!username || !password || !role) {
        return res.status(400).json({ message: 'username, password and role are required.' });
    }

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

    try {
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

    try {
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

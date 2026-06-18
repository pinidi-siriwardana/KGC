const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const register = async (req, res) => {
    const { full_name, email, phone, username, password, membership_type_id } = req.body;

    if (!full_name || !email || !phone || !username || !password) {
        return res.status(400).json({ message: 'full_name, email, phone, username and password are required.' });
    }
    if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    try {
        const password_hash = await bcrypt.hash(password, 10);

        const [result] = await pool.query(
            `INSERT INTO registration_requests (full_name, email, phone, username, password_hash, membership_type_id, status)
             VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
            [full_name, email, phone, username, password_hash, membership_type_id || null]
        );

        res.status(201).json({
            message: 'Registration submitted successfully. Your account is pending admin review.',
            request_id: result.insertId
        });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Username or email is already registered or pending review.' });
        }
        res.status(500).json({ message: 'Registration failed.', error: err.message });
    }
};

const login = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'username and password are required.' });
    }

    try {
        const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);

        if (rows.length === 0) {
            return res.status(401).json({ message: 'Invalid username or password.' });
        }

        const user = rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid username or password.' });
        }

        if (user.status !== 'active') {
            return res.status(403).json({ message: `Account is ${user.status}. Please contact an administrator.` });
        }

        const token = jwt.sign(
            { user_id: user.user_id, username: user.username, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
        );

        res.json({
            message: 'Login successful.',
            token,
            user: {
                user_id: user.user_id,
                username: user.username,
                role: user.role,
                status: user.status
            }
        });
    } catch (err) {
        res.status(500).json({ message: 'Login failed.', error: err.message });
    }
};

const me = async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT user_id, username, role, status, created_at FROM users WHERE user_id = ?',
            [req.user.user_id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.json({ user: rows[0] });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch current user.', error: err.message });
    }
};

module.exports = { register, login, me };

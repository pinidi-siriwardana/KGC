const fs = require('fs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { withTransaction } = pool;
const { hashPassword, comparePassword } = require('../utils/password');

// A fixed, pre-computed bcrypt hash with no real matching password — used to
// keep login's response time the same whether or not `username` exists.
// bcrypt.compare is a deliberately slow (~50-100ms) operation that only ran
// when a matching user was found, so an attacker could tell "no such
// username" apart from "wrong password" purely from response latency, even
// though both returned the exact same error text.
const DUMMY_HASH = '$2b$10$nJl3JLR3V22WHIRd2amco.kePXXWR0Wk812iR4wdMka0m3zXzsWLO';

const register = async (req, res) => {
    const { full_name, email, phone, username, password, membership_type_id } = req.body;
    const receiptFile = req.file;

    const fail = (status, message) => {
        if (receiptFile) fs.unlink(receiptFile.path, () => {});
        return res.status(status).json({ message });
    };

    if (!receiptFile) {
        return fail(400, 'A payment slip (receipt) is required.');
    }

    try {
        const [[membershipType]] = await pool.query(
            'SELECT price FROM membership_types WHERE membership_type_id = ?',
            [membership_type_id]
        );

        if (!membershipType) {
            return fail(400, 'Invalid membership_type_id.');
        }

        const password_hash = await hashPassword(password);
        const receipt_file_url = `/uploads/slips/${receiptFile.filename}`;

        const request_id = await withTransaction(async (connection) => {
            const [requestResult] = await connection.query(
                `INSERT INTO registration_requests (full_name, email, phone, username, password_hash, membership_type_id, status)
                 VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
                [full_name, email, phone, username, password_hash, membership_type_id]
            );

            await connection.query(
                `INSERT INTO payment_verification (request_id, payment_type, receipt_file_url, amount_declared, status)
                 VALUES (?, 'registration', ?, ?, 'pending')`,
                [requestResult.insertId, receipt_file_url, membershipType.price]
            );

            return requestResult.insertId;
        });

        res.status(201).json({
            message: 'Registration submitted successfully. Your account is pending admin review.',
            request_id
        });
    } catch (err) {
        if (receiptFile) fs.unlink(receiptFile.path, () => {});
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Username or email is already registered or pending review.' });
        }
        res.status(500).json({ message: 'Registration failed.', error: err.message });
    }
};

const login = async (req, res) => {
    const { username, password } = req.body;

    try {
        const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
        const user = rows[0];

        // Always compare against something, even for a nonexistent
        // username, so this branch takes the same time either way.
        const isMatch = await comparePassword(password, user ? user.password_hash : DUMMY_HASH);

        if (!user || !isMatch) {
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

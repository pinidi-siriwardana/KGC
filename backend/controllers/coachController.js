const pool = require('../config/db');
const { withTransaction } = pool;
const { hashPassword } = require('../utils/password');
const { createCoachAccount } = require('../utils/coachAccount');
const { toLoginStatus } = require('../utils/accountStatus');

const getCoaches = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT coach_id, user_id, full_name, email, phone, specialization, experience_years, status, created_at
             FROM coaches ORDER BY created_at DESC`
        );
        res.json({ data: rows });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch coaches.', error: err.message });
    }
};

const createCoach = async (req, res) => {
    const { username, password, full_name, email, phone, specialization, experience_years, status } = req.body;

    try {
        const { coach_id } = await withTransaction(async (connection) => {
            const password_hash = await hashPassword(password);
            return createCoachAccount(connection, { username, password_hash, full_name, email, phone, specialization, experience_years, status });
        });

        res.status(201).json({ message: 'Coach created.', coach_id });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Username or email is already in use.' });
        }
        res.status(500).json({ message: 'Failed to create coach.', error: err.message });
    }
};

const updateCoach = async (req, res) => {
    const { id } = req.params;
    const { full_name, email, phone, specialization, experience_years, status } = req.body;

    try {
        await withTransaction(async (connection) => {
            const [[coach]] = await connection.query('SELECT user_id FROM coaches WHERE coach_id = ?', [id]);
            if (!coach) {
                const err = new Error('Coach not found.');
                err.statusCode = 404;
                throw err;
            }

            await connection.query(
                `UPDATE coaches SET full_name = ?, email = ?, phone = ?, specialization = ?, experience_years = ?, status = ?
                 WHERE coach_id = ?`,
                [full_name, email, phone, specialization, experience_years, status, id]
            );

            // A suspended/inactive coach shouldn't still be able to log in
            // — this is what actually gates access, coaches.status alone is
            // just a directory label.
            await connection.query('UPDATE users SET status = ? WHERE user_id = ?', [toLoginStatus(status), coach.user_id]);
        });

        res.json({ message: 'Coach updated.' });
    } catch (err) {
        if (err.statusCode) {
            return res.status(err.statusCode).json({ message: err.message });
        }
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Email is already in use.' });
        }
        res.status(500).json({ message: 'Failed to update coach.', error: err.message });
    }
};

const deleteCoach = async (req, res) => {
    const { id } = req.params;

    try {
        const [[coach]] = await pool.query('SELECT user_id FROM coaches WHERE coach_id = ?', [id]);

        if (!coach) {
            return res.status(404).json({ message: 'Coach not found.' });
        }

        // Deleting the user cascades to the coaches row (fk_coach_user ON DELETE CASCADE).
        await pool.query('DELETE FROM users WHERE user_id = ?', [coach.user_id]);

        res.json({ message: 'Coach and login account deleted.' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to delete coach.', error: err.message });
    }
};

module.exports = { getCoaches, createCoach, updateCoach, deleteCoach };

const fs = require('fs');
const path = require('path');
const pool = require('../config/db');
const { withTransaction } = pool;
const { hashPassword } = require('../utils/password');
const { createCoachAccount } = require('../utils/coachAccount');
const { toLoginStatus } = require('../utils/accountStatus');

const getCoaches = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT coach_id, user_id, full_name, email, phone, specialization, experience_years, status, photo_url, created_at
             FROM coaches ORDER BY created_at DESC`
        );
        res.json({ data: rows });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch coaches.', error: err.message });
    }
};

// Public: the home page's coach section reads this directly instead of
// hardcoded profiles, so it grows/shrinks with whatever admins actually
// maintain in the Coach Directory. Active and on-leave coaches both show
// (on-leave still shows so visitors know they're on staff, just marked as
// away) — only 'inactive' (no longer with the club) is hidden entirely.
// Fields are still only what's meant for visitors — phone, but no email/
// user_id.
const getPublicCoaches = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT coach_id, full_name, phone, specialization, experience_years, photo_url, status
             FROM coaches WHERE status IN ('active', 'on-leave') ORDER BY created_at ASC`
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

// Admin: replaces a coach's photo. The old file (if any) is deleted from
// disk once the new one is saved, so switching photos repeatedly doesn't
// leave orphaned files behind in uploads/coaches.
const updateCoachPhoto = async (req, res) => {
    const { id } = req.params;

    const cleanupUpload = () => {
        if (req.file) fs.unlink(req.file.path, () => {});
    };

    if (!req.file) {
        return res.status(400).json({ message: 'A photo file is required.' });
    }

    try {
        const [[coach]] = await pool.query('SELECT photo_url FROM coaches WHERE coach_id = ?', [id]);
        if (!coach) {
            cleanupUpload();
            return res.status(404).json({ message: 'Coach not found.' });
        }

        const photo_url = `/uploads/coaches/${req.file.filename}`;
        await pool.query('UPDATE coaches SET photo_url = ? WHERE coach_id = ?', [photo_url, id]);

        if (coach.photo_url) {
            const oldPath = path.join(__dirname, '..', coach.photo_url);
            fs.unlink(oldPath, () => {});
        }

        res.json({ message: 'Coach photo updated.', photo_url });
    } catch (err) {
        cleanupUpload();
        res.status(500).json({ message: 'Failed to update coach photo.', error: err.message });
    }
};

const deleteCoach = async (req, res) => {
    const { id } = req.params;

    try {
        const [[coach]] = await pool.query('SELECT user_id FROM coaches WHERE coach_id = ?', [id]);

        if (!coach) {
            return res.status(404).json({ message: 'Coach not found.' });
        }

        // Deleting the user cascades to the coaches row (fk_coach_user ON
        // DELETE CASCADE) — but bookings.coach_id/created_by_user_id are
        // ON DELETE RESTRICT, so this still fails for anyone who's ever
        // booked a court, which is the normal case, not an edge one.
        await pool.query('DELETE FROM users WHERE user_id = ?', [coach.user_id]);

        res.json({ message: 'Coach and login account deleted.' });
    } catch (err) {
        if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.code === 'ER_ROW_IS_REFERENCED') {
            return res.status(409).json({
                message: 'Cannot delete: this coach has booking or payment history. Disable their account instead (Access Management) if they should lose access.'
            });
        }
        res.status(500).json({ message: 'Failed to delete coach.', error: err.message });
    }
};

module.exports = { getCoaches, getPublicCoaches, createCoach, updateCoach, updateCoachPhoto, deleteCoach };

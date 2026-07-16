const pool = require('../config/db');
const { withTransaction } = pool;
const { hashPassword } = require('../utils/password');
const { createMemberAccount } = require('../utils/memberAccount');
const { createCoachAccount } = require('../utils/coachAccount');
const { assignOrUpdateMembership, syncMembershipPayment } = require('../utils/membership');
const { toProfileStatus } = require('../utils/accountStatus');

const SAFE_FIELDS = 'user_id, username, role, status, created_at';

// A role of 'member'/'coach' on `users` means nothing on its own without a
// matching row in `members`/`coaches` — that's what the Member/Coach
// Directories actually query. Flagging the mismatch here lets Access
// Management surface it instead of silently producing an invisible account.
const PROFILE_STATUS_SELECT = `
    CASE
        WHEN u.role = 'member' THEN (m.member_id IS NOT NULL)
        WHEN u.role = 'coach' THEN (c.coach_id IS NOT NULL)
        ELSE NULL
    END AS has_profile
`;

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
        const [rows] = await pool.query(
            `SELECT u.user_id, u.username, u.role, u.status, u.created_at, ${PROFILE_STATUS_SELECT}
             FROM users u
             LEFT JOIN members m ON m.user_id = u.user_id
             LEFT JOIN coaches c ON c.user_id = u.user_id
             ORDER BY u.created_at DESC`
        );
        const data = rows.map((r) => ({ ...r, has_profile: r.has_profile === null ? null : Boolean(r.has_profile) }));
        res.json({ data });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch users.', error: err.message });
    }
};

// An admin account is just a login — but member/coach roles are half of a
// two-table record, so creating one here goes through the same
// createMemberAccount/createCoachAccount helpers the dedicated Add Member/
// Add Coach forms use, keeping every login visible in its directory.
const createUser = async (req, res) => {
    // `status` here is the login's users.status (active/pending/disabled) —
    // a different enum than members.status/coaches.status, so it must NOT
    // be forwarded into the profile helpers below; they default their own
    // status to 'active' when it's left out.
    const { role, username, password, status, membership_type_id, start_date, ...profile } = req.body;

    try {
        if (role === 'admin') {
            const password_hash = await hashPassword(password);
            const [result] = await pool.query(
                'INSERT INTO users (username, password_hash, role, status) VALUES (?, ?, ?, ?)',
                [username, password_hash, role, status || 'active']
            );
            return res.status(201).json({ message: 'User created.', user_id: result.insertId });
        }

        const password_hash = await hashPassword(password);
        const result = await withTransaction(async (connection) => {
            if (role === 'member') {
                const { user_id, member_id } = await createMemberAccount(connection, { username, password_hash, ...profile });

                if (membership_type_id) {
                    const { membershipId, price } = await assignOrUpdateMembership(connection, { member_id, membership_type_id, start_date });
                    await syncMembershipPayment(connection, {
                        member_id, membershipId, amount: price, payment_date: start_date,
                        handledBy: req.user.user_id, notes: 'Membership fee collected at registration',
                    });
                }

                return { user_id, member_id };
            }

            return createCoachAccount(connection, { username, password_hash, ...profile });
        });

        res.status(201).json({ message: 'User created.', ...result });
    } catch (err) {
        if (err.statusCode) {
            return res.status(err.statusCode).json({ message: err.message });
        }
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Username or email is already in use.' });
        }
        res.status(500).json({ message: 'Failed to create user.', error: err.message });
    }
};

// Backfills the members/coaches row for an account that was created without
// one (the historical role-only create path) — same effect as if the
// profile fields had been supplied at creation time.
const completeProfile = async (req, res) => {
    const { id } = req.params;
    const { membership_type_id, start_date, ...profile } = req.body;

    try {
        const [[user]] = await pool.query('SELECT user_id, role FROM users WHERE user_id = ?', [id]);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        if (user.role !== 'member' && user.role !== 'coach') {
            return res.status(400).json({ message: 'Only member/coach accounts have a linked profile.' });
        }

        const table = user.role === 'member' ? 'members' : 'coaches';
        const idColumn = user.role === 'member' ? 'member_id' : 'coach_id';
        const [[existing]] = await pool.query(`SELECT ${idColumn} FROM ${table} WHERE user_id = ?`, [id]);
        if (existing) {
            return res.status(409).json({ message: 'This account already has a linked profile.' });
        }

        const result = await withTransaction(async (connection) => {
            if (user.role === 'member') {
                const [memberResult] = await connection.query(
                    'INSERT INTO members (user_id, full_name, email, phone, status) VALUES (?, ?, ?, ?, ?)',
                    [id, profile.full_name, profile.email, profile.phone, 'active']
                );
                const member_id = memberResult.insertId;

                if (membership_type_id) {
                    const { membershipId, price } = await assignOrUpdateMembership(connection, { member_id, membership_type_id, start_date });
                    await syncMembershipPayment(connection, {
                        member_id, membershipId, amount: price, payment_date: start_date,
                        handledBy: req.user.user_id, notes: 'Membership fee collected at registration',
                    });
                }

                return { member_id };
            }

            const [coachResult] = await connection.query(
                `INSERT INTO coaches (user_id, full_name, email, phone, specialization, experience_years, status)
                 VALUES (?, ?, ?, ?, ?, ?, 'active')`,
                [id, profile.full_name, profile.email, profile.phone, profile.specialization || null, profile.experience_years || 0]
            );
            return { coach_id: coachResult.insertId };
        });

        res.status(201).json({ message: 'Profile linked.', ...result });
    } catch (err) {
        if (err.statusCode) {
            return res.status(err.statusCode).json({ message: err.message });
        }
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Email is already in use.' });
        }
        res.status(500).json({ message: 'Failed to complete profile.', error: err.message });
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
        const [[target]] = await pool.query('SELECT role FROM users WHERE user_id = ?', [id]);
        if (!target) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // A member/coach role is half of a two-table record (users +
        // members/coaches) — there's no safe automatic way to migrate their
        // existing profile, plan, and booking/payment history to a
        // different role's table, so the role is fixed at creation instead
        // of silently producing an orphaned profile row.
        if (role !== undefined && role !== target.role) {
            return res.status(400).json({ message: 'Role cannot be changed after an account is created. Delete and recreate the account instead.' });
        }

        const demotingOrDisabling = status !== undefined && status !== 'active';
        if (demotingOrDisabling && (await isLastActiveAdmin(id))) {
            return res.status(400).json({ message: 'Cannot remove the last active administrator.' });
        }

        await withTransaction(async (connection) => {
            const fields = [];
            const values = [];

            if (username !== undefined) { fields.push('username = ?'); values.push(username); }
            if (status !== undefined) { fields.push('status = ?'); values.push(status); }
            if (password) { fields.push('password_hash = ?'); values.push(await hashPassword(password)); }

            if (fields.length === 0) {
                const err = new Error('No fields to update.');
                err.statusCode = 400;
                throw err;
            }

            const [result] = await connection.query(
                `UPDATE users SET ${fields.join(', ')} WHERE user_id = ?`,
                [...values, id]
            );

            if (result.affectedRows === 0) {
                const err = new Error('User not found.');
                err.statusCode = 404;
                throw err;
            }

            // Keep the Member/Coach Directory's own status column in step —
            // that's the field admins actually look at there.
            if (status !== undefined && (target.role === 'member' || target.role === 'coach')) {
                const table = target.role === 'member' ? 'members' : 'coaches';
                await connection.query(`UPDATE ${table} SET status = ? WHERE user_id = ?`, [toProfileStatus(status, target.role), id]);
            }
        });

        res.json({ message: 'User updated.' });
    } catch (err) {
        if (err.statusCode) {
            return res.status(err.statusCode).json({ message: err.message });
        }
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

module.exports = { getUsers, createUser, updateUser, deleteUser, completeProfile };

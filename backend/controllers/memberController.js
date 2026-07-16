const pool = require('../config/db');
const { withTransaction } = pool;
const { hashPassword } = require('../utils/password');
const { createMemberAccount } = require('../utils/memberAccount');
const {
    CURRENT_MEMBERSHIP_SELECT, CURRENT_MEMBERSHIP_JOIN,
    assignOrUpdateMembership, syncMembershipPayment,
} = require('../utils/membership');
const { toLoginStatus } = require('../utils/accountStatus');

const getMembers = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT m.member_id, m.user_id, m.full_name, m.email, m.phone, m.status, m.created_at,
                    ${CURRENT_MEMBERSHIP_SELECT}
             FROM members m
             ${CURRENT_MEMBERSHIP_JOIN}
             ORDER BY m.created_at DESC`
        );
        const data = rows.map((r) => ({ ...r, is_expired: r.is_expired === null ? null : Boolean(r.is_expired) }));
        res.json({ data });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch members.', error: err.message });
    }
};

const createMember = async (req, res) => {
    const { username, password, full_name, email, phone, status, membership_type_id, start_date } = req.body;

    try {
        const { member_id } = await withTransaction(async (connection) => {
            const password_hash = await hashPassword(password);
            const { member_id, user_id } = await createMemberAccount(connection, { username, password_hash, full_name, email, phone, status });

            // No plan selected: create the member account only. They can be
            // assigned a plan (and the matching payment) later from Payments
            // or the Member Directory's edit option.
            if (membership_type_id) {
                const { membershipId, price } = await assignOrUpdateMembership(connection, { member_id, membership_type_id, start_date });
                // Selecting a plan at registration means the admin collected
                // payment for it, so it's recorded on the payments ledger too.
                await syncMembershipPayment(connection, {
                    member_id, membershipId, amount: price, payment_date: start_date,
                    handledBy: req.user.user_id, notes: 'Membership fee collected at registration',
                });
            }

            return { member_id, user_id };
        });

        res.status(201).json({ message: 'Member created.', member_id });
    } catch (err) {
        if (err.statusCode) {
            return res.status(err.statusCode).json({ message: err.message });
        }
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
        await withTransaction(async (connection) => {
            const [[member]] = await connection.query('SELECT user_id FROM members WHERE member_id = ?', [id]);
            if (!member) {
                const err = new Error('Member not found.');
                err.statusCode = 404;
                throw err;
            }

            await connection.query(
                'UPDATE members SET full_name = ?, email = ?, phone = ?, status = ? WHERE member_id = ?',
                [full_name, email, phone, status, id]
            );

            // A suspended/inactive member shouldn't still be able to log in
            // — this is what actually gates access, members.status alone is
            // just a directory label.
            await connection.query('UPDATE users SET status = ? WHERE user_id = ?', [toLoginStatus(status), member.user_id]);
        });

        res.json({ message: 'Member updated.' });
    } catch (err) {
        if (err.statusCode) {
            return res.status(err.statusCode).json({ message: err.message });
        }
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Email is already in use.' });
        }
        res.status(500).json({ message: 'Failed to update member.', error: err.message });
    }
};

// Assigns a plan to a member with none yet, or edits their current plan
// in place (change of plan/price/dates) — either way the linked payment
// is created/updated to match, so the ledger never drifts from the plan.
const updateMembership = async (req, res) => {
    const { id } = req.params;
    const { membership_type_id, start_date } = req.body;

    try {
        const [[member]] = await pool.query('SELECT member_id FROM members WHERE member_id = ?', [id]);
        if (!member) {
            return res.status(404).json({ message: 'Member not found.' });
        }

        const result = await withTransaction(async (connection) => {
            const { membershipId, price } = await assignOrUpdateMembership(connection, { member_id: id, membership_type_id, start_date });
            return syncMembershipPayment(connection, {
                member_id: id, membershipId, amount: price, payment_date: start_date,
                handledBy: req.user.user_id, notes: 'Membership plan updated by admin',
            });
        });

        res.json({ message: 'Membership plan updated.', ...result });
    } catch (err) {
        if (err.statusCode) {
            return res.status(err.statusCode).json({ message: err.message });
        }
        res.status(500).json({ message: 'Failed to update membership.', error: err.message });
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

module.exports = { getMembers, createMember, updateMember, updateMembership, deleteMember };

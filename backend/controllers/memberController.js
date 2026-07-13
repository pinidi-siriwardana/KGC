const pool = require('../config/db');
const { withTransaction } = pool;
const { hashPassword } = require('../utils/password');
const { createMemberAccount } = require('../utils/memberAccount');
const { CURRENT_MEMBERSHIP_SELECT, CURRENT_MEMBERSHIP_JOIN } = require('../utils/membership');

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
            const [[membershipType]] = await connection.query(
                'SELECT duration_months, price FROM membership_types WHERE membership_type_id = ?',
                [membership_type_id]
            );

            if (!membershipType) {
                const err = new Error('Invalid membership_type_id.');
                err.statusCode = 400;
                throw err;
            }

            const password_hash = await hashPassword(password);
            const { member_id, user_id } = await createMemberAccount(connection, { username, password_hash, full_name, email, phone, status });

            await connection.query(
                `INSERT INTO memberships (member_id, membership_type_id, purchase_price, start_date, end_date, status)
                 VALUES (?, ?, ?, COALESCE(?, CURDATE()), DATE_ADD(COALESCE(?, CURDATE()), INTERVAL ? MONTH), 'active')`,
                [member_id, membership_type_id, membershipType.price, start_date || null, start_date || null, membershipType.duration_months]
            );

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

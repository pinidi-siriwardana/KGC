const pool = require('../config/db');

// "Current" membership = the most recent row for that member (latest start_date,
// tie-broken by membership_id for same-day renewals). Expiry is always computed
// from end_date rather than trusted from the stored status column, since nothing
// keeps that column in sync as time passes.
const getCurrentMembership = async (memberId) => {
    const [[row]] = await pool.query(
        `SELECT ms.membership_id, ms.membership_type_id, mt.name AS plan_name,
                ms.purchase_price, ms.start_date, ms.end_date, ms.status,
                (ms.end_date < CURDATE()) AS is_expired,
                DATEDIFF(ms.end_date, CURDATE()) AS days_remaining
         FROM memberships ms
         JOIN membership_types mt ON mt.membership_type_id = ms.membership_type_id
         WHERE ms.member_id = ?
         ORDER BY ms.start_date DESC, ms.membership_id DESC
         LIMIT 1`,
        [memberId]
    );

    if (!row) return null;

    return { ...row, is_expired: Boolean(row.is_expired) };
};

// SQL fragments for bulk listing (e.g. the admin members list). Requires the
// caller's `members` table to be aliased as `m`.
const CURRENT_MEMBERSHIP_SELECT = `
    cm.membership_type_id,
    mt.name AS membership_plan,
    cm.start_date AS membership_start_date,
    cm.end_date AS membership_end_date,
    cm.status AS membership_status,
    (cm.end_date < CURDATE()) AS is_expired
`;

const CURRENT_MEMBERSHIP_JOIN = `
    LEFT JOIN memberships cm ON cm.membership_id = (
        SELECT ms2.membership_id FROM memberships ms2
        WHERE ms2.member_id = m.member_id
        ORDER BY ms2.start_date DESC, ms2.membership_id DESC
        LIMIT 1
    )
    LEFT JOIN membership_types mt ON mt.membership_type_id = cm.membership_type_id
`;

// Creates the member's first membership row, or edits their current one in
// place (plan/price/dates) if they already have one — same entry point
// whether an admin is assigning a plan for the first time or correcting an
// existing one, so there's only one code path to keep payments in sync with.
const assignOrUpdateMembership = async (connection, { member_id, membership_type_id, start_date }) => {
    const [[membershipType]] = await connection.query(
        'SELECT duration_months, price FROM membership_types WHERE membership_type_id = ?',
        [membership_type_id]
    );

    if (!membershipType) {
        const err = new Error('Invalid membership_type_id.');
        err.statusCode = 400;
        throw err;
    }

    const [[currentRow]] = await connection.query(
        `SELECT membership_id FROM memberships WHERE member_id = ? ORDER BY start_date DESC, membership_id DESC LIMIT 1`,
        [member_id]
    );

    let membershipId;
    if (currentRow) {
        membershipId = currentRow.membership_id;
        await connection.query(
            `UPDATE memberships SET membership_type_id = ?, purchase_price = ?,
                    start_date = COALESCE(?, CURDATE()),
                    end_date = DATE_ADD(COALESCE(?, CURDATE()), INTERVAL ? MONTH),
                    status = 'active'
             WHERE membership_id = ?`,
            [membership_type_id, membershipType.price, start_date || null, start_date || null, membershipType.duration_months, membershipId]
        );
    } else {
        const [insertResult] = await connection.query(
            `INSERT INTO memberships (member_id, membership_type_id, purchase_price, start_date, end_date, status)
             VALUES (?, ?, ?, COALESCE(?, CURDATE()), DATE_ADD(COALESCE(?, CURDATE()), INTERVAL ? MONTH), 'active')`,
            [member_id, membership_type_id, membershipType.price, start_date || null, start_date || null, membershipType.duration_months]
        );
        membershipId = insertResult.insertId;
    }

    return { membershipId, price: membershipType.price };
};

// Keeps the payments ledger truthful whenever a plan is assigned or edited:
// the payment already linked to this exact membership_id (if any) is updated
// in place instead of leaving a stale amount or inserting a duplicate row.
const syncMembershipPayment = async (connection, { member_id, membershipId, amount, payment_date, handledBy, notes }) => {
    const [[existingPayment]] = await connection.query(
        `SELECT payment_id FROM payments WHERE membership_id = ? ORDER BY payment_id DESC LIMIT 1`,
        [membershipId]
    );

    if (existingPayment) {
        await connection.query(
            `UPDATE payments SET amount = ?, payment_date = COALESCE(?, payment_date), status = 'completed', notes = COALESCE(?, notes)
             WHERE payment_id = ?`,
            [amount, payment_date || null, notes || null, existingPayment.payment_id]
        );
        return { payment_id: existingPayment.payment_id, membership_id: membershipId };
    }

    const [insertResult] = await connection.query(
        `INSERT INTO payments (amount, payment_date, payment_type, member_id, membership_id, handled_by, status, notes)
         VALUES (?, COALESCE(?, NOW()), 'membership', ?, ?, ?, 'completed', ?)`,
        [amount, payment_date || null, member_id, membershipId, handledBy, notes || null]
    );
    return { payment_id: insertResult.insertId, membership_id: membershipId };
};

module.exports = {
    getCurrentMembership, CURRENT_MEMBERSHIP_SELECT, CURRENT_MEMBERSHIP_JOIN,
    assignOrUpdateMembership, syncMembershipPayment,
};

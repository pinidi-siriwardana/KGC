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

module.exports = { getCurrentMembership, CURRENT_MEMBERSHIP_SELECT, CURRENT_MEMBERSHIP_JOIN };

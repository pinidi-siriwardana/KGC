const pool = require('../config/db');

// Revenue reporting is scoped to realized income only — 'recorded' payments
// are still outstanding/unpaid, and 'failed'/'refunded'/'waived' never
// became revenue, so status is always pinned here rather than filterable.
const REVENUE_STATUS = 'completed';

const toISODate = (date) => date.toISOString().slice(0, 10);

// Only used to default an *unset* `to` — CURDATE() rather than Node's
// `new Date().toISOString()` (always UTC), which for a club in UTC+5:30
// would default the report range to end "yesterday" for the first ~5.5
// hours of every real day, silently excluding that morning's transactions.
// Every other date computed in this file is pure day-count arithmetic on an
// already-known date string (no ambiguity — see toISODate's other callers
// below), so this is the one spot that actually needed a DB round-trip.
const getToday = async () => {
    const [[{ today }]] = await pool.query('SELECT CURDATE() AS today');
    return today;
};

// Query params are optional (e.g. this controller reused without a UI-driven
// range), so a bounded default keeps the query and the trend comparison
// well-defined instead of scanning the entire payments history.
const resolveRange = async (from, to) => {
    const effectiveTo = to || await getToday();
    const effectiveFrom = from || toISODate(new Date(new Date(effectiveTo).getTime() - 29 * 86400000));
    return { effectiveFrom, effectiveTo };
};

const buildConditions = ({ type, search, effectiveFrom, effectiveTo }) => {
    const conditions = [`p.status = ?`, `DATE(p.payment_date) BETWEEN ? AND ?`];
    const values = [REVENUE_STATUS, effectiveFrom, effectiveTo];

    if (type) {
        conditions.push('p.payment_type = ?');
        values.push(type);
    }
    if (search) {
        conditions.push('COALESCE(m.full_name, c.full_name, g.full_name) LIKE ?');
        values.push(`%${search}%`);
    }

    return { whereClause: `WHERE ${conditions.join(' AND ')}`, values };
};

const PAYER_JOIN = `
    LEFT JOIN members m ON p.member_id = m.member_id
    LEFT JOIN coaches c ON p.coach_id = c.coach_id
    LEFT JOIN bookings b ON p.booking_id = b.booking_id
    LEFT JOIN guests g ON b.guest_id = g.guest_id
`;

const GROUP_EXPR = {
    day: 'DATE(p.payment_date)',
    week: `DATE_SUB(DATE(p.payment_date), INTERVAL WEEKDAY(p.payment_date) DAY)`,
    month: `DATE_FORMAT(p.payment_date, '%Y-%m-01')`,
};

// Shared by the /summary HTTP handler and the admin dashboard overview,
// which both need the exact same totals/trend computation.
const fetchRevenueSummary = async ({ from, to, type, search, groupBy = 'day' } = {}) => {
    const { effectiveFrom, effectiveTo } = await resolveRange(from, to);
    const { whereClause, values } = buildConditions({ type, search, effectiveFrom, effectiveTo });
    // An unrecognized groupBy (typo, stale client, manual API call) would
    // otherwise interpolate as literal `undefined` into the SQL below and
    // 500 with a raw "unknown column" error — falling back to 'day' keeps
    // this a safe default instead of a crash.
    const groupExpr = GROUP_EXPR[groupBy] || GROUP_EXPR.day;

    // Previous period of equal length, immediately preceding effectiveFrom.
    const rangeDays = Math.round((new Date(effectiveTo) - new Date(effectiveFrom)) / 86400000) + 1;
    const prevTo = toISODate(new Date(new Date(effectiveFrom).getTime() - 86400000));
    const prevFrom = toISODate(new Date(new Date(prevTo).getTime() - (rangeDays - 1) * 86400000));
    const { whereClause: prevWhereClause, values: prevValues } = buildConditions({ type, search, effectiveFrom: prevFrom, effectiveTo: prevTo });

    const [[totals]] = await pool.query(
        `SELECT COALESCE(SUM(p.amount), 0) AS total_revenue,
                COUNT(*) AS transaction_count,
                COALESCE(AVG(p.amount), 0) AS average_amount
         FROM payments p ${PAYER_JOIN} ${whereClause}`,
        values
    );

    const [byType] = await pool.query(
        `SELECT p.payment_type, COALESCE(SUM(p.amount), 0) AS total, COUNT(*) AS count
         FROM payments p ${PAYER_JOIN} ${whereClause}
         GROUP BY p.payment_type
         ORDER BY total DESC`,
        values
    );

    const [timeseries] = await pool.query(
        `SELECT ${groupExpr} AS period, COALESCE(SUM(p.amount), 0) AS total
         FROM payments p ${PAYER_JOIN} ${whereClause}
         GROUP BY period
         ORDER BY period ASC`,
        values
    );

    const [[prevTotals]] = await pool.query(
        `SELECT COALESCE(SUM(p.amount), 0) AS total_revenue
         FROM payments p ${PAYER_JOIN} ${prevWhereClause}`,
        prevValues
    );

    const previousRevenue = Number(prevTotals.total_revenue);
    const currentRevenue = Number(totals.total_revenue);
    const trendPercent = previousRevenue > 0
        ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
        : (currentRevenue > 0 ? 100 : 0);

    return {
        range: { from: effectiveFrom, to: effectiveTo, groupBy },
        totalRevenue: currentRevenue,
        transactionCount: Number(totals.transaction_count),
        averageAmount: Number(totals.average_amount),
        previousRevenue,
        trendPercent,
        byType,
        timeseries,
    };
};

const getRevenueSummary = async (req, res) => {
    const { from, to, type, search, groupBy } = req.query;
    try {
        const data = await fetchRevenueSummary({ from, to, type, search, groupBy });
        res.json({ data });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch revenue summary.', error: err.message });
    }
};

const getRevenueTransactions = async (req, res) => {
    const { from, to, type, search } = req.query;

    try {
        const { effectiveFrom, effectiveTo } = await resolveRange(from, to);
        const { whereClause, values } = buildConditions({ type, search, effectiveFrom, effectiveTo });

        const [rows] = await pool.query(
            `SELECT p.*, COALESCE(m.full_name, c.full_name, g.full_name) AS payer_name,
                    u.username AS handled_by_username
             FROM payments p ${PAYER_JOIN}
             LEFT JOIN users u ON p.handled_by = u.user_id
             ${whereClause}
             ORDER BY p.payment_date DESC`,
            values
        );
        res.json({ data: rows });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch revenue transactions.', error: err.message });
    }
};

module.exports = { getRevenueSummary, getRevenueTransactions, fetchRevenueSummary };

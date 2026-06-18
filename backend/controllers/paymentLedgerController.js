const pool = require('../config/db');

// Lists the actual payments ledger (completed/recorded transactions), not the
// pending/history review queue — that's paymentVerificationController's job.
const getPayments = async (req, res) => {
    const { type, date, search } = req.query;

    const conditions = [];
    const values = [];

    if (type) {
        conditions.push('p.payment_type = ?');
        values.push(type);
    }
    if (date) {
        conditions.push('DATE(p.payment_date) = ?');
        values.push(date);
    }
    if (search) {
        conditions.push('COALESCE(m.full_name, g.full_name) LIKE ?');
        values.push(`%${search}%`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    try {
        const [rows] = await pool.query(
            `SELECT p.*, COALESCE(m.full_name, g.full_name) AS payer_name
             FROM payments p
             LEFT JOIN members m ON p.member_id = m.member_id
             LEFT JOIN bookings b ON p.booking_id = b.booking_id
             LEFT JOIN guests g ON b.guest_id = g.guest_id
             ${whereClause}
             ORDER BY p.payment_date DESC`,
            values
        );
        res.json({ data: rows });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch payments.', error: err.message });
    }
};

module.exports = { getPayments };

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
        conditions.push('COALESCE(m.full_name, c.full_name, g.full_name) LIKE ?');
        values.push(`%${search}%`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    try {
        const [rows] = await pool.query(
            `SELECT p.*, COALESCE(m.full_name, c.full_name, g.full_name) AS payer_name,
                    u.username AS handled_by_username
             FROM payments p
             LEFT JOIN members m ON p.member_id = m.member_id
             LEFT JOIN coaches c ON p.coach_id = c.coach_id
             LEFT JOIN bookings b ON p.booking_id = b.booking_id
             LEFT JOIN guests g ON b.guest_id = g.guest_id
             LEFT JOIN users u ON p.handled_by = u.user_id
             ${whereClause}
             ORDER BY p.payment_date DESC`,
            values
        );
        res.json({ data: rows });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch payments.', error: err.message });
    }
};

// Lets an admin correct a recorded payment's details after the fact (e.g. the
// amount was mistyped, or the status needs to move to refunded). Does not
// touch payment_type or the linked member/coach/booking — changing what a
// payment is "for" would require re-running the creation cascade, which is
// out of scope here; this only edits the ledger row itself.
const updatePayment = async (req, res) => {
    const { id } = req.params;
    const { amount, payment_date, notes, status } = req.body;

    const fields = [];
    const values = [];

    if (amount !== undefined) { fields.push('amount = ?'); values.push(amount); }
    if (payment_date !== undefined) { fields.push('payment_date = ?'); values.push(payment_date); }
    if (notes !== undefined) { fields.push('notes = ?'); values.push(notes || null); }
    if (status !== undefined) { fields.push('status = ?'); values.push(status); }

    try {
        const [result] = await pool.query(
            `UPDATE payments SET ${fields.join(', ')} WHERE payment_id = ?`,
            [...values, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Payment not found.' });
        }

        res.json({ message: 'Payment updated.' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to update payment.', error: err.message });
    }
};

// Outstanding arrears for every member/coach at once — 'recorded' means
// charged but not yet paid (see DB.md's payments.status note). Grouped by
// person so the Attendance screen can look someone up by id without an
// extra round trip per check-in.
const getOutstandingDues = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT payment_id, member_id, coach_id, amount, payment_type, payment_date, notes
             FROM payments
             WHERE status = 'recorded' AND (member_id IS NOT NULL OR coach_id IS NOT NULL)
             ORDER BY payment_date ASC`
        );

        const members = {};
        const coaches = {};
        for (const row of rows) {
            const bucket = row.member_id !== null ? members : coaches;
            const key = row.member_id !== null ? row.member_id : row.coach_id;
            (bucket[key] ||= []).push(row);
        }

        res.json({ members, coaches });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch outstanding dues.', error: err.message });
    }
};

module.exports = { getPayments, updatePayment, getOutstandingDues };

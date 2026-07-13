const fs = require('fs');
const pool = require('../config/db');

const resolveCoachId = async (userId) => {
    const [[row]] = await pool.query('SELECT coach_id FROM coaches WHERE user_id = ?', [userId]);
    return row ? row.coach_id : null;
};

// Self-service view of a coach's own money flow — the settled ledger plus
// their own in-flight/reviewed submissions. Mirrors memberPaymentController's
// getMyPayments, scoped to coach_id.
const getMyPayments = async (req, res) => {
    try {
        const coach_id = await resolveCoachId(req.user.user_id);
        if (!coach_id) return res.json({ payments: [], requests: [] });

        const [payments] = await pool.query(
            'SELECT * FROM payments WHERE coach_id = ? ORDER BY payment_date DESC',
            [coach_id]
        );
        const [requests] = await pool.query(
            'SELECT * FROM payment_verification WHERE coach_id = ? ORDER BY submitted_at DESC',
            [coach_id]
        );

        res.json({ payments, requests });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch payment history.', error: err.message });
    }
};

// Coach uploads a receipt for a donation/tournament fee — no membership
// renewal branch, coaches don't have a membership.
const submitPayment = async (req, res) => {
    const { payment_type, amount_declared, note } = req.body;
    const receiptFile = req.file;

    const fail = (status, message) => {
        if (receiptFile) fs.unlink(receiptFile.path, () => {});
        return res.status(status).json({ message });
    };

    if (!receiptFile) {
        return fail(400, 'A payment slip (receipt) is required.');
    }

    const finalAmount = Number(amount_declared);

    try {
        const coach_id = await resolveCoachId(req.user.user_id);
        if (!coach_id) return fail(404, 'Coach profile not found.');

        const receipt_file_url = `/uploads/slips/${receiptFile.filename}`;

        const [result] = await pool.query(
            `INSERT INTO payment_verification (coach_id, payment_type, receipt_file_url, amount_declared, note, status)
             VALUES (?, ?, ?, ?, ?, 'pending')`,
            [coach_id, payment_type, receipt_file_url, finalAmount, note || null]
        );

        res.status(201).json({ message: 'Payment submitted for review.', verification_id: result.insertId });
    } catch (err) {
        if (receiptFile) fs.unlink(receiptFile.path, () => {});
        res.status(500).json({ message: 'Failed to submit payment.', error: err.message });
    }
};

// Settle a specific outstanding fee (e.g. a self-cancellation fee still
// status='recorded') — mirrors memberPaymentController.payOutstandingFee.
const payOutstandingFee = async (req, res) => {
    const { paymentId } = req.params;
    const { note } = req.body;
    const receiptFile = req.file;

    const fail = (status, message) => {
        if (receiptFile) fs.unlink(receiptFile.path, () => {});
        return res.status(status).json({ message });
    };

    if (!receiptFile) return fail(400, 'A payment slip (receipt) is required.');

    try {
        const coach_id = await resolveCoachId(req.user.user_id);
        if (!coach_id) return fail(404, 'Coach profile not found.');

        const [[payment]] = await pool.query(
            'SELECT * FROM payments WHERE payment_id = ? AND coach_id = ?',
            [paymentId, coach_id]
        );
        if (!payment) return fail(404, 'Payment not found.');
        if (payment.status !== 'recorded') return fail(409, `This fee is already ${payment.status}.`);

        const [[pending]] = await pool.query(
            "SELECT verification_id FROM payment_verification WHERE settles_payment_id = ? AND status = 'pending'",
            [paymentId]
        );
        if (pending) return fail(409, 'A submission for this fee is already awaiting review.');

        const receipt_file_url = `/uploads/slips/${receiptFile.filename}`;

        const [result] = await pool.query(
            `INSERT INTO payment_verification (coach_id, payment_type, settles_payment_id, receipt_file_url, amount_declared, note, status)
             VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
            [coach_id, payment.payment_type, paymentId, receipt_file_url, payment.amount, note || null]
        );

        res.status(201).json({ message: 'Payment submitted for review.', verification_id: result.insertId });
    } catch (err) {
        if (receiptFile) fs.unlink(receiptFile.path, () => {});
        res.status(500).json({ message: 'Failed to submit payment.', error: err.message });
    }
};

// Mirrors memberPaymentController.getDuesSummary, scoped to coach_id.
const getDuesSummary = async (req, res) => {
    try {
        const coach_id = await resolveCoachId(req.user.user_id);
        if (!coach_id) return res.json({ hasDues: false, totalDue: 0, count: 0 });

        const [[row]] = await pool.query(
            "SELECT COUNT(*) AS count, COALESCE(SUM(amount), 0) AS total FROM payments WHERE coach_id = ? AND status = 'recorded'",
            [coach_id]
        );

        res.json({ hasDues: row.count > 0, totalDue: row.total, count: row.count });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch dues summary.', error: err.message });
    }
};

module.exports = { getMyPayments, submitPayment, payOutstandingFee, getDuesSummary };

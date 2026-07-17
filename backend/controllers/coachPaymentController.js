const fs = require('fs');
const pool = require('../config/db');
const { withTransaction } = pool;

const resolveCoachId = async (userId) => {
    const [[row]] = await pool.query('SELECT coach_id FROM coaches WHERE user_id = ?', [userId]);
    return row ? row.coach_id : null;
};

// Mirrors memberPaymentController's own helper of the same name — throws a
// 409-tagged error if a pending payment_verification row already matches
// whereClause. Callers run this inside a withTransaction against a locked
// row so the check can't race with another request's INSERT.
const assertNoPendingVerification = async (connection, whereClause, params, message) => {
    const [[pending]] = await connection.query(
        `SELECT verification_id FROM payment_verification WHERE ${whereClause} AND status = 'pending'`,
        params
    );
    if (pending) {
        const err = new Error(message);
        err.statusCode = 409;
        throw err;
    }
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

        const verification_id = await withTransaction(async (connection) => {
            // Locking the coach's own row serializes concurrent submissions
            // from that coach (double-click, two tabs) — same reasoning as
            // memberPaymentController.submitPayment.
            await connection.query('SELECT coach_id FROM coaches WHERE coach_id = ? FOR UPDATE', [coach_id]);

            const [result] = await connection.query(
                `INSERT INTO payment_verification (coach_id, payment_type, receipt_file_url, amount_declared, note, status)
                 VALUES (?, ?, ?, ?, ?, 'pending')`,
                [coach_id, payment_type, receipt_file_url, finalAmount, note || null]
            );
            return result.insertId;
        });

        res.status(201).json({ message: 'Payment submitted for review.', verification_id });
    } catch (err) {
        if (receiptFile) fs.unlink(receiptFile.path, () => {});
        if (err.statusCode) {
            return res.status(err.statusCode).json({ message: err.message });
        }
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

        const receipt_file_url = `/uploads/slips/${receiptFile.filename}`;

        const verification_id = await withTransaction(async (connection) => {
            // Locking the fee row serializes concurrent settlement
            // submissions for the same outstanding payment — same reasoning
            // as memberPaymentController.payOutstandingFee. Without this,
            // a double-click could pass the "no pending submission yet"
            // check twice before either INSERT commits, leaving two pending
            // receipts for one fee.
            const [[payment]] = await connection.query(
                'SELECT * FROM payments WHERE payment_id = ? AND coach_id = ? FOR UPDATE',
                [paymentId, coach_id]
            );
            if (!payment) {
                const err = new Error('Payment not found.');
                err.statusCode = 404;
                throw err;
            }
            if (payment.status !== 'recorded') {
                const err = new Error(`This fee is already ${payment.status}.`);
                err.statusCode = 409;
                throw err;
            }

            await assertNoPendingVerification(
                connection,
                'settles_payment_id = ?',
                [paymentId],
                'A submission for this fee is already awaiting review.'
            );

            const [result] = await connection.query(
                `INSERT INTO payment_verification (coach_id, payment_type, settles_payment_id, receipt_file_url, amount_declared, note, status)
                 VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
                [coach_id, payment.payment_type, paymentId, receipt_file_url, payment.amount, note || null]
            );
            return result.insertId;
        });

        res.status(201).json({ message: 'Payment submitted for review.', verification_id });
    } catch (err) {
        if (receiptFile) fs.unlink(receiptFile.path, () => {});
        if (err.statusCode) {
            return res.status(err.statusCode).json({ message: err.message });
        }
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

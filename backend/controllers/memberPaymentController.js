const fs = require('fs');
const pool = require('../config/db');
const { withTransaction } = pool;

const resolveMemberId = async (userId) => {
    const [[row]] = await pool.query('SELECT member_id FROM members WHERE user_id = ?', [userId]);
    return row ? row.member_id : null;
};

const makeFail = (res, receiptFile) => (status, message) => {
    if (receiptFile) fs.unlink(receiptFile.path, () => {});
    return res.status(status).json({ message });
};

// Throws a 409-tagged error if a pending payment_verification row already
// matches whereClause — shared by submitPayment (one pending renewal per
// member) and payOutstandingFee (one pending settlement per fee). Callers
// run this inside a withTransaction against a locked row so the check can't
// race with another request's INSERT.
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

// Self-service view of a member's own money flow: the settled ledger
// (payments) plus their own in-flight/reviewed submissions (payment_verification),
// so they can see "pending review" and "rejected" alongside what's actually landed.
const getMyPayments = async (req, res) => {
    try {
        const member_id = await resolveMemberId(req.user.user_id);
        if (!member_id) return res.json({ payments: [], requests: [] });

        const [payments] = await pool.query(
            'SELECT * FROM payments WHERE member_id = ? ORDER BY payment_date DESC',
            [member_id]
        );
        const [requests] = await pool.query(
            `SELECT pv.*, mt.name AS requested_plan_name
             FROM payment_verification pv
             LEFT JOIN membership_types mt ON pv.membership_type_id = mt.membership_type_id
             WHERE pv.member_id = ?
             ORDER BY pv.submitted_at DESC`,
            [member_id]
        );

        res.json({ payments, requests });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch payment history.', error: err.message });
    }
};

// Member uploads a receipt for a renewal/donation/tournament fee; lands in
// the same pending-review queue admin already uses for registration slips.
const submitPayment = async (req, res) => {
    const { payment_type, membership_type_id, amount_declared, note } = req.body;
    const receiptFile = req.file;
    const fail = makeFail(res, receiptFile);

    if (!receiptFile) {
        return fail(400, 'A payment slip (receipt) is required.');
    }

    try {
        const member_id = await resolveMemberId(req.user.user_id);
        if (!member_id) return fail(404, 'Member profile not found.');

        const receipt_file_url = `/uploads/slips/${receiptFile.filename}`;

        const verification_id = await withTransaction(async (connection) => {
            // Locking the member's own row serializes concurrent submissions
            // from that member (double-click, two tabs) so the pending-renewal
            // check below can't race with another request's INSERT and let
            // two pending renewals through.
            await connection.query('SELECT member_id FROM members WHERE member_id = ? FOR UPDATE', [member_id]);

            let finalAmount = Number(amount_declared);
            let planId = null;

            if (payment_type === 'membership_renewal') {
                await assertNoPendingVerification(
                    connection,
                    "member_id = ? AND payment_type = 'membership_renewal'",
                    [member_id],
                    'You already have a renewal request awaiting review.'
                );

                const [[plan]] = await connection.query(
                    'SELECT membership_type_id, price FROM membership_types WHERE membership_type_id = ?',
                    [membership_type_id]
                );
                if (!plan) {
                    const err = new Error('Invalid membership_type_id.');
                    err.statusCode = 400;
                    throw err;
                }
                // Membership pricing is never trusted from the client — same
                // model authController.register already uses for registration.
                finalAmount = plan.price;
                planId = plan.membership_type_id;
            }

            const [result] = await connection.query(
                `INSERT INTO payment_verification (member_id, payment_type, membership_type_id, receipt_file_url, amount_declared, note, status)
                 VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
                [member_id, payment_type, planId, receipt_file_url, finalAmount, note || null]
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
// status='recorded') by uploading a receipt against that exact payment,
// rather than creating a fresh charge.
const payOutstandingFee = async (req, res) => {
    const { paymentId } = req.params;
    const { note } = req.body;
    const receiptFile = req.file;
    const fail = makeFail(res, receiptFile);

    if (!receiptFile) return fail(400, 'A payment slip (receipt) is required.');

    try {
        const member_id = await resolveMemberId(req.user.user_id);
        if (!member_id) return fail(404, 'Member profile not found.');

        const receipt_file_url = `/uploads/slips/${receiptFile.filename}`;

        const verification_id = await withTransaction(async (connection) => {
            // Locking the fee row serializes concurrent settlement submissions
            // for the same outstanding payment, same reasoning as submitPayment.
            const [[payment]] = await connection.query(
                'SELECT * FROM payments WHERE payment_id = ? AND member_id = ? FOR UPDATE',
                [paymentId, member_id]
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
                `INSERT INTO payment_verification (member_id, payment_type, settles_payment_id, receipt_file_url, amount_declared, note, status)
                 VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
                [member_id, payment.payment_type, paymentId, receipt_file_url, payment.amount, note || null]
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

// Lightweight summary consumed by the booking page's dues warning — whether
// this member has any unsettled fees (cancellation, no-show, etc) before
// they confirm a new booking.
const getDuesSummary = async (req, res) => {
    try {
        const member_id = await resolveMemberId(req.user.user_id);
        if (!member_id) return res.json({ hasDues: false, totalDue: 0, count: 0 });

        const [[row]] = await pool.query(
            "SELECT COUNT(*) AS count, COALESCE(SUM(amount), 0) AS total FROM payments WHERE member_id = ? AND status = 'recorded'",
            [member_id]
        );

        res.json({ hasDues: row.count > 0, totalDue: row.total, count: row.count });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch dues summary.', error: err.message });
    }
};

module.exports = { getMyPayments, submitPayment, payOutstandingFee, getDuesSummary };

const fs = require('fs');
const pool = require('../config/db');

const ALLOWED_TYPES = ['membership_renewal', 'donation', 'tournament_fee'];

const resolveMemberId = async (userId) => {
    const [[row]] = await pool.query('SELECT member_id FROM members WHERE user_id = ?', [userId]);
    return row ? row.member_id : null;
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

    const fail = (status, message) => {
        if (receiptFile) fs.unlink(receiptFile.path, () => {});
        return res.status(status).json({ message });
    };

    if (!ALLOWED_TYPES.includes(payment_type)) {
        return fail(400, "payment_type must be 'membership_renewal', 'donation' or 'tournament_fee'.");
    }
    if (!receiptFile) {
        return fail(400, 'A payment slip (receipt) is required.');
    }

    try {
        const member_id = await resolveMemberId(req.user.user_id);
        if (!member_id) return fail(404, 'Member profile not found.');

        let finalAmount = Number(amount_declared);
        let planId = null;

        if (payment_type === 'membership_renewal') {
            if (!membership_type_id) return fail(400, 'membership_type_id is required for a membership renewal.');
            const [[plan]] = await pool.query(
                'SELECT membership_type_id, price FROM membership_types WHERE membership_type_id = ?',
                [membership_type_id]
            );
            if (!plan) return fail(400, 'Invalid membership_type_id.');
            // Membership pricing is never trusted from the client — same
            // model authController.register already uses for registration.
            finalAmount = plan.price;
            planId = plan.membership_type_id;
        } else if (!Number.isFinite(finalAmount) || finalAmount <= 0) {
            return fail(400, 'amount_declared must be a positive number.');
        }

        const receipt_file_url = `/uploads/slips/${receiptFile.filename}`;

        const [result] = await pool.query(
            `INSERT INTO payment_verification (member_id, payment_type, membership_type_id, receipt_file_url, amount_declared, note, status)
             VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
            [member_id, payment_type, planId, receipt_file_url, finalAmount, note || null]
        );

        res.status(201).json({ message: 'Payment submitted for review.', verification_id: result.insertId });
    } catch (err) {
        if (receiptFile) fs.unlink(receiptFile.path, () => {});
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

    const fail = (status, message) => {
        if (receiptFile) fs.unlink(receiptFile.path, () => {});
        return res.status(status).json({ message });
    };

    if (!receiptFile) return fail(400, 'A payment slip (receipt) is required.');

    try {
        const member_id = await resolveMemberId(req.user.user_id);
        if (!member_id) return fail(404, 'Member profile not found.');

        const [[payment]] = await pool.query(
            'SELECT * FROM payments WHERE payment_id = ? AND member_id = ?',
            [paymentId, member_id]
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
            `INSERT INTO payment_verification (member_id, payment_type, settles_payment_id, receipt_file_url, amount_declared, note, status)
             VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
            [member_id, payment.payment_type, paymentId, receipt_file_url, payment.amount, note || null]
        );

        res.status(201).json({ message: 'Payment submitted for review.', verification_id: result.insertId });
    } catch (err) {
        if (receiptFile) fs.unlink(receiptFile.path, () => {});
        res.status(500).json({ message: 'Failed to submit payment.', error: err.message });
    }
};

module.exports = { getMyPayments, submitPayment, payOutstandingFee };

const pool = require('../config/db');
const { withTransaction } = pool;
const { hashPassword } = require('../utils/password');
const { createMemberAccount } = require('../utils/memberAccount');
const { createCoachAccount } = require('../utils/coachAccount');
const { assignOrUpdateMembership, syncMembershipPayment } = require('../utils/membership');

const badRequest = (message) => {
    const err = new Error(message);
    err.statusCode = 400;
    throw err;
};

const createNewMemberPayment = async (connection, { username, password, full_name, email, phone, membership_type_id, start_date }) => {
    const password_hash = await hashPassword(password);
    const { member_id } = await createMemberAccount(connection, { username, password_hash, full_name, email, phone });

    const { membershipId } = await assignOrUpdateMembership(connection, { member_id, membership_type_id, start_date });

    return { payment_type: 'membership', member_id, coach_id: null, membershipId, extra: { member_id } };
};

const createNewCoachPayment = async (connection, { username, password, full_name, email, phone, specialization, experience_years }) => {
    const password_hash = await hashPassword(password);
    const { coach_id } = await createCoachAccount(connection, { username, password_hash, full_name, email, phone, specialization, experience_years });

    return { payment_type: 'coach_registration', member_id: null, coach_id, extra: { coach_id } };
};

const createMiscPayment = async (connection, { member_id }) => {
    if (member_id) {
        const [[member]] = await connection.query('SELECT member_id FROM members WHERE member_id = ?', [member_id]);
        if (!member) badRequest('Invalid member_id.');
    }

    return { payment_type: 'other', member_id: member_id || null, coach_id: null, extra: {} };
};

// Assigns a plan to an existing member who has none, or edits their current
// plan (e.g. correcting the plan/price/dates) if they already have one —
// either way the payment linked to that membership is created/updated to
// match, via the same sync helper used by the Member Directory edit option.
const assignPlanAndSyncPayment = async (connection, { member_id, membership_type_id, start_date }, amount, paymentDate, notes, handledBy) => {
    const [[member]] = await connection.query('SELECT member_id FROM members WHERE member_id = ?', [member_id]);
    if (!member) badRequest('Invalid member_id.');

    const { membershipId, price } = await assignOrUpdateMembership(connection, { member_id, membership_type_id, start_date });
    const finalAmount = Number.isFinite(amount) && amount > 0 ? amount : price;

    const synced = await syncMembershipPayment(connection, {
        member_id, membershipId, amount: finalAmount, payment_date: paymentDate, handledBy, notes,
    });

    return { ...synced, member_id };
};

const createManualPayment = async (req, res) => {
    const { purpose, amount, payment_date, notes, ...rest } = req.body;

    const numericAmount = Number(amount);

    try {
        const result = await withTransaction(async (connection) => {
            // assign_plan can either create or edit a membership, so it needs
            // upsert semantics — everyone else is a plain one-off insert.
            if (purpose === 'assign_plan') {
                return assignPlanAndSyncPayment(connection, rest, numericAmount, payment_date, notes, req.user.user_id);
            }

            let outcome;
            if (purpose === 'new_member') {
                outcome = await createNewMemberPayment(connection, rest);
            } else if (purpose === 'new_coach') {
                outcome = await createNewCoachPayment(connection, rest);
            } else {
                outcome = await createMiscPayment(connection, rest);
            }

            const [paymentResult] = await connection.query(
                `INSERT INTO payments (amount, payment_date, payment_type, member_id, coach_id, membership_id, handled_by, status, notes)
                 VALUES (?, COALESCE(?, NOW()), ?, ?, ?, ?, ?, 'completed', ?)`,
                [numericAmount, payment_date || null, outcome.payment_type, outcome.member_id, outcome.coach_id, outcome.membershipId || null, req.user.user_id, notes || null]
            );

            return { payment_id: paymentResult.insertId, ...outcome.extra };
        });

        res.status(201).json({ message: 'Payment recorded.', ...result });
    } catch (err) {
        if (err.statusCode) {
            return res.status(err.statusCode).json({ message: err.message });
        }
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Username or email is already in use.' });
        }
        res.status(500).json({ message: 'Failed to record payment.', error: err.message });
    }
};

module.exports = { createManualPayment };

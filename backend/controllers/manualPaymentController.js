const pool = require('../config/db');
const { withTransaction } = pool;
const { hashPassword } = require('../utils/password');
const { createMemberAccount } = require('../utils/memberAccount');
const { createCoachAccount } = require('../utils/coachAccount');

const badRequest = (message) => {
    const err = new Error(message);
    err.statusCode = 400;
    throw err;
};

const createNewMemberPayment = async (connection, { username, password, full_name, email, phone, membership_type_id, start_date }, amount, handledBy) => {
    const [[membershipType]] = await connection.query(
        'SELECT duration_months, price FROM membership_types WHERE membership_type_id = ?',
        [membership_type_id]
    );
    if (!membershipType) badRequest('Invalid membership_type_id.');

    const password_hash = await hashPassword(password);
    const { member_id } = await createMemberAccount(connection, { username, password_hash, full_name, email, phone });

    await connection.query(
        `INSERT INTO memberships (member_id, membership_type_id, purchase_price, start_date, end_date, status)
         VALUES (?, ?, ?, COALESCE(?, CURDATE()), DATE_ADD(COALESCE(?, CURDATE()), INTERVAL ? MONTH), 'active')`,
        [member_id, membership_type_id, membershipType.price, start_date || null, start_date || null, membershipType.duration_months]
    );

    return { payment_type: 'membership', member_id, coach_id: null, extra: { member_id } };
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

const createManualPayment = async (req, res) => {
    const { purpose, amount, payment_date, notes, ...rest } = req.body;

    const numericAmount = Number(amount);

    try {
        const result = await withTransaction(async (connection) => {
            let outcome;
            if (purpose === 'new_member') {
                outcome = await createNewMemberPayment(connection, rest, numericAmount, req.user.user_id);
            } else if (purpose === 'new_coach') {
                outcome = await createNewCoachPayment(connection, rest);
            } else {
                outcome = await createMiscPayment(connection, rest);
            }

            const [paymentResult] = await connection.query(
                `INSERT INTO payments (amount, payment_date, payment_type, member_id, coach_id, handled_by, status, notes)
                 VALUES (?, COALESCE(?, NOW()), ?, ?, ?, ?, 'completed', ?)`,
                [numericAmount, payment_date || null, outcome.payment_type, outcome.member_id, outcome.coach_id, req.user.user_id, notes || null]
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

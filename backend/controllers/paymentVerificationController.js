const pool = require('../config/db');
const { withTransaction } = pool;
const { createMemberAccount } = require('../utils/memberAccount');

const VERIFICATION_JOIN_QUERY = `
    SELECT pv.*,
           COALESCE(rr.full_name, m.full_name, g.full_name) AS full_name,
           COALESCE(rr.email, m.email, g.email) AS email
    FROM payment_verification pv
    LEFT JOIN registration_requests rr ON pv.request_id = rr.request_id
    LEFT JOIN bookings b ON pv.booking_id = b.booking_id
    LEFT JOIN members m ON b.member_id = m.member_id
    LEFT JOIN guests g ON b.guest_id = g.guest_id
`;

const getPendingVerifications = async (req, res) => {
    try {
        const [rows] = await pool.query(`${VERIFICATION_JOIN_QUERY} WHERE pv.status = 'pending' ORDER BY pv.submitted_at DESC`);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch pending verifications.', error: err.message });
    }
};

const getVerificationHistory = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `${VERIFICATION_JOIN_QUERY} WHERE pv.status != 'pending' ORDER BY pv.reviewed_at DESC LIMIT 100`
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch verification history.', error: err.message });
    }
};

const getVerification = async (id) => {
    const [[row]] = await pool.query('SELECT * FROM payment_verification WHERE verification_id = ?', [id]);
    return row;
};

// Approving a registration-type verification doesn't just flip a status: it
// activates the applicant into a real account (users + members), opens their
// membership term, and records the payment, all in one transaction so a
// failure partway through doesn't leave a half-created member.
const approveRegistration = async (connection, verification, reviewerId, remarks) => {
    const [[request]] = await connection.query(
        'SELECT * FROM registration_requests WHERE request_id = ?',
        [verification.request_id]
    );

    if (!request) {
        throw new Error('Linked registration request not found.');
    }
    if (request.status !== 'pending') {
        const err = new Error('This registration has already been reviewed.');
        err.statusCode = 409;
        throw err;
    }

    const { member_id } = await createMemberAccount(connection, {
        username: request.username,
        password_hash: request.password_hash,
        full_name: request.full_name,
        email: request.email,
        phone: request.phone,
        status: 'active',
    });

    if (request.membership_type_id) {
        const [[membershipType]] = await connection.query(
            'SELECT duration_months, price FROM membership_types WHERE membership_type_id = ?',
            [request.membership_type_id]
        );

        if (membershipType) {
            await connection.query(
                `INSERT INTO memberships (member_id, membership_type_id, purchase_price, start_date, end_date, status)
                 VALUES (?, ?, ?, CURDATE(), DATE_ADD(CURDATE(), INTERVAL ? MONTH), 'active')`,
                [member_id, request.membership_type_id, membershipType.price, membershipType.duration_months]
            );
        }
    }

    await connection.query(
        `INSERT INTO payments (amount, payment_type, member_id, verification_id, handled_by, status)
         VALUES (?, 'membership', ?, ?, ?, 'completed')`,
        [verification.amount_declared, member_id, verification.verification_id, reviewerId]
    );

    await connection.query(
        "UPDATE registration_requests SET status = 'approved', reviewed_by = ?, reviewed_at = NOW() WHERE request_id = ?",
        [reviewerId, request.request_id]
    );

    await connection.query(
        "UPDATE payment_verification SET status = 'approved', reviewed_by = ?, reviewed_at = NOW(), remarks = ? WHERE verification_id = ?",
        [reviewerId, remarks || null, verification.verification_id]
    );

    return { member_id };
};

const rejectRegistration = async (connection, verification, reviewerId, remarks) => {
    await connection.query(
        "UPDATE registration_requests SET status = 'rejected', reviewed_by = ?, reviewed_at = NOW() WHERE request_id = ?",
        [reviewerId, verification.request_id]
    );

    await connection.query(
        "UPDATE payment_verification SET status = 'rejected', reviewed_by = ?, reviewed_at = NOW(), remarks = ? WHERE verification_id = ?",
        [reviewerId, remarks || null, verification.verification_id]
    );
};

// Booking/membership-renewal/other verifications don't have a cascade workflow
// built yet (see TODO.md) — they just get their status recorded.
const reviewOther = async (connection, status, verification, reviewerId, remarks) => {
    await connection.query(
        'UPDATE payment_verification SET status = ?, reviewed_by = ?, reviewed_at = NOW(), remarks = ? WHERE verification_id = ?',
        [status, reviewerId, remarks || null, verification.verification_id]
    );
};

const reviewVerification = (status) => async (req, res) => {
    const { id } = req.params;
    const { remarks } = req.body;

    try {
        const verification = await getVerification(id);

        if (!verification) {
            return res.status(404).json({ message: 'Verification record not found.' });
        }
        if (verification.status !== 'pending') {
            return res.status(409).json({ message: `This verification was already ${verification.status}.` });
        }

        const result = await withTransaction(async (connection) => {
            if (verification.payment_type === 'registration') {
                return status === 'approved'
                    ? approveRegistration(connection, verification, req.user.user_id, remarks)
                    : rejectRegistration(connection, verification, req.user.user_id, remarks);
            }
            return reviewOther(connection, status, verification, req.user.user_id, remarks);
        });

        res.json({ message: `Verification ${status}.`, ...result });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Username or email is already in use by another account.' });
        }
        if (err.statusCode) {
            return res.status(err.statusCode).json({ message: err.message });
        }
        res.status(500).json({ message: 'Failed to update verification.', error: err.message });
    }
};

// Lets an admin correct what was recorded after the fact — e.g. the slip was
// misread, or the declared amount didn't match what was actually deposited.
// Keeps payment_verification and (if one exists) the linked payments ledger
// row in sync, regardless of the verification's current status.
const editVerification = async (req, res) => {
    const { id } = req.params;
    const { remarks, amount_declared } = req.body;

    const fields = [];
    const values = [];
    if (remarks !== undefined) { fields.push('remarks = ?'); values.push(remarks); }
    if (amount_declared !== undefined) { fields.push('amount_declared = ?'); values.push(amount_declared); }

    if (fields.length === 0) {
        return res.status(400).json({ message: 'Nothing to update.' });
    }

    try {
        await withTransaction(async (connection) => {
            const [result] = await connection.query(
                `UPDATE payment_verification SET ${fields.join(', ')} WHERE verification_id = ?`,
                [...values, id]
            );

            if (result.affectedRows === 0) {
                const err = new Error('Verification record not found.');
                err.statusCode = 404;
                throw err;
            }

            if (amount_declared !== undefined) {
                await connection.query('UPDATE payments SET amount = ? WHERE verification_id = ?', [amount_declared, id]);
            }
        });

        res.json({ message: 'Verification updated.' });
    } catch (err) {
        if (err.statusCode) {
            return res.status(err.statusCode).json({ message: err.message });
        }
        res.status(500).json({ message: 'Failed to update verification.', error: err.message });
    }
};

// Reverses a previous decision back to pending. For an approved registration
// this deletes the account it created (payments row, then the users row,
// which cascades to members/memberships) — a real destructive action, not
// just a status flip, so the database's own FK constraints are the backstop:
// if the member has since done anything else (bookings, etc.) the delete is
// rejected and we surface that as a 409 instead of silently failing.
const undoRegistration = async (connection, verification) => {
    const [[request]] = await connection.query(
        'SELECT * FROM registration_requests WHERE request_id = ?',
        [verification.request_id]
    );

    if (!request) {
        throw new Error('Linked registration request not found.');
    }

    if (verification.status === 'approved') {
        await connection.query('DELETE FROM payments WHERE verification_id = ?', [verification.verification_id]);

        const [[user]] = await connection.query('SELECT user_id FROM users WHERE username = ?', [request.username]);
        if (user) {
            await connection.query('DELETE FROM users WHERE user_id = ?', [user.user_id]);
        }
    }

    await connection.query(
        "UPDATE registration_requests SET status = 'pending', reviewed_by = NULL, reviewed_at = NULL WHERE request_id = ?",
        [request.request_id]
    );
};

const undoVerification = async (req, res) => {
    const { id } = req.params;

    try {
        const verification = await getVerification(id);

        if (!verification) {
            return res.status(404).json({ message: 'Verification record not found.' });
        }
        if (verification.status === 'pending') {
            return res.status(409).json({ message: 'This verification is already pending.' });
        }

        await withTransaction(async (connection) => {
            if (verification.payment_type === 'registration') {
                await undoRegistration(connection, verification);
            }

            await connection.query(
                "UPDATE payment_verification SET status = 'pending', reviewed_by = NULL, remarks = NULL WHERE verification_id = ?",
                [verification.verification_id]
            );
        });

        res.json({ message: 'Decision undone — back to pending.' });
    } catch (err) {
        if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.code === 'ER_ROW_IS_REFERENCED') {
            return res.status(409).json({
                message: "Cannot undo: this member already has other activity recorded (e.g. bookings), so the account can't be removed."
            });
        }
        res.status(500).json({ message: 'Failed to undo verification.', error: err.message });
    }
};

module.exports = {
    getPendingVerifications,
    getVerificationHistory,
    approveVerification: reviewVerification('approved'),
    rejectVerification: reviewVerification('rejected'),
    editVerification,
    undoVerification,
};

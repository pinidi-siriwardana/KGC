const pool = require('../config/db');
const { withTransaction } = pool;
const { createMemberAccount } = require('../utils/memberAccount');

const VERIFICATION_JOIN_QUERY = `
    SELECT pv.*,
           COALESCE(rr.full_name, m.full_name, m2.full_name, c2.full_name, g.full_name) AS full_name,
           COALESCE(rr.email, m.email, m2.email, c2.email, g.email) AS email,
           mt.name AS requested_plan_name
    FROM payment_verification pv
    LEFT JOIN registration_requests rr ON pv.request_id = rr.request_id
    LEFT JOIN bookings b ON pv.booking_id = b.booking_id
    LEFT JOIN members m ON b.member_id = m.member_id
    LEFT JOIN guests g ON b.guest_id = g.guest_id
    LEFT JOIN members m2 ON pv.member_id = m2.member_id
    LEFT JOIN coaches c2 ON pv.coach_id = c2.coach_id
    LEFT JOIN membership_types mt ON pv.membership_type_id = mt.membership_type_id
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
        const err = new Error('Linked registration request not found.');
        err.statusCode = 404;
        throw err;
    }
    if (request.status !== 'pending') {
        const err = new Error('This registration has already been reviewed.');
        err.statusCode = 409;
        throw err;
    }

    const { user_id, member_id } = await createMemberAccount(connection, {
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

    // created_user_id is the stable reference undoRegistration uses to find
    // (and delete, if undone) the account this approval created — set once,
    // here, so a later username change (Access Management) can never cause
    // undo to silently miss it.
    await connection.query(
        "UPDATE registration_requests SET status = 'approved', reviewed_by = ?, reviewed_at = NOW(), created_user_id = ? WHERE request_id = ?",
        [reviewerId, user_id, request.request_id]
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

// Reject-only fallback now — every approvable payment_type has its own named
// handler below (see the dispatch table in reviewVerification), so this only
// ever runs for a rejection, where there's nothing to reverse and just
// recording the decision is correct and complete.
const reviewOther = async (connection, status, verification, reviewerId, remarks) => {
    await connection.query(
        'UPDATE payment_verification SET status = ?, reviewed_by = ?, reviewed_at = NOW(), remarks = ? WHERE verification_id = ?',
        [status, reviewerId, remarks || null, verification.verification_id]
    );
};

// Extends (or starts) a member's membership using the plan they picked when
// submitting the renewal. Starts from today if they have no membership or
// it's already expired, otherwise extends from the current end_date so an
// early renewal doesn't forfeit already-paid-for time.
const approveMembershipRenewal = async (connection, verification, reviewerId, remarks) => {
    if (!verification.member_id) {
        const err = new Error('This verification has no linked member.');
        err.statusCode = 400;
        throw err;
    }

    const [[membershipType]] = await connection.query(
        'SELECT duration_months, price FROM membership_types WHERE membership_type_id = ?',
        [verification.membership_type_id]
    );
    if (!membershipType) {
        const err = new Error('Invalid or missing membership_type_id on this verification.');
        err.statusCode = 400;
        throw err;
    }

    const [[current]] = await connection.query(
        'SELECT end_date FROM memberships WHERE member_id = ? ORDER BY start_date DESC, membership_id DESC LIMIT 1',
        [verification.member_id]
    );
    // CURDATE() rather than Node's `new Date().toISOString()`, which is
    // always UTC — for a club in UTC+5:30 that would compute "today" as
    // still yesterday for the first ~5.5 hours of every real day, and could
    // both misjudge whether the current term has already lapsed and set a
    // brand-new membership's start_date to the wrong calendar day.
    const [[{ today }]] = await connection.query('SELECT CURDATE() AS today');
    const startDate = current && current.end_date > today ? current.end_date : today;

    const [membershipResult] = await connection.query(
        `INSERT INTO memberships (member_id, membership_type_id, purchase_price, start_date, end_date, status)
         VALUES (?, ?, ?, ?, DATE_ADD(?, INTERVAL ? MONTH), 'active')`,
        [verification.member_id, verification.membership_type_id, membershipType.price, startDate, startDate, membershipType.duration_months]
    );

    // membership_id links this payment to the exact membership term it paid
    // for — without it, a later "assign/edit membership" correction can't
    // find this row (syncMembershipPayment looks up by membership_id) and
    // ends up inserting a second, duplicate payment for the same term.
    await connection.query(
        `INSERT INTO payments (amount, payment_type, member_id, membership_id, verification_id, handled_by, status, notes)
         VALUES (?, 'membership', ?, ?, ?, ?, 'completed', ?)`,
        [verification.amount_declared, verification.member_id, membershipResult.insertId, verification.verification_id, reviewerId, verification.note]
    );

    await connection.query(
        "UPDATE payment_verification SET status = 'approved', reviewed_by = ?, reviewed_at = NOW(), remarks = ? WHERE verification_id = ?",
        [reviewerId, remarks || null, verification.verification_id]
    );
};

// Every remaining self-service fee type (donation, tournament fee, and a
// cancellation/no-show/other fee paid without referencing a specific
// outstanding payments row via settles_payment_id) — just logs the payment
// against whichever of member/coach submitted it, no further cascade.
// payment_verification.payment_type and payments.payment_type share these
// five values verbatim, so it's safe to copy straight across.
const approveMemberPayment = async (connection, verification, reviewerId, remarks) => {
    if (!verification.member_id && !verification.coach_id) {
        const err = new Error('This verification has no linked member or coach.');
        err.statusCode = 400;
        throw err;
    }

    await connection.query(
        `INSERT INTO payments (amount, payment_type, member_id, coach_id, verification_id, handled_by, status, notes)
         VALUES (?, ?, ?, ?, ?, ?, 'completed', ?)`,
        [verification.amount_declared, verification.payment_type, verification.member_id, verification.coach_id, verification.verification_id, reviewerId, verification.note]
    );

    await connection.query(
        "UPDATE payment_verification SET status = 'approved', reviewed_by = ?, reviewed_at = NOW(), remarks = ? WHERE verification_id = ?",
        [reviewerId, remarks || null, verification.verification_id]
    );
};

// Settling a specific outstanding fee (e.g. a self-cancellation fee) updates
// that exact payments row in place rather than inserting a new one — the
// obligation already exists, this just marks it collected.
const approveFeeSettlement = async (connection, verification, reviewerId, remarks) => {
    const [[payment]] = await connection.query(
        'SELECT payment_id, status FROM payments WHERE payment_id = ? FOR UPDATE',
        [verification.settles_payment_id]
    );
    if (!payment) {
        const err = new Error('The payment this submission settles no longer exists.');
        err.statusCode = 404;
        throw err;
    }
    if (payment.status !== 'recorded') {
        const err = new Error(`This fee is already ${payment.status}.`);
        err.statusCode = 409;
        throw err;
    }

    await connection.query(
        "UPDATE payments SET status = 'completed', handled_by = ?, verification_id = ? WHERE payment_id = ?",
        [reviewerId, verification.verification_id, payment.payment_id]
    );

    await connection.query(
        "UPDATE payment_verification SET status = 'approved', reviewed_by = ?, reviewed_at = NOW(), remarks = ? WHERE verification_id = ?",
        [reviewerId, remarks || null, verification.verification_id]
    );
};

// Finally wires up the long-dormant 'booking' payment_type: a guest's public
// slot lock (bookings.status='pending') gets confirmed once their receipt is
// approved, with the fee they were quoted becoming the real amount_charged.
const approveGuestBooking = async (connection, verification, reviewerId, remarks) => {
    const [[booking]] = await connection.query('SELECT booking_id, status FROM bookings WHERE booking_id = ? FOR UPDATE', [verification.booking_id]);
    if (!booking) {
        const err = new Error('The booking this submission is for no longer exists.');
        err.statusCode = 404;
        throw err;
    }
    if (booking.status !== 'pending') {
        const err = new Error(`This booking is already ${booking.status}.`);
        err.statusCode = 409;
        throw err;
    }

    await connection.query(
        "UPDATE bookings SET status = 'confirmed', lock_expires_at = NULL, amount_charged = ? WHERE booking_id = ?",
        [verification.amount_declared, booking.booking_id]
    );

    await connection.query(
        `INSERT INTO payments (amount, payment_type, booking_id, verification_id, handled_by, status, notes)
         VALUES (?, 'booking_fee', ?, ?, ?, 'completed', ?)`,
        [verification.amount_declared, booking.booking_id, verification.verification_id, reviewerId, verification.note]
    );

    await connection.query(
        "UPDATE payment_verification SET status = 'approved', reviewed_by = ?, reviewed_at = NOW(), remarks = ? WHERE verification_id = ?",
        [reviewerId, remarks || null, verification.verification_id]
    );
};

// Rejecting frees the slot for the next guest's booking attempt (a fresh
// row — bookings no longer reuses an old booking_id, see
// schemaBootstrap.ensureBookingsSchema). Guarded against the one real
// conflict — a booking that's already 'confirmed' (approved+paid through
// another path) can't be silently rejected out from under a real, settled
// booking; that needs an explicit refund decision instead. A booking that's
// already 'cancelled'/'rejected' (e.g. its 5-minute guest lock expired and
// utils/guestLockSweep.js closed it out before this receipt was reviewed)
// is already a dead end — there's nothing left to protect there, so the
// verification just closes out too, instead of getting permanently stuck
// with no way to leave the pending queue.
const rejectGuestBooking = async (connection, verification, reviewerId, remarks) => {
    const [[booking]] = await connection.query('SELECT booking_id, status FROM bookings WHERE booking_id = ? FOR UPDATE', [verification.booking_id]);
    if (booking && booking.status === 'confirmed') {
        const err = new Error('This booking is already confirmed and paid — cancel the booking directly (and handle any refund) instead of declining this receipt.');
        err.statusCode = 409;
        throw err;
    }
    if (booking && booking.status === 'pending') {
        await connection.query("UPDATE bookings SET status = 'rejected' WHERE booking_id = ?", [verification.booking_id]);
    }
    // else: booking is already cancelled/rejected, or the row is gone
    // entirely — nothing more to do to the booking side, just close the
    // verification.

    await connection.query(
        "UPDATE payment_verification SET status = 'rejected', reviewed_by = ?, reviewed_at = NOW(), remarks = ? WHERE verification_id = ?",
        [reviewerId, remarks || null, verification.verification_id]
    );
};

// The verification row is locked (SELECT ... FOR UPDATE) and its status
// re-checked *inside* the transaction, not before it starts — otherwise two
// concurrent approve/reject requests for the same verification_id (a
// double-click, a retry, two admin tabs) both pass the "is it still
// pending?" check before either commits, and both proceed to grant a
// membership/insert a payment/etc. a second time. Locking the row first
// means the second request blocks until the first transaction commits, then
// correctly sees the now-non-pending status and gets a clean 409 instead of
// silently duplicating the approval.
const reviewVerification = (status) => async (req, res) => {
    const { id } = req.params;
    const { remarks } = req.body;

    try {
        const result = await withTransaction(async (connection) => {
            const [[verification]] = await connection.query(
                'SELECT * FROM payment_verification WHERE verification_id = ? FOR UPDATE',
                [id]
            );

            if (!verification) {
                const err = new Error('Verification record not found.');
                err.statusCode = 404;
                throw err;
            }
            if (verification.status !== 'pending') {
                const err = new Error(`This verification was already ${verification.status}.`);
                err.statusCode = 409;
                throw err;
            }

            if (status === 'approved') {
                // Settlement is orthogonal to payment_type — a submission
                // paying off an existing outstanding fee, checked first.
                if (verification.settles_payment_id) {
                    return approveFeeSettlement(connection, verification, req.user.user_id, remarks);
                }
                if (verification.payment_type === 'registration') {
                    return approveRegistration(connection, verification, req.user.user_id, remarks);
                }
                if (verification.payment_type === 'membership_renewal') {
                    return approveMembershipRenewal(connection, verification, req.user.user_id, remarks);
                }
                if (verification.payment_type === 'booking') {
                    return approveGuestBooking(connection, verification, req.user.user_id, remarks);
                }
                // donation, tournament_fee, cancellation_fee, no_show_fee, other —
                // every payment_type not already special-cased above ends up
                // here, so every approval records a real payments row; nothing
                // silently approves with no money ever hitting the ledger.
                return approveMemberPayment(connection, verification, req.user.user_id, remarks);
            }

            if (verification.payment_type === 'registration') {
                return rejectRegistration(connection, verification, req.user.user_id, remarks);
            }
            if (verification.payment_type === 'booking') {
                return rejectGuestBooking(connection, verification, req.user.user_id, remarks);
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

// Lets an admin correct what was recorded — remarks can be edited any time
// (it's just an admin note). amount_declared can only be edited while still
// pending: once approved, the declared amount has already been copied
// verbatim into a payments row (and, for registration/membership_renewal,
// into a memberships.purchase_price and used to derive its end_date) —
// editing it afterward would desync amount_declared from those already-
// created rows with no way to cascade the correction into them. Undo the
// decision first (back to pending) if the amount genuinely needs fixing.
const editVerification = async (req, res) => {
    const { id } = req.params;
    const { remarks, amount_declared } = req.body;

    try {
        await withTransaction(async (connection) => {
            const [[verification]] = await connection.query(
                'SELECT verification_id, status FROM payment_verification WHERE verification_id = ? FOR UPDATE',
                [id]
            );
            if (!verification) {
                const err = new Error('Verification record not found.');
                err.statusCode = 404;
                throw err;
            }
            if (amount_declared !== undefined && verification.status !== 'pending') {
                const err = new Error('The declared amount can only be edited while this submission is still pending — undo the decision first if it needs correcting.');
                err.statusCode = 409;
                throw err;
            }

            const fields = [];
            const values = [];
            if (remarks !== undefined) { fields.push('remarks = ?'); values.push(remarks); }
            if (amount_declared !== undefined) { fields.push('amount_declared = ?'); values.push(amount_declared); }

            await connection.query(
                `UPDATE payment_verification SET ${fields.join(', ')} WHERE verification_id = ?`,
                [...values, id]
            );

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
//
// Looks the account up via registration_requests.created_user_id (set once,
// at approval time — see approveRegistration) rather than by re-matching
// request.username against users.username: usernames are editable after
// creation (Access Management), so a username-based lookup can silently
// miss the real account, undo-ing the request's status without actually
// removing anything, and reopening the door to a duplicate account if it's
// approved a second time.
const undoRegistration = async (connection, verification) => {
    const [[request]] = await connection.query(
        'SELECT * FROM registration_requests WHERE request_id = ?',
        [verification.request_id]
    );

    if (!request) {
        const err = new Error('Linked registration request not found.');
        err.statusCode = 404;
        throw err;
    }

    if (verification.status === 'approved') {
        await connection.query('DELETE FROM payments WHERE verification_id = ?', [verification.verification_id]);

        if (request.created_user_id) {
            await connection.query('DELETE FROM users WHERE user_id = ?', [request.created_user_id]);
        }
    }

    await connection.query(
        "UPDATE registration_requests SET status = 'pending', reviewed_by = NULL, reviewed_at = NULL, created_user_id = NULL WHERE request_id = ?",
        [request.request_id]
    );
};

// The verification row is locked and re-checked inside the transaction for
// the same reason reviewVerification's approve/reject path is — closes the
// same concurrent-double-action race for undo.
const undoVerification = async (req, res) => {
    const { id } = req.params;

    try {
        await withTransaction(async (connection) => {
            const [[verification]] = await connection.query(
                'SELECT * FROM payment_verification WHERE verification_id = ? FOR UPDATE',
                [id]
            );

            if (!verification) {
                const err = new Error('Verification record not found.');
                err.statusCode = 404;
                throw err;
            }
            if (verification.status === 'pending') {
                const err = new Error('This verification is already pending.');
                err.statusCode = 409;
                throw err;
            }
            // Unlike registration, an approved membership_renewal has no recorded
            // link back to the exact membership/payment rows it created, so there's
            // no safe way to reverse the grant here. Resetting this to 'pending'
            // without reversing it would both leave a stale row that permanently
            // blocks the member's future renewal submissions, and double-grant the
            // membership if re-approved.
            if (verification.payment_type === 'membership_renewal' && verification.status === 'approved') {
                const err = new Error("Cannot undo an approved membership renewal — the granted membership term can't be safely reversed. Adjust the member's membership directly if it needs correcting.");
                err.statusCode = 409;
                throw err;
            }
            // Same reasoning as membership_renewal: an approved 'booking'
            // verification means the booking is already confirmed and its
            // booking_fee payment already completed — there's no automatic
            // reversal that wouldn't also need a real refund decision.
            // Without this guard, undo-then-reject could flip an already
            // paid, confirmed booking straight to 'rejected'.
            if (verification.payment_type === 'booking' && verification.status === 'approved') {
                const err = new Error('Cannot undo an approved booking payment — the booking is already confirmed and paid. Cancel the booking directly (and handle any refund) instead.');
                err.statusCode = 409;
                throw err;
            }

            if (verification.status === 'approved' && verification.settles_payment_id) {
                // approveFeeSettlement only flipped the existing fee's status
                // to 'completed' — revert it to 'recorded' (outstanding)
                // rather than leaving it marked paid while its own receipt
                // goes back to pending review. Without this, re-approving
                // later hits approveFeeSettlement's own guard ("this fee is
                // already completed") and the verification gets stuck with
                // no way forward.
                await connection.query(
                    "UPDATE payments SET status = 'recorded' WHERE verification_id = ? AND status = 'completed'",
                    [verification.verification_id]
                );
            } else if (verification.payment_type === 'registration') {
                await undoRegistration(connection, verification);
            } else if (verification.status === 'approved') {
                // Every other approvable type (membership_renewal and booking
                // are blocked above; everything else funnels through
                // approveMemberPayment) inserted exactly one new payments row
                // for this receipt — delete it so undo is fully reversible
                // and a later re-approval can't create a second, duplicate
                // ledger entry for the same physical receipt.
                await connection.query('DELETE FROM payments WHERE verification_id = ?', [verification.verification_id]);
            }

            await connection.query(
                "UPDATE payment_verification SET status = 'pending', reviewed_by = NULL, reviewed_at = NULL, remarks = NULL WHERE verification_id = ?",
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
        if (err.statusCode) {
            return res.status(err.statusCode).json({ message: err.message });
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

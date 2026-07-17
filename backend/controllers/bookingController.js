const fs = require('fs');
const pool = require('../config/db');
const { withTransaction } = pool;
const { normalizeIfPhone } = require('../validation/common');
const { getCurrentMembership } = require('../utils/membership');

const badRequest = (m) => { const e = new Error(m); e.statusCode = 400; throw e; };
const forbidden = (m) => { const e = new Error(m); e.statusCode = 403; throw e; };
const notFound = (m) => { const e = new Error(m); e.statusCode = 404; throw e; };
const conflict = (m) => { const e = new Error(m); e.statusCode = 409; throw e; };

const todayISO = () => new Date().toISOString().slice(0, 10);

// Same "proper membership" bar MembershipGate/memberPortalController.getMe
// already enforce on the frontend (no membership row, or its end_date has
// passed) — but that's a UI-only gate, so it never stopped a direct API
// call, nor an admin booking on a member's behalf. This is the one place
// both paths funnel through, so it closes the gap for both at once.
const requireActiveMembership = async (member_id, byAdmin) => {
    const membership = await getCurrentMembership(member_id);
    if (!membership || membership.is_expired) {
        forbidden(byAdmin
            ? 'This member does not have an active membership and cannot be booked for.'
            : 'You need an active membership to book a court.');
    }
};

const BOOKING_SELECT = `
    SELECT b.*, c.court_name, c.court_type, ts.slot_name, ts.start_time, ts.end_time,
           COALESCE(m.full_name, co.full_name, g.full_name) AS payer_name
    FROM bookings b
    JOIN courts c ON b.court_id = c.court_id
    JOIN time_slots ts ON b.slot_id = ts.slot_id
    LEFT JOIN members m ON b.member_id = m.member_id
    LEFT JOIN coaches co ON b.coach_id = co.coach_id
    LEFT JOIN guests g ON b.guest_id = g.guest_id
`;

// Bookings link to members/coaches by their own id, not the users.user_id on
// the JWT — self-service actions must resolve that first.
const resolveSelfId = async (conn, role, userId) => {
    const table = role === 'member' ? 'members' : 'coaches';
    const idCol = role === 'member' ? 'member_id' : 'coach_id';
    const [[row]] = await conn.query(`SELECT ${idCol} FROM ${table} WHERE user_id = ?`, [userId]);
    return row ? row[idCol] : null;
};

// Single source of truth for grid occupancy — booked (confirmed) vs locked
// (pending, not yet expired) — consumed identically by the public guest
// widget and every authenticated booking page, so a guest's in-progress lock
// and a member/coach/admin's own bookings can never show conflicting
// pictures of the same slot. Public (no role check): occupancy state alone
// reveals nothing personal.
const getAvailability = async (req, res) => {
    const { date } = req.query;

    try {
        const [rows] = await pool.query(
            `SELECT court_id, slot_id,
                    CASE WHEN status = 'confirmed' THEN 'booked' ELSE 'locked' END AS state
             FROM bookings
             WHERE booking_date = ?
               AND (status = 'confirmed' OR (status = 'pending' AND (lock_expires_at IS NULL OR lock_expires_at > NOW())))`,
            [date]
        );
        res.json({ data: rows });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch availability.', error: err.message });
    }
};

// Public: lets the guest-booking widget check whether a phone/email already
// belongs to a guest, so a returning guest can reuse that record instead of
// a fresh (duplicate) one being created on every single booking.
const lookupGuest = async (req, res) => {
    const { contact } = req.query;
    const normalized = normalizeIfPhone(contact);

    try {
        const [[guest]] = await pool.query(
            'SELECT guest_id, full_name, phone, email FROM guests WHERE is_deleted = 0 AND (phone = ? OR email = ?) LIMIT 1',
            [normalized, normalized]
        );
        res.json({ data: guest || null });
    } catch (err) {
        res.status(500).json({ message: 'Failed to look up guest.', error: err.message });
    }
};

// Public: clicking an open slot holds it for 5 minutes while the guest pays.
const createGuestLock = async (req, res) => {
    const { court_id, slot_id, booking_date, guest_id: existingGuestId, guest_full_name, guest_phone, guest_email } = req.body;

    try {
        const data = await withTransaction(async (connection) => {
            const [[court]] = await connection.query('SELECT status, is_active FROM courts WHERE court_id = ?', [court_id]);
            if (!court) notFound('Court not found.');
            if (!court.is_active || court.status !== 'available') conflict('This court is not available for booking.');

            // Guest bookings are never admin-initiated, so unlike createBooking
            // this check always applies — no exemption to consider. The date
            // itself is already validated at the schema level (createGuestLockSchema);
            // this adds the same-day "has the slot's time fully elapsed"
            // check the schema can't express (it has no access to the
            // current clock in a way that's testable/consistent with
            // MySQL's). Gated on end_time, not start_time — a slot stays
            // bookable for whatever's left of its duration.
            const [[slot]] = await connection.query(
                `SELECT slot_id, (? = CURDATE() AND end_time <= CURTIME()) AS slot_in_past
                 FROM time_slots WHERE slot_id = ?`,
                [booking_date, slot_id]
            );
            if (!slot) notFound('Time slot not found.');
            if (slot.slot_in_past) badRequest('This time slot has already ended and can no longer be booked.');

            let guest_id;
            if (existingGuestId) {
                const [[guest]] = await connection.query('SELECT guest_id FROM guests WHERE guest_id = ? AND is_deleted = 0', [existingGuestId]);
                if (!guest) badRequest('Invalid guest_id.');
                guest_id = guest.guest_id;
            } else {
                const [insertGuest] = await connection.query(
                    'INSERT INTO guests (full_name, phone, email) VALUES (?, ?, ?)',
                    [guest_full_name, guest_phone, guest_email || null]
                );
                guest_id = insertGuest.insertId;
            }

            // Locking read against every row for this slot (any status) —
            // serializes concurrent attempts on the exact same court/date/
            // slot through one row lock, same as before. A pending row only
            // still blocks while its lock hasn't expired.
            const [[existing]] = await connection.query(
                'SELECT booking_id, status, lock_expires_at FROM bookings WHERE court_id = ? AND booking_date = ? AND slot_id = ? FOR UPDATE',
                [court_id, booking_date, slot_id]
            );

            const stillLocked = existing && existing.status === 'pending' &&
                (existing.lock_expires_at === null || new Date(existing.lock_expires_at) > new Date());

            if (existing && (existing.status === 'confirmed' || stillLocked)) {
                conflict('This slot is no longer available.');
            }

            // An expired, never-paid lock is closed out as 'cancelled' before
            // this new lock gets its own row — booking_id is never reused
            // across two distinct guests, so a stale guest's history (or
            // lack thereof) can never end up misattributed to whoever books
            // this slot next. bookings.unique_active_court_slot (a generated
            // column, only non-NULL while pending/confirmed) is what
            // actually enforces "one active booking per slot" now — a
            // cancelled/rejected row simply falls out of that constraint.
            if (existing && existing.status === 'pending') {
                await connection.query("UPDATE bookings SET status = 'cancelled' WHERE booking_id = ?", [existing.booking_id]);
            }

            const [insertResult] = await connection.query(
                `INSERT INTO bookings (court_id, slot_id, booking_date, booking_type, amount_charged, guest_id, status, lock_status, lock_expires_at, created_by_user_id)
                 VALUES (?, ?, ?, 'guest', 0, ?, 'pending', 'unlocked', DATE_ADD(NOW(), INTERVAL 5 MINUTE), NULL)`,
                [court_id, slot_id, booking_date, guest_id]
            );
            const booking_id = insertResult.insertId;

            const [[row]] = await connection.query(
                'SELECT booking_id, lock_expires_at FROM bookings WHERE booking_id = ?',
                [booking_id]
            );
            return row;
        });

        res.status(201).json({ message: 'Slot held for 5 minutes — complete payment to confirm.', data });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'This slot is no longer available.' });
        if (err.statusCode) return res.status(err.statusCode).json({ message: err.message });
        res.status(500).json({ message: 'Failed to hold this slot.', error: err.message });
    }
};

// Public: guest uploads their payment receipt against the booking they just
// locked. Clears lock_expires_at — the slot stays held, now awaiting admin
// review instead of counting down toward payment.
const submitGuestPayment = async (req, res) => {
    const booking_id = req.params.id;
    const { note } = req.body;
    const receiptFile = req.file;

    const fail = (status, message) => {
        if (receiptFile) fs.unlink(receiptFile.path, () => {});
        return res.status(status).json({ message });
    };

    if (!booking_id) return fail(400, 'booking_id is required.');
    if (!receiptFile) return fail(400, 'A payment slip (receipt) is required.');

    try {
        const [[booking]] = await pool.query('SELECT * FROM bookings WHERE booking_id = ?', [booking_id]);
        if (!booking) return fail(404, 'Booking not found.');
        if (booking.status !== 'pending') return fail(409, `This booking is already ${booking.status}.`);
        if (booking.lock_expires_at && new Date(booking.lock_expires_at) <= new Date()) {
            return fail(409, 'This slot hold has expired. Please select a slot again.');
        }

        const [[setting]] = await pool.query("SELECT setting_value FROM club_settings WHERE setting_key = 'guest_booking_fee'");
        const fee = setting ? Number(setting.setting_value) : 0;

        const receipt_file_url = `/uploads/slips/${receiptFile.filename}`;

        const [result] = await pool.query(
            `INSERT INTO payment_verification (booking_id, payment_type, receipt_file_url, amount_declared, note, status)
             VALUES (?, 'booking', ?, ?, ?, 'pending')`,
            [booking_id, receipt_file_url, fee, note || null]
        );

        await pool.query('UPDATE bookings SET lock_expires_at = NULL WHERE booking_id = ?', [booking_id]);

        res.status(201).json({ message: 'Payment submitted for review.', verification_id: result.insertId });
    } catch (err) {
        if (receiptFile) fs.unlink(receiptFile.path, () => {});
        res.status(500).json({ message: 'Failed to submit payment.', error: err.message });
    }
};

const getBookings = async (req, res) => {
    const { date, status, court_id } = req.query;
    const conditions = [];
    const values = [];

    try {
        if (req.user.role === 'member' || req.user.role === 'coach') {
            const selfId = await resolveSelfId(pool, req.user.role, req.user.user_id);
            if (!selfId) return res.json({ data: [] });
            conditions.push(req.user.role === 'member' ? 'b.member_id = ?' : 'b.coach_id = ?');
            values.push(selfId);
        }

        if (date) { conditions.push('b.booking_date = ?'); values.push(date); }
        if (status) { conditions.push('b.status = ?'); values.push(status); }
        if (court_id) { conditions.push('b.court_id = ?'); values.push(court_id); }

        const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
        const [rows] = await pool.query(
            `${BOOKING_SELECT} ${whereClause} ORDER BY b.booking_date DESC, ts.start_time DESC`,
            values
        );
        res.json({ data: rows });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch bookings.', error: err.message });
    }
};

const createBooking = async (req, res) => {
    const { court_id, slot_id, booking_date } = req.body;
    const role = req.user.role;

    try {
        const data = await withTransaction(async (connection) => {
            let booking_type, member_id = null, guest_id = null, coach_id = null, amount_charged = 0;

            if (role === 'member') {
                member_id = await resolveSelfId(connection, 'member', req.user.user_id);
                if (!member_id) notFound('Member profile not found.');
                await requireActiveMembership(member_id, false);
                booking_type = 'member';
            } else if (role === 'coach') {
                coach_id = await resolveSelfId(connection, 'coach', req.user.user_id);
                if (!coach_id) notFound('Coach profile not found.');
                booking_type = 'coach';
            } else {
                booking_type = req.body.booking_type;
                if (!['member', 'coach', 'guest'].includes(booking_type)) {
                    badRequest("booking_type must be 'member', 'coach' or 'guest' when booking as admin.");
                }

                if (booking_type === 'member') {
                    if (!req.body.member_id) badRequest('member_id is required.');
                    const [[m]] = await connection.query('SELECT member_id FROM members WHERE member_id = ?', [req.body.member_id]);
                    if (!m) badRequest('Invalid member_id.');
                    member_id = req.body.member_id;
                    await requireActiveMembership(member_id, true);
                } else if (booking_type === 'coach') {
                    if (!req.body.coach_id) badRequest('coach_id is required.');
                    const [[c]] = await connection.query('SELECT coach_id FROM coaches WHERE coach_id = ?', [req.body.coach_id]);
                    if (!c) badRequest('Invalid coach_id.');
                    coach_id = req.body.coach_id;
                } else {
                    if (req.body.guest_id) {
                        const [[g]] = await connection.query('SELECT guest_id FROM guests WHERE guest_id = ?', [req.body.guest_id]);
                        if (!g) badRequest('Invalid guest_id.');
                        guest_id = req.body.guest_id;
                    } else {
                        const { guest_full_name, guest_phone, guest_email } = req.body;
                        if (!guest_full_name || !guest_phone) {
                            badRequest('guest_id OR guest_full_name and guest_phone are required.');
                        }
                        const [insertGuest] = await connection.query(
                            'INSERT INTO guests (full_name, phone, email) VALUES (?, ?, ?)',
                            [guest_full_name, guest_phone, guest_email || null]
                        );
                        guest_id = insertGuest.insertId;
                    }

                    const numericAmount = Number(req.body.amount_charged);
                    if (!Number.isFinite(numericAmount) || numericAmount < 0) {
                        badRequest('amount_charged must be a non-negative number for a guest booking.');
                    }
                    amount_charged = numericAmount;
                }
            }

            const [[court]] = await connection.query('SELECT status, is_active FROM courts WHERE court_id = ?', [court_id]);
            if (!court) notFound('Court not found.');
            if (!court.is_active || court.status !== 'available') conflict('This court is not available for booking.');

            // date_in_past/slot_in_past are computed against MySQL's own
            // CURDATE()/CURTIME() rather than Node's clock, so this can't
            // drift out of sync with the occupancy checks below (which
            // already rely on MySQL's NOW() for lock expiry) even if the
            // app server and DB aren't in the same timezone.
            const [[slot]] = await connection.query(
                `SELECT slot_id,
                        (? < CURDATE()) AS date_in_past,
                        (? = CURDATE() AND end_time <= CURTIME()) AS slot_in_past
                 FROM time_slots WHERE slot_id = ?`,
                [booking_date, booking_date, slot_id]
            );
            if (!slot) notFound('Time slot not found.');
            // Admins keep their existing exemption from the past-DATE rule
            // (for backfilling/correcting old records) — but the same-day
            // "has this slot's time already fully elapsed" rule applies to
            // everyone uniformly, admin included: a slot stays bookable for
            // its remaining duration (e.g. it's 1:30, the 1-2pm slot still
            // has 30 minutes left) until its end_time, not its start_time.
            if (role !== 'admin' && slot.date_in_past) badRequest('Cannot book a date in the past.');
            if (slot.slot_in_past) badRequest('This time slot has already ended and can no longer be booked.');

            // Locking read: even with no matching row yet, InnoDB takes a gap
            // lock here, so a concurrent request for the same slot blocks
            // until this transaction commits, then correctly sees the row
            // this request just created — genuinely race-safe, not a
            // check-then-act TOCTOU gap.
            const [[existing]] = await connection.query(
                'SELECT booking_id, status, lock_expires_at FROM bookings WHERE court_id = ? AND booking_date = ? AND slot_id = ? FOR UPDATE',
                [court_id, booking_date, slot_id]
            );

            // A pending row only still blocks while its hold hasn't expired —
            // same rule createGuestLock uses, so an abandoned public lock
            // can't wrongly block a member/coach/admin booking attempt.
            const stillOccupied = existing && (existing.status === 'confirmed' ||
                (existing.status === 'pending' && (existing.lock_expires_at === null || new Date(existing.lock_expires_at) > new Date())));

            if (stillOccupied) {
                conflict('This slot is already booked.');
            }

            // An expired, never-paid guest lock is closed out as 'cancelled'
            // before this new booking gets its own row — booking_id is never
            // reused across two distinct bookings (an already-cancelled/
            // rejected row here is left exactly as it is), so payments
            // already recorded (cancellation/no-show/booking fees) can never
            // end up misattributed to whoever books this slot next.
            // bookings.unique_active_court_slot (a generated column, only
            // non-NULL while pending/confirmed) is what actually enforces
            // "one active booking per slot" now.
            if (existing && existing.status === 'pending') {
                await connection.query("UPDATE bookings SET status = 'cancelled' WHERE booking_id = ?", [existing.booking_id]);
            }

            const [insertResult] = await connection.query(
                `INSERT INTO bookings (court_id, slot_id, booking_date, booking_type, amount_charged, member_id, guest_id, coach_id, status, lock_status, created_by_user_id)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', 'unlocked', ?)`,
                [court_id, slot_id, booking_date, booking_type, amount_charged, member_id, guest_id, coach_id, req.user.user_id]
            );
            const booking_id = insertResult.insertId;

            if (booking_type === 'guest' && amount_charged > 0) {
                await connection.query(
                    `INSERT INTO payments (amount, payment_date, payment_type, member_id, coach_id, booking_id, handled_by, status, notes)
                     VALUES (?, NOW(), 'booking_fee', NULL, NULL, ?, ?, 'completed', ?)`,
                    [amount_charged, booking_id, req.user.user_id, req.body.note || null]
                );
            }

            const [[row]] = await connection.query(`${BOOKING_SELECT} WHERE b.booking_id = ?`, [booking_id]);
            return row;
        });

        res.status(201).json({ message: 'Booking confirmed.', data });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'This slot is already booked.' });
        if (err.statusCode) return res.status(err.statusCode).json({ message: err.message });
        res.status(500).json({ message: 'Failed to create booking.', error: err.message });
    }
};

const updateBookingStatus = async (req, res) => {
    const { id } = req.params;
    const { action } = req.body;

    try {
        const result = await withTransaction(async (connection) => {
            const [[booking]] = await connection.query('SELECT * FROM bookings WHERE booking_id = ? FOR UPDATE', [id]);
            if (!booking) notFound('Booking not found.');

            if (req.user.role === 'admin') {
                if (action === 'lock' || action === 'unlock') {
                    await connection.query(
                        'UPDATE bookings SET lock_status = ? WHERE booking_id = ?',
                        [action === 'lock' ? 'locked' : 'unlocked', id]
                    );
                    return null;
                }
                if (action === 'restore') {
                    if (!['cancelled', 'rejected'].includes(booking.status)) {
                        conflict(`This booking is ${booking.status}, not cancelled or rejected.`);
                    }
                    await connection.query("UPDATE bookings SET status = 'confirmed' WHERE booking_id = ?", [id]);

                    // A self-cancellation fee only made sense while the
                    // cancellation stood — restoring the booking means the
                    // fee no longer applies. Only touches a fee still
                    // 'recorded' (unpaid); one already settled/completed is
                    // left alone for the admin to handle manually (a real
                    // refund decision, not an automatic one).
                    const [result] = await connection.query(
                        `UPDATE payments SET status = 'waived', notes = TRIM(CONCAT(COALESCE(notes, ''), ' — waived: booking restored by admin'))
                         WHERE booking_id = ? AND payment_type = 'cancellation_fee' AND status = 'recorded'`,
                        [id]
                    );
                    return { feeWaived: result.affectedRows > 0 };
                }
                if (!['pending', 'confirmed'].includes(booking.status)) {
                    conflict(`This booking is already ${booking.status}.`);
                }
                // Admin-initiated cancel/reject never charges the customer —
                // only a member/coach's own self-cancel does, below.
                await connection.query(
                    'UPDATE bookings SET status = ? WHERE booking_id = ?',
                    [action === 'cancel' ? 'cancelled' : 'rejected', id]
                );
                return null;
            }

            if (action !== 'cancel') forbidden('You can only cancel your own bookings.');

            const selfId = await resolveSelfId(connection, req.user.role, req.user.user_id);
            const ownerField = req.user.role === 'member' ? 'member_id' : 'coach_id';
            if (!selfId || booking[ownerField] !== selfId) forbidden('You can only cancel your own bookings.');
            if (booking.lock_status === 'locked') forbidden('This booking is locked and cannot be self-cancelled.');
            if (booking.booking_date < todayISO()) forbidden('Cannot cancel a past booking.');
            if (!['pending', 'confirmed'].includes(booking.status)) {
                conflict(`This booking is already ${booking.status}.`);
            }

            await connection.query("UPDATE bookings SET status = 'cancelled' WHERE booking_id = ?", [id]);

            const [[setting]] = await connection.query(
                "SELECT setting_value FROM club_settings WHERE setting_key = 'cancellation_fee'"
            );
            const fee = setting ? Number(setting.setting_value) : 0;

            if (fee > 0) {
                await connection.query(
                    `INSERT INTO payments (amount, payment_date, payment_type, member_id, coach_id, booking_id, handled_by, status, notes)
                     VALUES (?, NOW(), 'cancellation_fee', ?, ?, ?, ?, 'recorded', 'Self-cancellation fee')`,
                    [fee, ownerField === 'member_id' ? selfId : null, ownerField === 'coach_id' ? selfId : null, id, req.user.user_id]
                );
            }

            return fee;
        });

        if (action === 'restore') {
            res.json({
                message: result?.feeWaived
                    ? 'Booking restored. Its cancellation fee has been waived.'
                    : 'Booking restored.',
            });
        } else {
            const cancellationFee = typeof result === 'number' ? result : 0;
            res.json({
                message: cancellationFee ? `Booking cancelled. A cancellation fee of LKR ${cancellationFee} has been charged to your account.` : 'Booking updated.',
                cancellation_fee: cancellationFee,
            });
        }
    } catch (err) {
        if (err.statusCode) return res.status(err.statusCode).json({ message: err.message });
        res.status(500).json({ message: 'Failed to update booking.', error: err.message });
    }
};

// Admin-only correction of a booking's recorded fee (e.g. a mistyped amount)
// without cancelling and recreating the whole booking. Keeps the linked
// payments ledger row (booking_fee, for a guest booking) in sync rather than
// leaving the two out of step — same pattern editVerification already uses
// for payment_verification <-> payments.
const updateBookingDetails = async (req, res) => {
    const { id } = req.params;
    const { amount_charged, note } = req.body;

    try {
        await withTransaction(async (connection) => {
            const [result] = await connection.query(
                'UPDATE bookings SET amount_charged = ? WHERE booking_id = ?',
                [amount_charged, id]
            );
            if (result.affectedRows === 0) notFound('Booking not found.');

            await connection.query(
                `UPDATE payments SET amount = ?${note !== undefined ? ', notes = ?' : ''} WHERE booking_id = ? AND payment_type = 'booking_fee'`,
                note !== undefined ? [amount_charged, note || null, id] : [amount_charged, id]
            );
        });

        res.json({ message: 'Booking updated.' });
    } catch (err) {
        if (err.statusCode) return res.status(err.statusCode).json({ message: err.message });
        res.status(500).json({ message: 'Failed to update booking.', error: err.message });
    }
};

module.exports = {
    getAvailability, getBookings, createBooking, updateBookingStatus, updateBookingDetails,
    lookupGuest, createGuestLock, submitGuestPayment,
};

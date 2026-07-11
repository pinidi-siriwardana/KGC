const pool = require('../config/db');
const { withTransaction } = pool;

const badRequest = (m) => { const e = new Error(m); e.statusCode = 400; throw e; };
const forbidden = (m) => { const e = new Error(m); e.statusCode = 403; throw e; };
const notFound = (m) => { const e = new Error(m); e.statusCode = 404; throw e; };
const conflict = (m) => { const e = new Error(m); e.statusCode = 409; throw e; };

const todayISO = () => new Date().toISOString().slice(0, 10);
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

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

const getAvailability = async (req, res) => {
    const { date } = req.query;
    if (!date || !DATE_RE.test(date)) {
        return res.status(400).json({ message: 'date (YYYY-MM-DD) is required.' });
    }

    try {
        const [rows] = await pool.query(
            "SELECT court_id, slot_id FROM bookings WHERE booking_date = ? AND status = 'confirmed'",
            [date]
        );
        res.json({ data: rows });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch availability.', error: err.message });
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

    if (!court_id || !slot_id || !booking_date) {
        return res.status(400).json({ message: 'court_id, slot_id and booking_date are required.' });
    }
    if (!DATE_RE.test(booking_date)) {
        return res.status(400).json({ message: 'booking_date must be YYYY-MM-DD.' });
    }
    if (role !== 'admin' && booking_date < todayISO()) {
        return res.status(400).json({ message: 'Cannot book a date in the past.' });
    }

    try {
        const data = await withTransaction(async (connection) => {
            let booking_type, member_id = null, guest_id = null, coach_id = null, amount_charged = 0;

            if (role === 'member') {
                member_id = await resolveSelfId(connection, 'member', req.user.user_id);
                if (!member_id) notFound('Member profile not found.');
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

            const [[slot]] = await connection.query('SELECT slot_id FROM time_slots WHERE slot_id = ?', [slot_id]);
            if (!slot) notFound('Time slot not found.');

            // Locking read: even with no matching row yet, InnoDB takes a gap
            // lock here, so a concurrent request for the same slot blocks
            // until this transaction commits, then correctly sees the row
            // this request just created — genuinely race-safe, not a
            // check-then-act TOCTOU gap.
            const [[existing]] = await connection.query(
                'SELECT booking_id, status FROM bookings WHERE court_id = ? AND booking_date = ? AND slot_id = ? FOR UPDATE',
                [court_id, booking_date, slot_id]
            );

            let booking_id;
            if (existing) {
                if (['pending', 'confirmed'].includes(existing.status)) {
                    conflict('This slot is already booked.');
                }
                // Existing row is cancelled/rejected — the UNIQUE KEY on
                // (court_id, booking_date, slot_id) has no idea about status,
                // so we reuse this exact row rather than inserting a new one.
                await connection.query(
                    `UPDATE bookings SET booking_type = ?, amount_charged = ?, member_id = ?, guest_id = ?, coach_id = ?,
                            status = 'confirmed', lock_status = 'unlocked', created_by_user_id = ?, created_at = NOW()
                     WHERE booking_id = ?`,
                    [booking_type, amount_charged, member_id, guest_id, coach_id, req.user.user_id, existing.booking_id]
                );
                booking_id = existing.booking_id;
            } else {
                const [insertResult] = await connection.query(
                    `INSERT INTO bookings (court_id, slot_id, booking_date, booking_type, amount_charged, member_id, guest_id, coach_id, status, lock_status, created_by_user_id)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', 'unlocked', ?)`,
                    [court_id, slot_id, booking_date, booking_type, amount_charged, member_id, guest_id, coach_id, req.user.user_id]
                );
                booking_id = insertResult.insertId;
            }

            if (booking_type === 'guest' && amount_charged > 0) {
                await connection.query(
                    `INSERT INTO payments (amount, payment_date, payment_type, member_id, coach_id, booking_id, handled_by, status)
                     VALUES (?, NOW(), 'booking_fee', NULL, NULL, ?, ?, 'completed')`,
                    [amount_charged, booking_id, req.user.user_id]
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

    if (!['cancel', 'reject', 'lock', 'unlock'].includes(action)) {
        return res.status(400).json({ message: "action must be 'cancel', 'reject', 'lock' or 'unlock'." });
    }

    try {
        await withTransaction(async (connection) => {
            const [[booking]] = await connection.query('SELECT * FROM bookings WHERE booking_id = ? FOR UPDATE', [id]);
            if (!booking) notFound('Booking not found.');

            if (req.user.role === 'admin') {
                if (action === 'lock' || action === 'unlock') {
                    await connection.query(
                        'UPDATE bookings SET lock_status = ? WHERE booking_id = ?',
                        [action === 'lock' ? 'locked' : 'unlocked', id]
                    );
                    return;
                }
                if (!['pending', 'confirmed'].includes(booking.status)) {
                    conflict(`This booking is already ${booking.status}.`);
                }
                await connection.query(
                    'UPDATE bookings SET status = ? WHERE booking_id = ?',
                    [action === 'cancel' ? 'cancelled' : 'rejected', id]
                );
                return;
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
        });

        res.json({ message: 'Booking updated.' });
    } catch (err) {
        if (err.statusCode) return res.status(err.statusCode).json({ message: err.message });
        res.status(500).json({ message: 'Failed to update booking.', error: err.message });
    }
};

module.exports = { getAvailability, getBookings, createBooking, updateBookingStatus };

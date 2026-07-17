const pool = require('../config/db');
const { withTransaction } = pool;
const { chargeNoShowFee } = require('../utils/noShowSweep');

const badRequest = (m) => { const e = new Error(m); e.statusCode = 400; throw e; };
const notFound = (m) => { const e = new Error(m); e.statusCode = 404; throw e; };
const conflict = (m) => { const e = new Error(m); e.statusCode = 409; throw e; };

// Bookings/attendance link to members/coaches by their own id, not the
// users.user_id on the JWT — same helper as bookingController.resolveSelfId.
const resolveSelfId = async (conn, role, userId) => {
    const table = role === 'member' ? 'members' : 'coaches';
    const idCol = role === 'member' ? 'member_id' : 'coach_id';
    const [[row]] = await conn.query(`SELECT ${idCol} FROM ${table} WHERE user_id = ?`, [userId]);
    return row ? row[idCol] : null;
};

// A supplied time must parse and can't be in the future — used for every
// manually-entered checkin_time/checkout_time across this file.
const parseNotFuture = (value, label) => {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) badRequest(`${label} is not a valid date/time.`);
    if (parsed > new Date()) badRequest(`${label} cannot be in the future.`);
    return parsed;
};

// Every confirmed member/coach booking for a date, plus whoever's checked in
// against it (booker or admin-added extra attendee) and its no-show payment
// (if any) — drives the admin Daily Attendance table. Guest bookings are
// excluded entirely: attendance has no guest_id column (a guest was never
// checkin-able), so listing them here just cluttered the table with rows
// nobody could ever act on.
const getAttendanceForDate = async (req, res) => {
    const { date } = req.query;

    try {
        const [bookings] = await pool.query(
            `SELECT b.booking_id, b.court_id, b.member_id, b.coach_id, b.booking_type,
                    c.court_name, ts.slot_name, ts.start_time, ts.end_time,
                    COALESCE(m.full_name, co.full_name) AS booker_name,
                    (b.booking_date < CURDATE() OR (b.booking_date = CURDATE() AND ts.end_time <= CURTIME())) AS slot_has_passed,
                    ns.payment_id AS no_show_payment_id, ns.amount AS no_show_amount, ns.status AS no_show_status
             FROM bookings b
             JOIN courts c ON b.court_id = c.court_id
             JOIN time_slots ts ON b.slot_id = ts.slot_id
             LEFT JOIN members m ON b.member_id = m.member_id
             LEFT JOIN coaches co ON b.coach_id = co.coach_id
             LEFT JOIN payments ns ON ns.booking_id = b.booking_id AND ns.payment_type = 'no_show_fee'
             WHERE b.booking_date = ? AND b.status = 'confirmed' AND b.booking_type IN ('member', 'coach')
             ORDER BY ts.start_time`,
            [date]
        );

        if (bookings.length === 0) return res.json({ data: [] });

        const bookingIds = bookings.map((b) => b.booking_id);
        const [attendanceRows] = await pool.query(
            `SELECT a.attendance_id, a.booking_id, a.member_id, a.coach_id, a.checkin_time, a.checkout_time,
                    COALESCE(m.full_name, co.full_name) AS attendee_name
             FROM attendance a
             LEFT JOIN members m ON a.member_id = m.member_id
             LEFT JOIN coaches co ON a.coach_id = co.coach_id
             WHERE a.booking_id IN (?)
             ORDER BY a.checkin_time`,
            [bookingIds]
        );

        const data = bookings.map((b) => ({
            ...b,
            slot_has_passed: !!b.slot_has_passed,
            attendees: attendanceRows.filter((a) => a.booking_id === b.booking_id),
        }));

        res.json({ data });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch attendance.', error: err.message });
    }
};

// Flat, filterable/searchable list of every check-in ever recorded — the
// Daily Attendance table above is deliberately scoped to one date's
// bookings for the check-in/out workflow; this is the "see everything, then
// narrow it down" view for looking back over history.
const getAttendanceHistory = async (req, res) => {
    const { from, to, search, type } = req.query;

    const conditions = [];
    const values = [];

    if (from) { conditions.push('DATE(a.checkin_time) >= ?'); values.push(from); }
    if (to) { conditions.push('DATE(a.checkin_time) <= ?'); values.push(to); }
    if (type === 'member') conditions.push('a.member_id IS NOT NULL');
    if (type === 'coach') conditions.push('a.coach_id IS NOT NULL');
    if (search) {
        conditions.push('COALESCE(m.full_name, co.full_name) LIKE ?');
        values.push(`%${search}%`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    try {
        const [rows] = await pool.query(
            `SELECT a.attendance_id, a.booking_id, a.checkin_time, a.checkout_time,
                    COALESCE(m.full_name, co.full_name) AS attendee_name,
                    CASE WHEN a.member_id IS NOT NULL THEN 'member' ELSE 'coach' END AS attendee_type,
                    b.booking_date, c.court_name, ts.slot_name, ts.start_time, ts.end_time
             FROM attendance a
             LEFT JOIN members m ON a.member_id = m.member_id
             LEFT JOIN coaches co ON a.coach_id = co.coach_id
             LEFT JOIN bookings b ON a.booking_id = b.booking_id
             LEFT JOIN courts c ON b.court_id = c.court_id
             LEFT JOIN time_slots ts ON b.slot_id = ts.slot_id
             ${whereClause}
             ORDER BY a.checkin_time DESC`,
            values
        );

        res.json({ data: rows });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch attendance history.', error: err.message });
    }
};

const checkIn = async (req, res) => {
    const { booking_id, member_id, coach_id, checkin_time } = req.body;

    try {
        const data = await withTransaction(async (connection) => {
            const [[booking]] = await connection.query('SELECT status FROM bookings WHERE booking_id = ? FOR UPDATE', [booking_id]);
            if (!booking) notFound('Booking not found.');
            if (booking.status !== 'confirmed') conflict('Only confirmed bookings can be checked in.');

            const checkinAt = checkin_time !== undefined ? parseNotFuture(checkin_time, 'Check-in time') : new Date();

            if (member_id) {
                const [[m]] = await connection.query('SELECT member_id FROM members WHERE member_id = ?', [member_id]);
                if (!m) badRequest('Invalid member_id.');
            } else {
                const [[c]] = await connection.query('SELECT coach_id FROM coaches WHERE coach_id = ?', [coach_id]);
                if (!c) badRequest('Invalid coach_id.');
            }

            const [[open]] = await connection.query(
                `SELECT attendance_id FROM attendance
                 WHERE booking_id = ? AND checkout_time IS NULL AND ${member_id ? 'member_id = ?' : 'coach_id = ?'}`,
                [booking_id, member_id || coach_id]
            );
            if (open) conflict('This person is already checked in for this session.');

            const [result] = await connection.query(
                'INSERT INTO attendance (booking_id, member_id, coach_id, checkin_time) VALUES (?, ?, ?, ?)',
                [booking_id, member_id || null, coach_id || null, checkinAt]
            );

            const [[row]] = await connection.query(
                `SELECT a.attendance_id, a.booking_id, a.member_id, a.coach_id, a.checkin_time, a.checkout_time,
                        COALESCE(m.full_name, co.full_name) AS attendee_name
                 FROM attendance a
                 LEFT JOIN members m ON a.member_id = m.member_id
                 LEFT JOIN coaches co ON a.coach_id = co.coach_id
                 WHERE a.attendance_id = ?`,
                [result.insertId]
            );
            return row;
        });

        res.status(201).json({ message: 'Checked in.', data });
    } catch (err) {
        if (err.statusCode) return res.status(err.statusCode).json({ message: err.message });
        res.status(500).json({ message: 'Failed to check in.', error: err.message });
    }
};

const checkOut = async (req, res) => {
    const { id } = req.params;
    const { checkout_time } = req.body;

    try {
        const [[row]] = await pool.query('SELECT attendance_id, checkin_time, checkout_time FROM attendance WHERE attendance_id = ?', [id]);
        if (!row) return res.status(404).json({ message: 'Attendance record not found.' });
        if (row.checkout_time) return res.status(409).json({ message: 'This person is already checked out.' });

        const checkoutAt = checkout_time !== undefined ? parseNotFuture(checkout_time, 'Check-out time') : new Date();
        if (checkoutAt < new Date(row.checkin_time)) badRequest('Check-out time cannot be before check-in time.');

        await pool.query('UPDATE attendance SET checkout_time = ? WHERE attendance_id = ?', [checkoutAt, id]);
        res.json({ message: 'Checked out.' });
    } catch (err) {
        if (err.statusCode) return res.status(err.statusCode).json({ message: err.message });
        res.status(500).json({ message: 'Failed to check out.', error: err.message });
    }
};

// Corrects an existing attendance record after the fact (e.g. an admin
// mistyped a manual check-in time, or forgot to check someone out on time).
const updateAttendance = async (req, res) => {
    const { id } = req.params;
    const { checkin_time, checkout_time } = req.body;

    try {
        const [[row]] = await pool.query('SELECT attendance_id, checkin_time, checkout_time FROM attendance WHERE attendance_id = ?', [id]);
        if (!row) return res.status(404).json({ message: 'Attendance record not found.' });

        const newCheckin = checkin_time !== undefined ? parseNotFuture(checkin_time, 'Check-in time') : new Date(row.checkin_time);
        const newCheckout = checkout_time === undefined
            ? (row.checkout_time ? new Date(row.checkout_time) : null)
            : (checkout_time === null ? null : parseNotFuture(checkout_time, 'Check-out time'));

        if (newCheckout && newCheckout < newCheckin) badRequest('Check-out time cannot be before check-in time.');

        const fields = [];
        const values = [];
        if (checkin_time !== undefined) { fields.push('checkin_time = ?'); values.push(newCheckin); }
        if (checkout_time !== undefined) { fields.push('checkout_time = ?'); values.push(newCheckout); }

        await pool.query(`UPDATE attendance SET ${fields.join(', ')} WHERE attendance_id = ?`, [...values, id]);
        res.json({ message: 'Attendance updated.' });
    } catch (err) {
        if (err.statusCode) return res.status(err.statusCode).json({ message: err.message });
        res.status(500).json({ message: 'Failed to update attendance.', error: err.message });
    }
};

// Admin manually flags a confirmed booking with zero attendance as a
// no-show, and either charges the club's no_show_fee or explicitly waives
// it (e.g. an excused absence — `waive: true` in the body). In the normal
// charge case this now happens automatically (see utils/noShowSweep.js, run
// on a timer from server.js) once the booking's time slot passes — this
// button is a manual override for charging it sooner than the next sweep,
// or for waiving it before the sweep ever gets to it.
const markNoShow = async (req, res) => {
    const { booking_id } = req.params;
    const { waive } = req.body;

    try {
        const result = await withTransaction(async (connection) => {
            const [[booking]] = await connection.query(
                `SELECT b.*,
                        (b.booking_date < CURDATE() OR (b.booking_date = CURDATE() AND ts.end_time <= CURTIME())) AS slot_has_passed
                 FROM bookings b JOIN time_slots ts ON b.slot_id = ts.slot_id
                 WHERE b.booking_id = ? FOR UPDATE`,
                [booking_id]
            );
            if (!booking) notFound('Booking not found.');
            if (booking.status !== 'confirmed') conflict('Only confirmed bookings can be marked as a no-show.');
            if (booking.booking_type === 'guest') {
                badRequest('Guest bookings cannot be marked as a no-show — there is no guest account to charge the fee to.');
            }
            if (!booking.slot_has_passed) badRequest('Cannot mark a booking as a no-show before its time slot has ended.');

            const [[attended]] = await connection.query('SELECT attendance_id FROM attendance WHERE booking_id = ?', [booking_id]);
            if (attended) conflict('This booking already has attendance recorded.');

            const [[existingFee]] = await connection.query(
                "SELECT payment_id FROM payments WHERE booking_id = ? AND payment_type = 'no_show_fee'",
                [booking_id]
            );
            if (existingFee) conflict('This booking has already been marked as a no-show.');

            return chargeNoShowFee(connection, booking, req.user.user_id, { waive: !!waive });
        });

        res.json({
            message: result.waived
                ? 'Marked as a no-show. No fee was charged.'
                : (result.feeAmount ? `Marked as a no-show. A fee of LKR ${result.feeAmount} has been charged.` : 'Marked as a no-show.'),
            no_show_fee: result.feeAmount || 0,
            waived: result.waived,
        });
    } catch (err) {
        if (err.statusCode) return res.status(err.statusCode).json({ message: err.message });
        res.status(500).json({ message: 'Failed to mark as a no-show.', error: err.message });
    }
};

// A member/coach's own court-time summary and most frequent playing
// partner — "partner" means whoever most often shares a booking_id with
// them in the attendance table (see plan notes: a booking only has one
// primary booker, so co-attendance is how two people land on the same
// session at all).
const getMyStats = async (req, res) => {
    try {
        const selfId = await resolveSelfId(pool, req.user.role, req.user.user_id);
        const idCol = req.user.role === 'member' ? 'member_id' : 'coach_id';
        if (!selfId) return res.json({ totalDays: 0, totalHours: 0, bestPartner: null });

        const [[totals]] = await pool.query(
            `SELECT COUNT(DISTINCT DATE(checkin_time)) AS totalDays,
                    COALESCE(SUM(TIMESTAMPDIFF(MINUTE, checkin_time, checkout_time)), 0) AS totalMinutes
             FROM attendance WHERE ${idCol} = ? AND checkout_time IS NOT NULL`,
            [selfId]
        );

        const [[bestPartner]] = await pool.query(
            `SELECT COALESCE(m.full_name, co.full_name) AS name, COUNT(*) AS sessions
             FROM attendance a
             JOIN attendance other ON other.booking_id = a.booking_id AND other.attendance_id != a.attendance_id
             LEFT JOIN members m ON other.member_id = m.member_id
             LEFT JOIN coaches co ON other.coach_id = co.coach_id
             WHERE a.${idCol} = ? AND a.booking_id IS NOT NULL
             GROUP BY COALESCE(other.member_id, 0), COALESCE(other.coach_id, 0)
             ORDER BY sessions DESC
             LIMIT 1`,
            [selfId]
        );

        res.json({
            totalDays: totals.totalDays,
            totalHours: Math.round((totals.totalMinutes / 60) * 10) / 10,
            bestPartner: bestPartner || null,
        });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch attendance stats.', error: err.message });
    }
};

module.exports = { getAttendanceForDate, getAttendanceHistory, checkIn, checkOut, updateAttendance, markNoShow, getMyStats };

const pool = require('../config/db');
const { withTransaction } = pool;

const badRequest = (m) => { const e = new Error(m); e.statusCode = 400; throw e; };
const notFound = (m) => { const e = new Error(m); e.statusCode = 404; throw e; };
const conflict = (m) => { const e = new Error(m); e.statusCode = 409; throw e; };

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Bookings/attendance link to members/coaches by their own id, not the
// users.user_id on the JWT — same helper as bookingController.resolveSelfId.
const resolveSelfId = async (conn, role, userId) => {
    const table = role === 'member' ? 'members' : 'coaches';
    const idCol = role === 'member' ? 'member_id' : 'coach_id';
    const [[row]] = await conn.query(`SELECT ${idCol} FROM ${table} WHERE user_id = ?`, [userId]);
    return row ? row[idCol] : null;
};

// Every confirmed booking for a date, plus whoever's checked in against it
// (booker or admin-added extra attendee) and whether a no-show fee already
// exists — drives the admin Daily Attendance table.
const getAttendanceForDate = async (req, res) => {
    const { date } = req.query;
    if (!date || !DATE_RE.test(date)) {
        return res.status(400).json({ message: 'date (YYYY-MM-DD) is required.' });
    }

    try {
        const [bookings] = await pool.query(
            `SELECT b.booking_id, b.court_id, b.member_id, b.coach_id, b.guest_id,
                    c.court_name, ts.slot_name, ts.start_time, ts.end_time,
                    COALESCE(m.full_name, co.full_name, g.full_name) AS booker_name,
                    EXISTS(SELECT 1 FROM payments p WHERE p.booking_id = b.booking_id AND p.payment_type = 'no_show_fee') AS no_show_charged
             FROM bookings b
             JOIN courts c ON b.court_id = c.court_id
             JOIN time_slots ts ON b.slot_id = ts.slot_id
             LEFT JOIN members m ON b.member_id = m.member_id
             LEFT JOIN coaches co ON b.coach_id = co.coach_id
             LEFT JOIN guests g ON b.guest_id = g.guest_id
             WHERE b.booking_date = ? AND b.status = 'confirmed'
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
            no_show_charged: !!b.no_show_charged,
            attendees: attendanceRows.filter((a) => a.booking_id === b.booking_id),
        }));

        res.json({ data });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch attendance.', error: err.message });
    }
};

const checkIn = async (req, res) => {
    const { booking_id, member_id, coach_id } = req.body;

    if (!booking_id) return res.status(400).json({ message: 'booking_id is required.' });
    if ((!member_id && !coach_id) || (member_id && coach_id)) {
        return res.status(400).json({ message: 'Exactly one of member_id or coach_id is required.' });
    }

    try {
        const data = await withTransaction(async (connection) => {
            const [[booking]] = await connection.query('SELECT status FROM bookings WHERE booking_id = ? FOR UPDATE', [booking_id]);
            if (!booking) notFound('Booking not found.');
            if (booking.status !== 'confirmed') conflict('Only confirmed bookings can be checked in.');

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
                'INSERT INTO attendance (booking_id, member_id, coach_id) VALUES (?, ?, ?)',
                [booking_id, member_id || null, coach_id || null]
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

    try {
        const [[row]] = await pool.query('SELECT attendance_id, checkout_time FROM attendance WHERE attendance_id = ?', [id]);
        if (!row) return res.status(404).json({ message: 'Attendance record not found.' });
        if (row.checkout_time) return res.status(409).json({ message: 'This person is already checked out.' });

        await pool.query('UPDATE attendance SET checkout_time = NOW() WHERE attendance_id = ?', [id]);
        res.json({ message: 'Checked out.' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to check out.', error: err.message });
    }
};

// Admin manually flags a confirmed booking with zero attendance as a
// no-show and charges the club's no_show_fee — mirrors the shape of the
// cancellation_fee insert in bookingController.updateBookingStatus.
const markNoShow = async (req, res) => {
    const { booking_id } = req.params;

    try {
        const fee = await withTransaction(async (connection) => {
            const [[booking]] = await connection.query('SELECT * FROM bookings WHERE booking_id = ? FOR UPDATE', [booking_id]);
            if (!booking) notFound('Booking not found.');
            if (booking.status !== 'confirmed') conflict('Only confirmed bookings can be marked as a no-show.');
            if (booking.booking_date > new Date().toISOString().slice(0, 10)) {
                badRequest('Cannot mark a future booking as a no-show.');
            }

            const [[attended]] = await connection.query('SELECT attendance_id FROM attendance WHERE booking_id = ?', [booking_id]);
            if (attended) conflict('This booking already has attendance recorded.');

            const [[existingFee]] = await connection.query(
                "SELECT payment_id FROM payments WHERE booking_id = ? AND payment_type = 'no_show_fee'",
                [booking_id]
            );
            if (existingFee) conflict('A no-show fee has already been charged for this booking.');

            const [[setting]] = await connection.query("SELECT setting_value FROM club_settings WHERE setting_key = 'no_show_fee'");
            const feeAmount = setting ? Number(setting.setting_value) : 0;

            if (feeAmount > 0) {
                await connection.query(
                    `INSERT INTO payments (amount, payment_date, payment_type, member_id, coach_id, booking_id, handled_by, status, notes)
                     VALUES (?, NOW(), 'no_show_fee', ?, ?, ?, ?, 'recorded', 'No-show fee')`,
                    [feeAmount, booking.member_id, booking.coach_id, booking_id, req.user.user_id]
                );
            }

            return feeAmount;
        });

        res.json({
            message: fee ? `Marked as a no-show. A fee of LKR ${fee} has been charged.` : 'Marked as a no-show.',
            no_show_fee: fee || 0,
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

module.exports = { getAttendanceForDate, checkIn, checkOut, markNoShow, getMyStats };

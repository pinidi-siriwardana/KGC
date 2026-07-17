const pool = require('../config/db');
const { withTransaction } = pool;

// Shared by the manual "Mark No-Show" admin action and the automatic sweep
// below — looks up the configurable fee and inserts the payments row,
// mirroring cancellation_fee's shape in bookingController.updateBookingStatus.
// `waive: true` records the no-show as forgiven up front (status 'waived')
// instead of owed ('recorded') — used when an admin explicitly decides not
// to charge someone (e.g. an excused absence). A row is always written in
// that case, even if the configured fee is 0, so the sweep's "already
// processed" check (EXISTS a no_show_fee payment) sees it and never
// re-evaluates that booking again; a routine auto-charge with nothing
// configured to charge still skips the insert, same as before.
const chargeNoShowFee = async (connection, booking, handledBy, { waive = false, notes = 'No-show fee' } = {}) => {
    const [[setting]] = await connection.query("SELECT setting_value FROM club_settings WHERE setting_key = 'no_show_fee'");
    const feeAmount = setting ? Number(setting.setting_value) : 0;

    if (feeAmount > 0 || waive) {
        await connection.query(
            `INSERT INTO payments (amount, payment_date, payment_type, member_id, coach_id, booking_id, handled_by, status, notes)
             VALUES (?, NOW(), 'no_show_fee', ?, ?, ?, ?, ?, ?)`,
            [feeAmount, booking.member_id, booking.coach_id, booking.booking_id, handledBy, waive ? 'waived' : 'recorded', notes]
        );
    }

    return { feeAmount, waived: waive };
};

// Runs periodically (see server.js) so a no-show fee gets charged once a
// booking's time slot has passed with nobody checked in, without an admin
// having to notice and click "Mark No-Show" themselves. Guest bookings are
// excluded on purpose — payments has no guest_id column, so there's no
// account to attribute the charge to.
const runNoShowSweep = async () => {
    try {
        // Auto-charges need a valid handled_by (payments.handled_by is
        // NOT NULL) — attribute them to whichever admin account is oldest/
        // most stable, since no human actually triggered this charge.
        const [[systemAdmin]] = await pool.query(
            "SELECT user_id FROM users WHERE role = 'admin' AND status = 'active' ORDER BY user_id ASC LIMIT 1"
        );
        if (!systemAdmin) return;

        const [eligible] = await pool.query(
            `SELECT b.booking_id
             FROM bookings b
             JOIN time_slots ts ON b.slot_id = ts.slot_id
             WHERE b.status = 'confirmed'
               AND b.booking_type IN ('member', 'coach')
               AND (b.booking_date < CURDATE() OR (b.booking_date = CURDATE() AND ts.end_time <= CURTIME()))
               AND NOT EXISTS (SELECT 1 FROM attendance a WHERE a.booking_id = b.booking_id)
               AND NOT EXISTS (SELECT 1 FROM payments p WHERE p.booking_id = b.booking_id AND p.payment_type = 'no_show_fee')`
        );

        for (const { booking_id } of eligible) {
            try {
                await withTransaction(async (connection) => {
                    const [[booking]] = await connection.query('SELECT * FROM bookings WHERE booking_id = ? FOR UPDATE', [booking_id]);
                    // Re-check under the lock — a late check-in or the manual
                    // "Mark No-Show" button may have resolved this booking
                    // since the query above ran.
                    if (!booking || booking.status !== 'confirmed') return;

                    const [[attended]] = await connection.query('SELECT attendance_id FROM attendance WHERE booking_id = ?', [booking_id]);
                    if (attended) return;

                    const [[existingFee]] = await connection.query(
                        "SELECT payment_id FROM payments WHERE booking_id = ? AND payment_type = 'no_show_fee'",
                        [booking_id]
                    );
                    if (existingFee) return;

                    await chargeNoShowFee(connection, booking, systemAdmin.user_id, { notes: 'No-show fee (auto-charged)' });
                });
            } catch (err) {
                console.error(`No-show sweep failed for booking ${booking_id}:`, err.message);
            }
        }
    } catch (err) {
        console.error('No-show sweep failed:', err.message);
    }
};

module.exports = { chargeNoShowFee, runNoShowSweep };

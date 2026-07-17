const pool = require('../config/db');

// A guest's 5-minute payment window can lapse without them ever submitting
// a receipt. Nothing else revisits that row afterward unless someone else
// happens to book the exact same court/date/slot again (which naturally
// closes it out on the way in — see bookingController's createBooking/
// createGuestLock). This sweep catches everything else: an abandoned lock
// nobody ever retried, which would otherwise sit as a permanently 'pending'
// row forever, cluttering the admin bookings table. A NULL lock_expires_at
// means payment was already submitted and is awaiting admin review — never
// touch those.
const sweepExpiredGuestLocks = async () => {
    try {
        const [result] = await pool.query(
            `UPDATE bookings
             SET status = 'cancelled'
             WHERE status = 'pending' AND booking_type = 'guest'
               AND lock_expires_at IS NOT NULL AND lock_expires_at < NOW()`
        );
        if (result.affectedRows > 0) {
            console.log(`Swept ${result.affectedRows} expired guest lock(s).`);
        }
    } catch (err) {
        console.error('Guest lock sweep failed:', err.message);
    }
};

module.exports = { sweepExpiredGuestLocks };

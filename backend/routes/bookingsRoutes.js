const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const {
    getAvailability, getBookings, createBooking, updateBookingStatus,
    createGuestLock, submitGuestPayment,
} = require('../controllers/bookingController');
const { uploadReceipt } = require('../middleware/upload');

// Public: the single occupancy endpoint used by every booking grid (guest,
// member, coach, admin alike), and the guest-booking widget on /courts — no
// account needed for either.
router.get('/availability', getAvailability);
router.post('/guest-lock', createGuestLock);
router.post('/guest-lock/:id/pay', uploadReceipt.single('receipt'), submitGuestPayment);

router.use(verifyToken, requireRole('admin', 'member', 'coach'));

router.get('/', getBookings);
router.post('/', createBooking);
router.patch('/:id', updateBookingStatus);

module.exports = router;

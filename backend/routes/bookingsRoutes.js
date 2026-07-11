const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const { getAvailability, getBookings, createBooking, updateBookingStatus } = require('../controllers/bookingController');

router.use(verifyToken, requireRole('admin', 'member', 'coach'));

router.get('/availability', getAvailability);
router.get('/', getBookings);
router.post('/', createBooking);
router.patch('/:id', updateBookingStatus);

module.exports = router;

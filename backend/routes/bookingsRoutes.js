const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const {
    getAvailability, getBookings, createBooking, updateBookingStatus, updateBookingDetails,
    lookupGuest, createGuestLock, submitGuestPayment,
} = require('../controllers/bookingController');
const { uploadReceipt, singleUpload } = require('../middleware/upload');
const { validate } = require('../middleware/validate');
const { idParam } = require('../validation/common');
const {
    availabilityQuerySchema, getBookingsQuerySchema, lookupGuestQuerySchema, createGuestLockSchema,
    createBookingSchema, updateBookingStatusSchema, updateBookingDetailsSchema,
} = require('../validation/bookingSchemas');

// Public: the single occupancy endpoint used by every booking grid (guest,
// member, coach, admin alike), and the guest-booking widget on /courts — no
// account needed for either.
router.get('/availability', validate(availabilityQuerySchema, 'query'), getAvailability);
router.get('/guest-lookup', validate(lookupGuestQuerySchema, 'query'), lookupGuest);
router.post('/guest-lock', validate(createGuestLockSchema), createGuestLock);
// validate() runs AFTER upload — multer hasn't parsed req.body yet before that.
router.post('/guest-lock/:id/pay', validate(idParam(), 'params'), singleUpload(uploadReceipt, 'receipt'), submitGuestPayment);

router.use(verifyToken, requireRole('admin', 'member', 'coach'));

router.get('/', validate(getBookingsQuerySchema, 'query'), getBookings);
router.post('/', validate(createBookingSchema), createBooking);
router.patch('/:id', validate(idParam(), 'params'), validate(updateBookingStatusSchema), updateBookingStatus);
router.patch('/:id/details', requireRole('admin'), validate(idParam(), 'params'), validate(updateBookingDetailsSchema), updateBookingDetails);

module.exports = router;

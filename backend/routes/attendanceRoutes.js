const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const { getAttendanceForDate, checkIn, checkOut, markNoShow, getMyStats } = require('../controllers/attendanceController');
const { validate } = require('../middleware/validate');
const { idParam } = require('../validation/common');
const { getAttendanceQuerySchema, checkInSchema } = require('../validation/attendanceSchemas');

router.use(verifyToken);

router.get('/my-stats', requireRole('member', 'coach'), getMyStats);
router.get('/', requireRole('admin'), validate(getAttendanceQuerySchema, 'query'), getAttendanceForDate);
router.post('/checkin', requireRole('admin'), validate(checkInSchema), checkIn);
router.patch('/:id/checkout', requireRole('admin'), validate(idParam(), 'params'), checkOut);
router.post('/:booking_id/no-show', requireRole('admin'), validate(idParam('booking_id'), 'params'), markNoShow);

module.exports = router;

const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const { getAttendanceForDate, checkIn, checkOut, markNoShow, getMyStats } = require('../controllers/attendanceController');

router.use(verifyToken);

router.get('/my-stats', requireRole('member', 'coach'), getMyStats);
router.get('/', requireRole('admin'), getAttendanceForDate);
router.post('/checkin', requireRole('admin'), checkIn);
router.patch('/:id/checkout', requireRole('admin'), checkOut);
router.post('/:booking_id/no-show', requireRole('admin'), markNoShow);

module.exports = router;

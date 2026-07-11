const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const { getAllCourts, updateCourtStatus } = require('../controllers/courtController');

// Any authenticated role: lets member/coach/admin booking pages list bookable courts.
router.get('/', verifyToken, getAllCourts);

router.use(verifyToken, requireRole('admin'));

router.get('/all', getAllCourts);
router.put('/status/:id', updateCourtStatus);

module.exports = router;

const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const { getAllCourts, updateCourtStatus } = require('../controllers/courtController');

// Public: lets the public guest-booking page and any authenticated role list bookable courts.
router.get('/', getAllCourts);

router.use(verifyToken, requireRole('admin'));

router.get('/all', getAllCourts);
router.put('/status/:id', updateCourtStatus);

module.exports = router;

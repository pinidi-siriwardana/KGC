const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const { getAllCourts, updateCourtStatus } = require('../controllers/courtController');

router.use(verifyToken, requireRole('admin'));

router.get('/all', getAllCourts);
router.put('/status/:id', updateCourtStatus);

module.exports = router;

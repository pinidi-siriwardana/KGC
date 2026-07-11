const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { getAllTimeSlots } = require('../controllers/timeSlotController');

router.use(verifyToken);

router.get('/', getAllTimeSlots);

module.exports = router;

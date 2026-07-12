const express = require('express');
const router = express.Router();
const { getAllTimeSlots } = require('../controllers/timeSlotController');

// Public: lets the public guest-booking page and any authenticated role list time slots.
router.get('/', getAllTimeSlots);

module.exports = router;

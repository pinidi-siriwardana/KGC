const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { getTodayWeather } = require('../controllers/weatherController');

// Any logged-in role (admin/member/coach) can check today's play conditions
// — no reason to restrict by role, so just verifyToken, no requireRole.
router.get('/today', verifyToken, getTodayWeather);

module.exports = router;

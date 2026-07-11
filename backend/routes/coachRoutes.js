const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const { getMe } = require('../controllers/coachPortalController');

router.use(verifyToken, requireRole('coach'));

router.get('/me', getMe);

module.exports = router;

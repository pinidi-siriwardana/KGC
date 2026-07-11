const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const { getMe } = require('../controllers/memberPortalController');

router.use(verifyToken, requireRole('member'));

router.get('/me', getMe);

module.exports = router;

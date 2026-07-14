const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const { getDashboardOverview } = require('../controllers/adminDashboardController');

router.use(verifyToken, requireRole('admin'));

router.get('/dashboard', getDashboardOverview);

module.exports = router;

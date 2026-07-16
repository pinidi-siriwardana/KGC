const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const { getDashboardOverview } = require('../controllers/adminDashboardController');
const { getMe, updateMe } = require('../controllers/adminPortalController');
const { validate } = require('../middleware/validate');
const { updateAdminProfileSchema } = require('../validation/profileSchemas');

router.use(verifyToken, requireRole('admin'));

router.get('/dashboard', getDashboardOverview);
router.get('/me', getMe);
router.patch('/me', validate(updateAdminProfileSchema), updateMe);

module.exports = router;

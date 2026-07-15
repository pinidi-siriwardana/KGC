const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const { getSettings, updateSettings } = require('../controllers/settingsController');
const { validate } = require('../middleware/validate');
const { updateSettingsSchema } = require('../validation/settingsSchemas');

// Public: the guest booking flow (no login) needs bank/fee details to render
// its payment step — same reasoning as membership-types and courts being public.
router.get('/', getSettings);
router.patch('/', verifyToken, requireRole('admin'), validate(updateSettingsSchema), updateSettings);

module.exports = router;

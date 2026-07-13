const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const { getSettings, updateSettings } = require('../controllers/settingsController');
const { validate } = require('../middleware/validate');
const { updateSettingsSchema } = require('../validation/settingsSchemas');

router.use(verifyToken);

router.get('/', getSettings);
router.patch('/', requireRole('admin'), validate(updateSettingsSchema), updateSettings);

module.exports = router;

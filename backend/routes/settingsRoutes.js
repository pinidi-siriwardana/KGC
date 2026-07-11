const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const { getSettings, updateSettings } = require('../controllers/settingsController');

router.use(verifyToken);

router.get('/', getSettings);
router.patch('/', requireRole('admin'), updateSettings);

module.exports = router;

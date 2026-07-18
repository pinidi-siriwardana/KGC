const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const { getStaff, createStaff, updateStaff } = require('../controllers/staffController');
const { validate } = require('../middleware/validate');
const { idParam } = require('../validation/common');
const { createStaffSchema, updateStaffSchema } = require('../validation/staffSchemas');

router.use(verifyToken, requireRole('admin'));

router.get('/', getStaff);
router.post('/', validate(createStaffSchema), createStaff);
router.put('/:id', validate(idParam(), 'params'), validate(updateStaffSchema), updateStaff);

module.exports = router;

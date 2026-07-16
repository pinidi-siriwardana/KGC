const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const { getStaff, createStaff, updateStaff, deleteStaff, restoreStaff } = require('../controllers/staffController');
const { validate } = require('../middleware/validate');
const { idParam } = require('../validation/common');
const { createStaffSchema, updateStaffSchema } = require('../validation/staffSchemas');

router.use(verifyToken, requireRole('admin'));

router.get('/', getStaff);
router.post('/', validate(createStaffSchema), createStaff);
router.put('/:id', validate(idParam(), 'params'), validate(updateStaffSchema), updateStaff);
router.delete('/:id', validate(idParam(), 'params'), deleteStaff);
router.patch('/:id/restore', validate(idParam(), 'params'), restoreStaff);

module.exports = router;

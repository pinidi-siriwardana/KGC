const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const {
    getMembershipTypes,
    createMembershipType,
    updateMembershipType,
    deleteMembershipType,
} = require('../controllers/membershipTypeController');
const { validate } = require('../middleware/validate');
const { idParam } = require('../validation/common');
const { createMembershipTypeSchema, updateMembershipTypeSchema } = require('../validation/membershipTypeSchemas');

// Public: needed on the registration form before the applicant has an account.
router.get('/', getMembershipTypes);

// Everything else is admin-only plan management.
router.use(verifyToken, requireRole('admin'));
router.post('/', validate(createMembershipTypeSchema), createMembershipType);
router.put('/:id', validate(idParam(), 'params'), validate(updateMembershipTypeSchema), updateMembershipType);
router.delete('/:id', validate(idParam(), 'params'), deleteMembershipType);

module.exports = router;

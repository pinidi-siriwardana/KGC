const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const {
    getMembershipTypes,
    createMembershipType,
    updateMembershipType,
    deleteMembershipType,
} = require('../controllers/membershipTypeController');

// Public: needed on the registration form before the applicant has an account.
router.get('/', getMembershipTypes);

// Everything else is admin-only plan management.
router.use(verifyToken, requireRole('admin'));
router.post('/', createMembershipType);
router.put('/:id', updateMembershipType);
router.delete('/:id', deleteMembershipType);

module.exports = router;

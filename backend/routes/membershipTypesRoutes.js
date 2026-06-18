const express = require('express');
const router = express.Router();
const { getMembershipTypes } = require('../controllers/membershipTypeController');

// Public: needed on the registration form before the applicant has an account.
router.get('/', getMembershipTypes);

module.exports = router;

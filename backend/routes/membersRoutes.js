const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const { getMembers, createMember, updateMember, deleteMember } = require('../controllers/memberController');
const { validate } = require('../middleware/validate');
const { idParam } = require('../validation/common');
const { createMemberSchema, updateMemberSchema } = require('../validation/memberSchemas');

router.use(verifyToken, requireRole('admin'));

router.get('/', getMembers);
router.post('/add', validate(createMemberSchema), createMember);
router.put('/update/:id', validate(idParam(), 'params'), validate(updateMemberSchema), updateMember);
router.delete('/delete/:id', validate(idParam(), 'params'), deleteMember);

module.exports = router;

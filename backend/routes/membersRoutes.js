const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const { getMembers, createMember, updateMember, deleteMember } = require('../controllers/memberController');

router.use(verifyToken, requireRole('admin'));

router.get('/', getMembers);
router.post('/add', createMember);
router.put('/update/:id', updateMember);
router.delete('/delete/:id', deleteMember);

module.exports = router;

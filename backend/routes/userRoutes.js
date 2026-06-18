const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const { getUsers, createUser, updateUser, deleteUser } = require('../controllers/userController');

router.use(verifyToken, requireRole('admin'));

router.get('/', getUsers);
router.post('/add', createUser);
router.put('/update/:id', updateUser);
router.delete('/delete/:id', deleteUser);

module.exports = router;

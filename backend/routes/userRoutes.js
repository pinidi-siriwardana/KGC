const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const { getUsers, createUser, updateUser, deleteUser } = require('../controllers/userController');
const { validate } = require('../middleware/validate');
const { idParam } = require('../validation/common');
const { createUserSchema, updateUserSchema } = require('../validation/userSchemas');

router.use(verifyToken, requireRole('admin'));

router.get('/', getUsers);
router.post('/add', validate(createUserSchema), createUser);
router.put('/update/:id', validate(idParam(), 'params'), validate(updateUserSchema), updateUser);
router.delete('/delete/:id', validate(idParam(), 'params'), deleteUser);

module.exports = router;

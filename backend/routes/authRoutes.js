const express = require('express');
const router = express.Router();
const { register, login, me } = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');
const { uploadReceipt, singleUpload } = require('../middleware/upload');
const { validate } = require('../middleware/validate');
const { registerSchema, loginSchema } = require('../validation/authSchemas');

// validate() runs AFTER the upload middleware — multer hasn't parsed
// req.body yet until it finishes.
router.post('/register', singleUpload(uploadReceipt, 'receipt'), validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.get('/me', verifyToken, me);

module.exports = router;

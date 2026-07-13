const express = require('express');
const router = express.Router();
const { register, login, me } = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');
const { uploadReceipt } = require('../middleware/upload');
const { validate } = require('../middleware/validate');
const { registerSchema, loginSchema } = require('../validation/authSchemas');

// multer reports bad uploads (wrong type, too large) via an error callback
// rather than throwing, so it needs to be handled here instead of relying
// on a generic Express error page.
const handleReceiptUpload = (req, res, next) => {
    uploadReceipt.single('receipt')(req, res, (err) => {
        if (err) return res.status(400).json({ message: err.message });
        next();
    });
};

// validate() runs AFTER the upload middleware — multer hasn't parsed
// req.body yet until it finishes.
router.post('/register', handleReceiptUpload, validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.get('/me', verifyToken, me);

module.exports = router;

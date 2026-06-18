const express = require('express');
const router = express.Router();
const { register, login, me } = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');
const { uploadReceipt } = require('../middleware/upload');

// multer reports bad uploads (wrong type, too large) via an error callback
// rather than throwing, so it needs to be handled here instead of relying
// on a generic Express error page.
const handleReceiptUpload = (req, res, next) => {
    uploadReceipt.single('receipt')(req, res, (err) => {
        if (err) return res.status(400).json({ message: err.message });
        next();
    });
};

router.post('/register', handleReceiptUpload, register);
router.post('/login', login);
router.get('/me', verifyToken, me);

module.exports = router;

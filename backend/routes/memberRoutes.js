const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken, requireRole('member'));

router.get('/dashboard', (req, res) => {
    res.json({ message: `Welcome, ${req.user.username}.` });
});

module.exports = router;

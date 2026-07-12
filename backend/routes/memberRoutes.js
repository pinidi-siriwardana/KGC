const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const { getMe } = require('../controllers/memberPortalController');
const { getMyPayments, submitPayment, payOutstandingFee } = require('../controllers/memberPaymentController');
const { uploadReceipt } = require('../middleware/upload');

router.use(verifyToken, requireRole('member'));

router.get('/me', getMe);
router.get('/payments', getMyPayments);
router.post('/payments', uploadReceipt.single('receipt'), submitPayment);
router.post('/payments/:paymentId/pay', uploadReceipt.single('receipt'), payOutstandingFee);

module.exports = router;

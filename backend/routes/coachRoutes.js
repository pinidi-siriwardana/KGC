const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const { getMe } = require('../controllers/coachPortalController');
const { getMyPayments, submitPayment, payOutstandingFee, getDuesSummary } = require('../controllers/coachPaymentController');
const { uploadReceipt } = require('../middleware/upload');

router.use(verifyToken, requireRole('coach'));

router.get('/me', getMe);
router.get('/payments/dues-summary', getDuesSummary);
router.get('/payments', getMyPayments);
router.post('/payments', uploadReceipt.single('receipt'), submitPayment);
router.post('/payments/:paymentId/pay', uploadReceipt.single('receipt'), payOutstandingFee);

module.exports = router;

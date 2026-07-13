const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const { getMe } = require('../controllers/memberPortalController');
const { getMyPayments, submitPayment, payOutstandingFee, getDuesSummary } = require('../controllers/memberPaymentController');
const { uploadReceipt } = require('../middleware/upload');
const { validate } = require('../middleware/validate');
const { idParam } = require('../validation/common');
const { submitPaymentSchema, payOutstandingFeeSchema } = require('../validation/memberPaymentSchemas');

router.use(verifyToken, requireRole('member'));

router.get('/me', getMe);
router.get('/payments/dues-summary', getDuesSummary);
router.get('/payments', getMyPayments);
// validate() runs AFTER upload — multer hasn't parsed req.body yet before that.
router.post('/payments', uploadReceipt.single('receipt'), validate(submitPaymentSchema), submitPayment);
router.post('/payments/:paymentId/pay', validate(idParam('paymentId'), 'params'), uploadReceipt.single('receipt'), validate(payOutstandingFeeSchema), payOutstandingFee);

module.exports = router;

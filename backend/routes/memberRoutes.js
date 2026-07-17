const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const { getMe, updateMe } = require('../controllers/memberPortalController');
const { getMyPayments, submitPayment, payOutstandingFee, getDuesSummary } = require('../controllers/memberPaymentController');
const { uploadReceipt, singleUpload } = require('../middleware/upload');
const { validate } = require('../middleware/validate');
const { idParam } = require('../validation/common');
const { submitPaymentSchema, payOutstandingFeeSchema } = require('../validation/memberPaymentSchemas');
const { updateProfileSchema } = require('../validation/profileSchemas');

router.use(verifyToken, requireRole('member'));

router.get('/me', getMe);
router.patch('/me', validate(updateProfileSchema), updateMe);
router.get('/payments/dues-summary', getDuesSummary);
router.get('/payments', getMyPayments);
// validate() runs AFTER upload — multer hasn't parsed req.body yet before that.
router.post('/payments', singleUpload(uploadReceipt, 'receipt'), validate(submitPaymentSchema), submitPayment);
router.post('/payments/:paymentId/pay', validate(idParam('paymentId'), 'params'), singleUpload(uploadReceipt, 'receipt'), validate(payOutstandingFeeSchema), payOutstandingFee);

module.exports = router;

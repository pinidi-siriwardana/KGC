const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const {
    getPendingVerifications,
    getVerificationHistory,
    approveVerification,
    rejectVerification,
    editVerification,
    undoVerification,
} = require('../controllers/paymentVerificationController');
const { getPayments, updatePayment, getOutstandingDues } = require('../controllers/paymentLedgerController');
const { createManualPayment } = require('../controllers/manualPaymentController');
const { validate } = require('../middleware/validate');
const { idParam } = require('../validation/common');
const {
    getPaymentsQuerySchema, createManualPaymentSchema, updatePaymentSchema,
    editVerificationSchema, reviewVerificationSchema,
} = require('../validation/paymentSchemas');

router.use(verifyToken, requireRole('admin'));

router.get('/', validate(getPaymentsQuerySchema, 'query'), getPayments);
router.get('/outstanding', getOutstandingDues);
router.post('/manual', validate(createManualPaymentSchema), createManualPayment);
router.patch('/update/:id', validate(idParam(), 'params'), validate(updatePaymentSchema), updatePayment);
router.get('/pending', getPendingVerifications);
router.get('/history', getVerificationHistory);
router.patch('/approve/:id', validate(idParam(), 'params'), validate(reviewVerificationSchema), approveVerification);
router.patch('/reject/:id', validate(idParam(), 'params'), validate(reviewVerificationSchema), rejectVerification);
router.patch('/edit/:id', validate(idParam(), 'params'), validate(editVerificationSchema), editVerification);
router.patch('/undo/:id', validate(idParam(), 'params'), undoVerification);

module.exports = router;

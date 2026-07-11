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
const { getPayments, updatePayment } = require('../controllers/paymentLedgerController');
const { createManualPayment } = require('../controllers/manualPaymentController');

router.use(verifyToken, requireRole('admin'));

router.get('/', getPayments);
router.post('/manual', createManualPayment);
router.patch('/update/:id', updatePayment);
router.get('/pending', getPendingVerifications);
router.get('/history', getVerificationHistory);
router.patch('/approve/:id', approveVerification);
router.patch('/reject/:id', rejectVerification);
router.patch('/edit/:id', editVerification);
router.patch('/undo/:id', undoVerification);

module.exports = router;

const router = require('express').Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const {
    submitInquiry,
    getInquiries,
    getInquiry,
    replyToInquiry,
    deleteInquiry,
} = require('../controllers/inquiryController');

// Public - anyone can submit
router.post('/', submitInquiry);

// Admin only
router.get('/',      verifyToken, requireRole('admin'), getInquiries);
router.get('/:id',   verifyToken, requireRole('admin'), getInquiry);
router.post('/:id/reply',  verifyToken, requireRole('admin'), replyToInquiry);
router.delete('/:id', verifyToken, requireRole('admin'), deleteInquiry);

module.exports = router;

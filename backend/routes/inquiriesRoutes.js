const router = require('express').Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const {
    submitInquiry,
    getInquiries,
    getInquiry,
    replyToInquiry,
    deleteInquiry,
} = require('../controllers/inquiryController');
const { validate } = require('../middleware/validate');
const { idParam } = require('../validation/common');
const { submitInquirySchema, replyToInquirySchema } = require('../validation/inquirySchemas');

// Public - anyone can submit
router.post('/', validate(submitInquirySchema), submitInquiry);

// Admin only
router.get('/',      verifyToken, requireRole('admin'), getInquiries);
router.get('/:id',   verifyToken, requireRole('admin'), validate(idParam(), 'params'), getInquiry);
router.post('/:id/reply',  verifyToken, requireRole('admin'), validate(idParam(), 'params'), validate(replyToInquirySchema), replyToInquiry);
router.delete('/:id', verifyToken, requireRole('admin'), validate(idParam(), 'params'), deleteInquiry);

module.exports = router;

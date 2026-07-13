const router = require('express').Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const {
    getAnnouncements,
    getAllAnnouncements,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
} = require('../controllers/announcementController');
const { validate } = require('../middleware/validate');
const { idParam } = require('../validation/common');
const { createAnnouncementSchema, updateAnnouncementSchema } = require('../validation/announcementSchemas');

// Public — only live announcements
router.get('/', getAnnouncements);

// Admin only
router.get('/admin/all', verifyToken, requireRole('admin'), getAllAnnouncements);
router.post('/',          verifyToken, requireRole('admin'), validate(createAnnouncementSchema), createAnnouncement);
router.put('/:id',        verifyToken, requireRole('admin'), validate(idParam(), 'params'), validate(updateAnnouncementSchema), updateAnnouncement);
router.delete('/:id',     verifyToken, requireRole('admin'), validate(idParam(), 'params'), deleteAnnouncement);

module.exports = router;

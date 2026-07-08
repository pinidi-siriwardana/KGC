const router = require('express').Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const {
    getAnnouncements,
    getAllAnnouncements,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
} = require('../controllers/announcementController');

// Public — only live announcements
router.get('/', getAnnouncements);

// Admin only
router.get('/admin/all', verifyToken, requireRole('admin'), getAllAnnouncements);
router.post('/',          verifyToken, requireRole('admin'), createAnnouncement);
router.put('/:id',        verifyToken, requireRole('admin'), updateAnnouncement);
router.delete('/:id',     verifyToken, requireRole('admin'), deleteAnnouncement);

module.exports = router;

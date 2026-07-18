const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const { getAllCourts, updateCourtPhoto } = require('../controllers/courtController');
const { uploadCourtPhoto, singleUpload } = require('../middleware/upload');
const { validate } = require('../middleware/validate');
const { idParam } = require('../validation/common');

// Public: lets the public guest-booking page, the public court gallery, and
// any authenticated role list bookable courts (including their photo_url).
router.get('/', getAllCourts);

router.use(verifyToken, requireRole('admin'));

router.get('/all', getAllCourts);
router.post('/:id/photo', validate(idParam(), 'params'), singleUpload(uploadCourtPhoto, 'photo'), updateCourtPhoto);

module.exports = router;

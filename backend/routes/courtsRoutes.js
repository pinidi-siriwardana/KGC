const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const { getAllCourts, updateCourtStatus, updateCourtPhoto } = require('../controllers/courtController');
const { uploadCourtPhoto } = require('../middleware/upload');
const { validate } = require('../middleware/validate');
const { idParam } = require('../validation/common');
const { updateCourtStatusSchema } = require('../validation/courtSchemas');

// Public: lets the public guest-booking page, the public court gallery, and
// any authenticated role list bookable courts (including their photo_url).
router.get('/', getAllCourts);

router.use(verifyToken, requireRole('admin'));

router.get('/all', getAllCourts);
router.put('/status/:id', validate(idParam(), 'params'), validate(updateCourtStatusSchema), updateCourtStatus);
router.post('/:id/photo', validate(idParam(), 'params'), uploadCourtPhoto.single('photo'), updateCourtPhoto);

module.exports = router;

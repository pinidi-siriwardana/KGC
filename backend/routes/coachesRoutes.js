const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const { getCoaches, getPublicCoaches, createCoach, updateCoach, updateCoachPhoto } = require('../controllers/coachController');
const { uploadCoachPhoto, singleUpload } = require('../middleware/upload');
const { validate } = require('../middleware/validate');
const { idParam } = require('../validation/common');
const { createCoachSchema, updateCoachSchema } = require('../validation/coachSchemas');

// Public: the home page's coach section reads this — no account needed.
router.get('/public', getPublicCoaches);

router.use(verifyToken, requireRole('admin'));

router.get('/', getCoaches);
router.post('/add', validate(createCoachSchema), createCoach);
router.put('/update/:id', validate(idParam(), 'params'), validate(updateCoachSchema), updateCoach);
router.post('/:id/photo', validate(idParam(), 'params'), singleUpload(uploadCoachPhoto, 'photo'), updateCoachPhoto);

module.exports = router;

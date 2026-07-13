const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const { getCoaches, createCoach, updateCoach, deleteCoach } = require('../controllers/coachController');
const { validate } = require('../middleware/validate');
const { idParam } = require('../validation/common');
const { createCoachSchema, updateCoachSchema } = require('../validation/coachSchemas');

router.use(verifyToken, requireRole('admin'));

router.get('/', getCoaches);
router.post('/add', validate(createCoachSchema), createCoach);
router.put('/update/:id', validate(idParam(), 'params'), validate(updateCoachSchema), updateCoach);
router.delete('/delete/:id', validate(idParam(), 'params'), deleteCoach);

module.exports = router;

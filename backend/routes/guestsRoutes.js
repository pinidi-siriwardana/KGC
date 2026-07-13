const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const { getGuests, createGuest, updateGuest, deleteGuest } = require('../controllers/guestController');
const { validate } = require('../middleware/validate');
const { idParam } = require('../validation/common');
const { createGuestSchema, updateGuestSchema } = require('../validation/guestSchemas');

router.use(verifyToken, requireRole('admin'));

router.get('/', getGuests);
router.post('/', validate(createGuestSchema), createGuest);
router.put('/:id', validate(idParam(), 'params'), validate(updateGuestSchema), updateGuest);
router.delete('/:id', validate(idParam(), 'params'), deleteGuest);

module.exports = router;

const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const { getGuests, createGuest, updateGuest, deleteGuest } = require('../controllers/guestController');

router.use(verifyToken, requireRole('admin'));

router.get('/', getGuests);
router.post('/', createGuest);
router.put('/:id', updateGuest);
router.delete('/:id', deleteGuest);

module.exports = router;

const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const { getCoaches, createCoach, updateCoach, deleteCoach } = require('../controllers/coachController');

router.use(verifyToken, requireRole('admin'));

router.get('/', getCoaches);
router.post('/add', createCoach);
router.put('/update/:id', updateCoach);
router.delete('/delete/:id', deleteCoach);

module.exports = router;

const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const { getRevenueSummary, getRevenueTransactions } = require('../controllers/revenueController');
const { validate } = require('../middleware/validate');
const { revenueQuerySchema } = require('../validation/revenueSchemas');

router.use(verifyToken, requireRole('admin'));

router.get('/summary', validate(revenueQuerySchema, 'query'), getRevenueSummary);
router.get('/transactions', validate(revenueQuerySchema, 'query'), getRevenueTransactions);

module.exports = router;

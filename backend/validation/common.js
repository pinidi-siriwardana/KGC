const { z } = require('zod');

// Route params arrive as strings; coerce to a positive integer id. Bad ids
// (non-numeric, negative, decimal) now get a clean 400 instead of silently
// falling through to a 404 via `affectedRows === 0`.
const idParam = (name = 'id') => z.object({ [name]: z.coerce.number().int().positive() });

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'must be YYYY-MM-DD');

const email = z.string().trim().min(1, 'email is required').email('must be a valid email address');

const phone = z.string().trim().min(7, 'phone must be at least 7 characters').max(20, 'phone must be at most 20 characters');

const password = z.string().min(6, 'password must be at least 6 characters');

const username = z.string().trim().min(3, 'username must be at least 3 characters').max(50, 'username must be at most 50 characters');

const positiveAmount = z.coerce.number().positive('amount must be a positive number');

const nonNegativeAmount = z.coerce.number().nonnegative('amount must be a non-negative number');

module.exports = { idParam, dateString, email, phone, password, username, positiveAmount, nonNegativeAmount };

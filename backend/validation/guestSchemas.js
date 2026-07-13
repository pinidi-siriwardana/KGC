const { z } = require('zod');
const { phone, email } = require('./common');

// Guest email is optional (nullable in the DB) but the admin form always
// sends the key, sometimes as an empty string — accept both.
const optionalEmail = z.union([z.literal(''), email]).optional();

const createGuestSchema = z.object({
    full_name: z.string().trim().min(1, 'full_name is required'),
    phone,
    email: optionalEmail,
});

// updateGuest is a full-object replace, same shape as create.
const updateGuestSchema = createGuestSchema;

module.exports = { createGuestSchema, updateGuestSchema };

const { z } = require('zod');
const { phone, email, nullToEmpty } = require('./common');

// Guest email is optional (nullable in the DB) but the admin form always
// sends the key, sometimes as an empty string — accept both. Also wrapped in
// nullToEmpty because updateGuest is a full-object replace (see below) that
// resubmits whatever the directory's GET returned, including a genuinely
// NULL email/phone — without this, editing any other field on a guest with
// no email/phone on file would fail with an unrelated type error.
const optionalEmail = z.preprocess(nullToEmpty, z.union([z.literal(''), email]).optional());

const statusEnum = z.enum(['active', 'inactive']);

const createGuestSchema = z.object({
    full_name: z.string().trim().min(1, 'full_name is required'),
    phone: z.preprocess(nullToEmpty, phone),
    email: optionalEmail,
    status: statusEnum.optional(),
});

// updateGuest is a full-object replace, same shape as create.
const updateGuestSchema = createGuestSchema;

module.exports = { createGuestSchema, updateGuestSchema };

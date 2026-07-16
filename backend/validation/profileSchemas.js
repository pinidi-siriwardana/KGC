const { z } = require('zod');
const { username, email, phone, password } = require('./common');

// Self-service "update my profile" — every field optional (a request only
// sends what changed), but a new password can't be set without proving the
// current one, and an empty request is rejected outright.
const updateProfileSchema = z.object({
    username: username.optional(),
    email: email.optional(),
    phone: phone.optional(),
    currentPassword: z.string().optional(),
    newPassword: password.optional(),
})
    .refine((obj) => Object.keys(obj).length > 0, { message: 'Nothing to update.' })
    .refine((obj) => !obj.newPassword || obj.currentPassword, { message: 'Current password is required to set a new password.' });

// Admins now have a linked profile row too (the `staff` table, same as
// members/coaches have `members`/`coaches`), so the shape is identical to
// updateProfileSchema — kept as its own export so the admin route doesn't
// depend on member/coach naming.
const updateAdminProfileSchema = updateProfileSchema;

module.exports = { updateProfileSchema, updateAdminProfileSchema };

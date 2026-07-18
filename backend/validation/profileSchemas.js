const { z } = require('zod');
const { username, email, phone, password } = require('./common');

// The frontend forms that submit here always send the whole profileForm
// object, not just the changed field(s) — so an admin/member/coach whose
// email or phone isn't set yet (e.g. an admin account created without a
// completed staff profile) submits '' for it even when only editing
// username. '' must be normalized to undefined (same fix as
// optionalMembershipTypeId/optionalMemberId in common.js) so that "still
// blank" doesn't get rejected as "invalid email/phone" on every save.
const optionalEmail = z.preprocess((v) => (v === '' ? undefined : v), email.optional());
const optionalPhone = z.preprocess((v) => (v === '' ? undefined : v), phone.optional());

// Self-service "update my profile" — every field optional (a request only
// sends what changed), but a new password can't be set without proving the
// current one, and an empty request is rejected outright.
const updateProfileSchema = z.object({
    username: username.optional(),
    email: optionalEmail,
    phone: optionalPhone,
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

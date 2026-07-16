const { z } = require('zod');
const { username, password, email, phone, dateString, optionalMembershipTypeId } = require('./common');

const roleEnum = z.enum(['admin', 'member', 'coach']);
const statusEnum = z.enum(['active', 'pending', 'disabled']);

// A member/coach login is only half the account — without full_name/email/
// phone there's nothing to show in the Member/Coach Directory, so creating
// one here requires the same profile fields the dedicated Add Member/Add
// Coach forms collect. Admin accounts have no linked profile table at all.
const createUserSchema = z.discriminatedUnion('role', [
    z.object({
        role: z.literal('admin'),
        username, password,
        status: statusEnum.optional(),
    }),
    z.object({
        role: z.literal('member'),
        username, password,
        status: statusEnum.optional(),
        full_name: z.string().trim().min(1, 'full_name is required'),
        email, phone,
        membership_type_id: optionalMembershipTypeId,
        start_date: dateString.optional(),
    }),
    z.object({
        role: z.literal('coach'),
        username, password,
        status: statusEnum.optional(),
        full_name: z.string().trim().min(1, 'full_name is required'),
        email, phone,
        specialization: z.string().trim().optional(),
        experience_years: z.coerce.number().int().nonnegative().optional(),
    }),
], { error: "role must be one of 'admin', 'member', 'coach'." });

// Fills in the missing members/coaches row for a user that was created
// without one (e.g. via the old role-only create path) — same profile
// fields as creation, just applied to an existing user_id instead.
const completeProfileSchema = z.object({
    full_name: z.string().trim().min(1, 'full_name is required'),
    email, phone,
    membership_type_id: optionalMembershipTypeId,
    start_date: dateString.optional(),
    specialization: z.string().trim().optional(),
    experience_years: z.coerce.number().int().nonnegative().optional(),
});

// The admin edit form always sends password: '' when it isn't being
// changed (the input is only rendered when creating a new account) — an
// empty string must stay valid here so every edit doesn't 400.
const updateUserSchema = z.object({
    username: username.optional(),
    password: z.union([z.literal(''), password]).optional(),
    role: roleEnum.optional(),
    status: statusEnum.optional(),
}).refine((obj) => Object.keys(obj).length > 0, { message: 'No fields to update.' });

module.exports = { createUserSchema, updateUserSchema, completeProfileSchema };

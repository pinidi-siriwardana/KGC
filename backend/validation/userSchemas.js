const { z } = require('zod');
const { username, password } = require('./common');

const roleEnum = z.enum(['admin', 'member', 'coach']);
const statusEnum = z.enum(['active', 'pending', 'disabled']);

const createUserSchema = z.object({
    username,
    password,
    role: roleEnum,
    status: statusEnum.optional(),
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

module.exports = { createUserSchema, updateUserSchema };

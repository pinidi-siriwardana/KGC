const { z } = require('zod');
const { email, phone, password, username } = require('./common');

const registerSchema = z.object({
    full_name: z.string().trim().min(1, 'full_name is required'),
    email,
    phone,
    username,
    password,
    membership_type_id: z.coerce.number().int().positive('membership_type_id is required'),
});

// Presence-only: login authenticates an *existing* account, so it must not
// reject real accounts that predate the stricter username/password rules
// above (e.g. any admin-created via createUser before those rules existed).
const loginSchema = z.object({
    username: z.string().trim().min(1, 'username is required'),
    password: z.string().min(1, 'password is required'),
});

module.exports = { registerSchema, loginSchema };

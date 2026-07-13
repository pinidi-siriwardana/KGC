const { z } = require('zod');
const { username, password, email, phone, dateString } = require('./common');

const statusEnum = z.enum(['active', 'inactive', 'suspended']);

const createMemberSchema = z.object({
    username,
    password,
    full_name: z.string().trim().min(1, 'full_name is required'),
    email,
    phone,
    status: statusEnum.optional(),
    membership_type_id: z.coerce.number().int().positive('membership_type_id is required'),
    start_date: dateString.optional(),
});

// updateMember is a full-object replace (the controller writes every column
// unconditionally, no COALESCE/partial-patch semantics), and the admin edit
// form always sends all four fields — so these stay required, not optional.
const updateMemberSchema = z.object({
    full_name: z.string().trim().min(1, 'full_name is required'),
    email,
    phone,
    status: statusEnum,
});

module.exports = { createMemberSchema, updateMemberSchema };

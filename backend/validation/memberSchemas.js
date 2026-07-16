const { z } = require('zod');
const { username, password, email, phone, dateString } = require('./common');

const statusEnum = z.enum(['active', 'inactive', 'suspended']);

// membership_type_id is optional here: admins can register a member with no
// plan yet and assign one (with a matching payment) later. The form posts ''
// when left unselected, so that's normalized to undefined before coercion.
const optionalMembershipTypeId = z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : val),
    z.coerce.number().int().positive('membership_type_id must be a valid plan').optional()
);

const createMemberSchema = z.object({
    username,
    password,
    full_name: z.string().trim().min(1, 'full_name is required'),
    email,
    phone,
    status: statusEnum.optional(),
    membership_type_id: optionalMembershipTypeId,
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

// Assigns/edits a member's plan — membership_type_id is required here since
// the whole point of calling this endpoint is to set one; leaving a member
// on no plan is just done by never calling it.
const updateMembershipSchema = z.object({
    membership_type_id: z.coerce.number().int().positive('membership_type_id is required'),
    start_date: dateString.optional(),
});

module.exports = { createMemberSchema, updateMemberSchema, updateMembershipSchema };

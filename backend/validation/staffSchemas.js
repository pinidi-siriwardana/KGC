const { z } = require('zod');
const { email, phone } = require('./common');

// 'admin' is deliberately not an option here — an administrator's staff
// record is created together with their login via Access Management
// (userController.createUser), not through this form.
const staffTypeEnum = z.enum(['guard', 'other']);
const statusEnum = z.enum(['active', 'inactive', 'suspended']);

// Staff have no login, so email is optional (nothing to notify/authenticate
// with) but phone is required — same convention as guests.
const optionalEmail = z.union([z.literal(''), email]).optional();

const createStaffSchema = z.object({
    full_name: z.string().trim().min(1, 'full_name is required'),
    email: optionalEmail,
    phone,
    staff_type: staffTypeEnum,
    position: z.string().trim().optional(),
    status: statusEnum.optional(),
});

// updateStaff is a full-object replace, same shape as create.
const updateStaffSchema = createStaffSchema;

module.exports = { createStaffSchema, updateStaffSchema };

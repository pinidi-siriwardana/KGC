const { z } = require('zod');
const { email, phone, nullToEmpty, nullToUndefined } = require('./common');

// 'admin' is deliberately not an option here — an administrator's staff
// record is created together with their login via Access Management
// (userController.createUser), not through this form.
const staffTypeEnum = z.enum(['guard', 'other']);
const statusEnum = z.enum(['active', 'inactive', 'suspended']);

// Staff have no login, so email is optional (nothing to notify/authenticate
// with) but phone is required — same convention as guests. Wrapped in
// nullToEmpty/nullToUndefined because updateStaff is a full-object replace
// (see below) that resubmits whatever the directory's GET returned,
// including a genuinely NULL email/phone/position — without this, editing
// e.g. just a guard's status would fail with an unrelated type error on a
// field the admin never touched.
const optionalEmail = z.preprocess(nullToEmpty, z.union([z.literal(''), email]).optional());

const createStaffSchema = z.object({
    full_name: z.string().trim().min(1, 'full_name is required'),
    email: optionalEmail,
    phone: z.preprocess(nullToEmpty, phone),
    staff_type: staffTypeEnum,
    position: z.preprocess(nullToUndefined, z.string().trim().optional()),
    status: statusEnum.optional(),
});

// updateStaff is a full-object replace, same shape as create.
const updateStaffSchema = createStaffSchema;

module.exports = { createStaffSchema, updateStaffSchema };

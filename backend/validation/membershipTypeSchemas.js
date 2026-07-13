const { z } = require('zod');
const { nonNegativeAmount } = require('./common');

const membershipTypeSchema = z.object({
    name: z.string().trim().min(1, 'name is required'),
    duration_months: z.coerce.number().int().positive('duration_months is required'),
    price: nonNegativeAmount,
});

module.exports = { createMembershipTypeSchema: membershipTypeSchema, updateMembershipTypeSchema: membershipTypeSchema };

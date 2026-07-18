const { z } = require('zod');
const { username, password, email, phone } = require('./common');

// coaches.status is its own enum — 'on-leave', not 'suspended' (that's
// members.status). See DB.md's note on this exact mismatch.
const statusEnum = z.enum(['active', 'inactive', 'on-leave']);

const createCoachSchema = z.object({
    username,
    password,
    full_name: z.string().trim().min(1, 'full_name is required'),
    email,
    phone,
    specialization: z.string().trim().optional(),
    experience_years: z.coerce.number().int().nonnegative().optional(),
    status: statusEnum.optional(),
});

// updateCoach is a full-object replace (see memberSchemas.js note) — the
// admin edit form always sends every field (specialization defaults to '',
// experience_years defaults to 0, neither is ever omitted).
const updateCoachSchema = z.object({
    full_name: z.string().trim().min(1, 'full_name is required'),
    email,
    phone,
    specialization: z.string().trim(),
    experience_years: z.coerce.number().int().nonnegative(),
    status: statusEnum,
});

module.exports = { createCoachSchema, updateCoachSchema };

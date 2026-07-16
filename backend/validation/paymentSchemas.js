const { z } = require('zod');
const { username, password, email, phone, dateString, positiveAmount } = require('./common');

const paymentTypeEnum = z.enum([
    'membership', 'booking_fee', 'coach_registration', 'other',
    'cancellation_fee', 'donation', 'tournament_fee', 'no_show_fee',
]);
const paymentStatusEnum = z.enum(['completed', 'recorded', 'failed', 'refunded', 'waived']);

const getPaymentsQuerySchema = z.object({
    type: paymentTypeEnum.optional(),
    date: dateString.optional(),
    search: z.string().optional(),
});

// createManualPayment's shape genuinely depends on `purpose` — a
// discriminated union captures that instead of one giant object where every
// field is technically optional.
const manualPaymentBase = {
    amount: positiveAmount,
    payment_date: dateString.optional(),
    notes: z.string().optional(),
};

const newMemberPaymentSchema = z.object({
    purpose: z.literal('new_member'),
    ...manualPaymentBase,
    username, password,
    full_name: z.string().trim().min(1, 'full_name is required'),
    email, phone,
    membership_type_id: z.coerce.number().int().positive('membership_type_id is required'),
    start_date: dateString.optional(),
});

const newCoachPaymentSchema = z.object({
    purpose: z.literal('new_coach'),
    ...manualPaymentBase,
    username, password,
    full_name: z.string().trim().min(1, 'full_name is required'),
    email, phone,
    specialization: z.string().trim().optional(),
    experience_years: z.coerce.number().int().nonnegative().optional(),
});

const miscPaymentSchema = z.object({
    purpose: z.literal('misc'),
    ...manualPaymentBase,
    member_id: z.coerce.number().int().positive().optional(),
});

// Assigns a plan to an existing member (e.g. one registered with no plan
// yet) and records the matching payment in one step.
const assignPlanPaymentSchema = z.object({
    purpose: z.literal('assign_plan'),
    ...manualPaymentBase,
    member_id: z.coerce.number().int().positive('member_id is required'),
    membership_type_id: z.coerce.number().int().positive('membership_type_id is required'),
    start_date: dateString.optional(),
});

const createManualPaymentSchema = z.discriminatedUnion('purpose', [
    newMemberPaymentSchema, newCoachPaymentSchema, miscPaymentSchema, assignPlanPaymentSchema,
], { error: "purpose must be one of 'new_member', 'new_coach', 'misc', 'assign_plan'." });

const updatePaymentSchema = z.object({
    amount: positiveAmount.optional(),
    payment_date: dateString.optional(),
    notes: z.string().optional(),
    status: paymentStatusEnum.optional(),
}).refine((obj) => Object.keys(obj).length > 0, { message: 'Nothing to update.' });

// amount_declared was previously accepted with zero validation here, unlike
// its sibling updatePayment above — closes that gap.
const editVerificationSchema = z.object({
    remarks: z.string().optional(),
    amount_declared: positiveAmount.optional(),
}).refine((obj) => Object.keys(obj).length > 0, { message: 'Nothing to update.' });

const reviewVerificationSchema = z.object({
    remarks: z.string().optional(),
});

module.exports = {
    paymentTypeEnum,
    getPaymentsQuerySchema, createManualPaymentSchema, updatePaymentSchema,
    editVerificationSchema, reviewVerificationSchema,
};

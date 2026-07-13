const { z } = require('zod');
const { positiveAmount } = require('./common');

// payment_type decides which fields are actually required — a
// discriminated union expresses that instead of a flat "everything
// optional" object (mirrors paymentSchemas.js's manual-payment schema).
const membershipRenewalSchema = z.object({
    payment_type: z.literal('membership_renewal'),
    membership_type_id: z.coerce.number().int().positive('membership_type_id is required for a membership renewal.'),
    note: z.string().optional(),
});

const donationSchema = z.object({
    payment_type: z.literal('donation'),
    amount_declared: positiveAmount,
    note: z.string().optional(),
});

const tournamentFeeSchema = z.object({
    payment_type: z.literal('tournament_fee'),
    amount_declared: positiveAmount,
    note: z.string().optional(),
});

const submitPaymentSchema = z.discriminatedUnion('payment_type', [
    membershipRenewalSchema, donationSchema, tournamentFeeSchema,
], { error: "payment_type must be 'membership_renewal', 'donation' or 'tournament_fee'." });

const payOutstandingFeeSchema = z.object({
    note: z.string().optional(),
});

module.exports = { submitPaymentSchema, payOutstandingFeeSchema };

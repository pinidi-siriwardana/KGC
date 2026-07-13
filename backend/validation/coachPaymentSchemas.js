const { z } = require('zod');
const { positiveAmount } = require('./common');

// Coaches have no membership_renewal branch (no membership to renew) —
// donation/tournament_fee share the same shape, so a plain enum is enough,
// unlike memberPaymentSchemas' discriminated union.
const submitPaymentSchema = z.object({
    payment_type: z.enum(['donation', 'tournament_fee'], {
        error: "payment_type must be 'donation' or 'tournament_fee'.",
    }),
    amount_declared: positiveAmount,
    note: z.string().optional(),
});

const payOutstandingFeeSchema = z.object({
    note: z.string().optional(),
});

module.exports = { submitPaymentSchema, payOutstandingFeeSchema };

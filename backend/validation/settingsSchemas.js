const { z } = require('zod');

// club_settings is a genuinely open key/value store (new fee keys get added
// as features grow — guest_booking_fee, no_show_fee, etc.), so this can't be
// a fixed-shape object. Previously only cancellation_fee got a numeric
// check; extend that to every known *_fee key instead of just one.
const NUMERIC_FEE_KEYS = ['cancellation_fee', 'guest_booking_fee', 'no_show_fee'];

const updateSettingsSchema = z.record(z.string(), z.union([z.string(), z.number()]))
    .refine((obj) => Object.keys(obj).length > 0, { message: 'Nothing to update.' })
    .superRefine((obj, ctx) => {
        for (const key of NUMERIC_FEE_KEYS) {
            if (obj[key] === undefined) continue;
            const numeric = Number(obj[key]);
            if (!Number.isFinite(numeric) || numeric < 0) {
                ctx.addIssue({ code: 'custom', message: `${key} must be a non-negative number.` });
            }
        }
    });

module.exports = { updateSettingsSchema };

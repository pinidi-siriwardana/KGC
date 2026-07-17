const { z } = require('zod');

// club_settings is a genuinely open key/value store (new fee keys get added
// as features grow — guest_booking_fee, no_show_fee, etc.), so this can't be
// a fixed-shape object. Previously only cancellation_fee got a numeric
// check; extend that to every known *_fee key instead of just one.
const NUMERIC_FEE_KEYS = ['cancellation_fee', 'guest_booking_fee', 'no_show_fee'];
const EMAIL_KEYS = ['club_email'];
// Empty string is valid for these — clears the link so the public footer
// simply doesn't render that icon, rather than pointing at a dead '#'.
const OPTIONAL_URL_KEYS = ['club_facebook_url', 'club_instagram_url', 'club_twitter_url'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_RE = /^https?:\/\/.+/i;

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
        for (const key of EMAIL_KEYS) {
            if (!obj[key]) continue;
            if (!EMAIL_RE.test(String(obj[key]))) {
                ctx.addIssue({ code: 'custom', message: `${key} must be a valid email address.` });
            }
        }
        for (const key of OPTIONAL_URL_KEYS) {
            if (!obj[key]) continue;
            if (!URL_RE.test(String(obj[key]))) {
                ctx.addIssue({ code: 'custom', message: `${key} must be a valid http(s) URL.` });
            }
        }
    });

module.exports = { updateSettingsSchema };

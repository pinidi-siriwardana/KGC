const { z } = require('zod');

// Route params arrive as strings; coerce to a positive integer id. Bad ids
// (non-numeric, negative, decimal) now get a clean 400 instead of silently
// falling through to a 404 via `affectedRows === 0`.
const idParam = (name = 'id') => z.object({ [name]: z.coerce.number().int().positive() });

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'must be YYYY-MM-DD');

const email = z.string().trim().min(1, 'email is required').email('must be a valid email address');

// Canonical contact-number format across the whole app: a Sri Lankan mobile
// number, either local (07XXXXXXXX) or international (+947XXXXXXXX). Spaces
// and dashes are stripped before validation, and anything in +94 form is
// normalized to the local 0-prefixed form so every stored number matches.
const PHONE_FORMAT_HINT = '07XXXXXXXX or +947XXXXXXXX';
const phone = z.preprocess(
    (val) => (typeof val === 'string' ? val.replace(/[\s-]/g, '') : val),
    z.string().regex(/^(?:0|\+94)7\d{8}$/, `phone must be a valid Sri Lankan mobile number (${PHONE_FORMAT_HINT})`)
).transform((val) => (val.startsWith('+94') ? `0${val.slice(3)}` : val));

const password = z.string().min(6, 'password must be at least 6 characters');

const username = z.string().trim().min(3, 'username must be at least 3 characters').max(50, 'username must be at most 50 characters');

// Same normalization as `phone` above, but for lookups where the input could
// be a phone OR an email — only reshapes the value when it actually matches
// the phone pattern, leaves anything else (an email, a partial/invalid
// phone) untouched for the caller to compare/validate as-is.
const normalizeIfPhone = (raw) => {
    const trimmed = raw.trim().replace(/[\s-]/g, '');
    if (/^(?:0|\+94)7\d{8}$/.test(trimmed)) {
        return trimmed.startsWith('+94') ? `0${trimmed.slice(3)}` : trimmed;
    }
    return raw.trim();
};

const positiveAmount = z.coerce.number().positive('amount must be a positive number');

const nonNegativeAmount = z.coerce.number().nonnegative('amount must be a non-negative number');

// Shared by any "create a member" form (Add Member, Access Management, the
// manual-payment new-member purpose): a plan is optional up front, and the
// form posts '' when left unselected, so that's normalized to undefined
// before coercion rather than failing positive().
const optionalMembershipTypeId = z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : val),
    z.coerce.number().int().positive('membership_type_id must be a valid plan').optional()
);

module.exports = {
    idParam, dateString, email, phone, password, username, positiveAmount, nonNegativeAmount,
    PHONE_FORMAT_HINT, optionalMembershipTypeId, normalizeIfPhone,
};

const { z } = require('zod');
const { dateString, phone, nonNegativeAmount } = require('./common');

// A schema can't do a DB round-trip (no CURDATE() here, unlike the
// authoritative controller-side checks), and the server process's own OS
// timezone isn't guaranteed to match the club's (Sri Lanka, UTC+5:30) — a
// cloud host commonly defaults to UTC regardless of where the club actually
// is. Computed via a fixed offset instead of `new Date().toISOString()`
// (always UTC), which would otherwise still be "yesterday" here for the
// first ~5.5 hours of every real Sri Lanka day. This is only a soft,
// best-effort pre-check anyway (see the comment on createGuestLock's own
// CURDATE()-based check, which is what actually enforces this rule).
const SRI_LANKA_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const todayISO = () => new Date(Date.now() + SRI_LANKA_OFFSET_MS).toISOString().slice(0, 10);

const availabilityQuerySchema = z.object({
    date: dateString,
});

// Optional filters on the authenticated booking list.
const getBookingsQuerySchema = z.object({
    date: dateString.optional(),
    status: z.enum(['pending', 'confirmed', 'rejected', 'cancelled']).optional(),
    court_id: z.coerce.number().int().positive().optional(),
});

// Public: lets the guest-booking widget check if a phone/email matches an
// existing guest, so a returning guest can reuse that record instead of a
// fresh one being created on every booking. Deliberately not the `phone`
// schema — this can be an email too, and matching should stay lenient
// (the controller normalizes/tries both forms) rather than 400 on shape.
const lookupGuestQuerySchema = z.object({
    contact: z.string().trim().min(3, 'contact is required'),
});

// Public guest lock: not role-gated, so "not in the past" is pure input
// validation here and can live in the schema (unlike createBooking, where
// the same rule is role-conditional and stays in the controller). Either an
// existing guest_id (returning guest, found via lookup) or the full
// guest_full_name/guest_phone pair (new guest) is required — mirrors the
// same guest_id-or-new-guest-fields shape createBooking already accepts for
// admin-created guest bookings.
const createGuestLockSchema = z.object({
    court_id: z.coerce.number().int().positive('court_id is required'),
    slot_id: z.coerce.number().int().positive('slot_id is required'),
    booking_date: dateString.refine((d) => d >= todayISO(), 'Cannot book a date in the past.'),
    guest_id: z.coerce.number().int().positive().optional(),
    guest_full_name: z.string().trim().min(1, 'guest_full_name is required').optional(),
    guest_phone: phone.optional(),
    guest_email: z.union([z.literal(''), z.string().email('must be a valid email address')]).optional(),
}).refine(
    (obj) => obj.guest_id || (obj.guest_full_name && obj.guest_phone),
    { message: 'guest_id, or guest_full_name and guest_phone, are required.' }
);

// Only the fields universal to every caller (member/coach/admin) — the
// admin-only branch (booking_type, member_id/coach_id/guest fields,
// amount_charged) stays validated in the controller since it's interleaved
// with sequential DB-existence lookups inside the transaction.
const createBookingSchema = z.object({
    court_id: z.coerce.number().int().positive('court_id is required'),
    slot_id: z.coerce.number().int().positive('slot_id is required'),
    booking_date: dateString,
}).passthrough();

const updateBookingStatusSchema = z.object({
    action: z.enum(['cancel', 'reject', 'lock', 'unlock', 'restore'], {
        error: "action must be 'cancel', 'reject', 'lock', 'unlock' or 'restore'.",
    }),
});

// Admin-only correction of a booking's recorded fee (and, for guest bookings,
// the note attached to its payment) after the fact — e.g. a mistyped amount —
// without having to cancel and recreate the whole booking.
const updateBookingDetailsSchema = z.object({
    amount_charged: nonNegativeAmount,
    note: z.string().trim().optional(),
});

module.exports = {
    availabilityQuerySchema,
    getBookingsQuerySchema,
    lookupGuestQuerySchema,
    createGuestLockSchema,
    createBookingSchema,
    updateBookingStatusSchema,
    updateBookingDetailsSchema,
};

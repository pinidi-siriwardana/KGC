const { z } = require('zod');
const { dateString, phone } = require('./common');

const todayISO = () => new Date().toISOString().slice(0, 10);

const availabilityQuerySchema = z.object({
    date: dateString,
});

// Optional filters on the authenticated booking list.
const getBookingsQuerySchema = z.object({
    date: dateString.optional(),
    status: z.enum(['pending', 'confirmed', 'rejected', 'cancelled']).optional(),
    court_id: z.coerce.number().int().positive().optional(),
});

// Public guest lock: not role-gated, so "not in the past" is pure input
// validation here and can live in the schema (unlike createBooking, where
// the same rule is role-conditional and stays in the controller).
const createGuestLockSchema = z.object({
    court_id: z.coerce.number().int().positive('court_id is required'),
    slot_id: z.coerce.number().int().positive('slot_id is required'),
    booking_date: dateString.refine((d) => d >= todayISO(), 'Cannot book a date in the past.'),
    guest_full_name: z.string().trim().min(1, 'guest_full_name is required'),
    guest_phone: phone,
    guest_email: z.union([z.literal(''), z.string().email('must be a valid email address')]).optional(),
});

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
    action: z.enum(['cancel', 'reject', 'lock', 'unlock'], {
        error: "action must be 'cancel', 'reject', 'lock' or 'unlock'.",
    }),
});

module.exports = {
    availabilityQuerySchema,
    getBookingsQuerySchema,
    createGuestLockSchema,
    createBookingSchema,
    updateBookingStatusSchema,
};

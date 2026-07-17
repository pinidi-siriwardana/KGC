const { z } = require('zod');
const { dateString } = require('./common');

const getAttendanceQuerySchema = z.object({
    date: dateString,
});

const getAttendanceHistoryQuerySchema = z.object({
    from: dateString.optional(),
    to: dateString.optional(),
    search: z.string().trim().optional(),
    type: z.enum(['member', 'coach']).optional(),
}).refine((obj) => !obj.from || !obj.to || obj.from <= obj.to, { message: 'from must be on or before to.' });

// Self-service version — no search/type since it's always scoped to "me".
const getMyAttendanceQuerySchema = z.object({
    from: dateString.optional(),
    to: dateString.optional(),
}).refine((obj) => !obj.from || !obj.to || obj.from <= obj.to, { message: 'from must be on or before to.' });

// Charging the fee is the default; an admin can explicitly waive it instead
// (e.g. an excused absence) without it ever landing on the sweep's radar
// again — see chargeNoShowFee in utils/noShowSweep.js.
const markNoShowSchema = z.object({
    waive: z.boolean().optional(),
});

// Accepts anything Date.parse() understands — in practice a
// <input type="datetime-local"> value (e.g. "2026-07-17T14:30"), which both
// the browser and Node interpret as local time since it carries no
// timezone suffix, so client display and server parsing stay consistent.
const datetimeLocal = z.string().refine((v) => !isNaN(Date.parse(v)), { message: 'must be a valid date/time' });

const checkInSchema = z.object({
    booking_id: z.coerce.number().int().positive('booking_id is required'),
    member_id: z.coerce.number().int().positive().optional(),
    coach_id: z.coerce.number().int().positive().optional(),
    checkin_time: datetimeLocal.optional(),
}).refine((obj) => (!!obj.member_id) !== (!!obj.coach_id), {
    message: 'Exactly one of member_id or coach_id is required.',
});

const checkOutSchema = z.object({
    checkout_time: datetimeLocal.optional(),
});

// Edits an existing attendance record's check-in and/or check-out time —
// at least one of the two must actually be supplied. checkout_time also
// accepts an explicit null, distinct from being omitted: omitted means
// "leave it as-is", null means "clear it" (undo an accidental check-out).
const updateAttendanceSchema = z.object({
    checkin_time: datetimeLocal.optional(),
    checkout_time: z.union([datetimeLocal, z.null()]).optional(),
}).refine((obj) => obj.checkin_time !== undefined || obj.checkout_time !== undefined, {
    message: 'At least one of checkin_time or checkout_time is required.',
});

module.exports = {
    getAttendanceQuerySchema, getAttendanceHistoryQuerySchema, getMyAttendanceQuerySchema, checkInSchema, checkOutSchema,
    updateAttendanceSchema, markNoShowSchema,
};

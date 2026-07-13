const { z } = require('zod');
const { dateString } = require('./common');

const getAttendanceQuerySchema = z.object({
    date: dateString,
});

const checkInSchema = z.object({
    booking_id: z.coerce.number().int().positive('booking_id is required'),
    member_id: z.coerce.number().int().positive().optional(),
    coach_id: z.coerce.number().int().positive().optional(),
}).refine((obj) => (!!obj.member_id) !== (!!obj.coach_id), {
    message: 'Exactly one of member_id or coach_id is required.',
});

module.exports = { getAttendanceQuerySchema, checkInSchema };

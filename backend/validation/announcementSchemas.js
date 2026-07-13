const { z } = require('zod');

// publish_at is a DATETIME (date + time), unlike the plain-date bookings
// fields, so it isn't validated against the YYYY-MM-DD `dateString` shape —
// stays a loose optional string, same permissiveness as before.
const announcementSchema = z.object({
    title: z.string().trim().min(1, 'title is required'),
    category: z.string().trim().optional(),
    content: z.string().trim().min(1, 'content is required'),
    publish_at: z.union([z.literal(''), z.string()]).optional().nullable(),
});

module.exports = { createAnnouncementSchema: announcementSchema, updateAnnouncementSchema: announcementSchema };

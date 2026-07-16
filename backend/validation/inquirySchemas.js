const { z } = require('zod');
const { email, phone } = require('./common');

// Contact form phone is optional, but if given must still match the app-wide
// format so the inquiries list doesn't collect one-off formats.
const optionalPhone = z.union([z.literal(''), phone]).optional();

const submitInquirySchema = z.object({
    full_name: z.string().trim().min(1, 'full_name is required'),
    email,
    phone: optionalPhone,
    message: z.string().trim().min(1, 'message is required'),
});

const replyToInquirySchema = z.object({
    reply_message: z.string().trim().min(1, 'reply_message is required'),
});

module.exports = { submitInquirySchema, replyToInquirySchema };

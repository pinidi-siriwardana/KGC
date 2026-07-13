const { z } = require('zod');
const { email } = require('./common');

const submitInquirySchema = z.object({
    full_name: z.string().trim().min(1, 'full_name is required'),
    email,
    phone: z.string().trim().optional(),
    message: z.string().trim().min(1, 'message is required'),
});

const replyToInquirySchema = z.object({
    reply_message: z.string().trim().min(1, 'reply_message is required'),
});

module.exports = { submitInquirySchema, replyToInquirySchema };

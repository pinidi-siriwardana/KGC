const { z } = require('zod');
const { dateString } = require('./common');
const { paymentTypeEnum } = require('./paymentSchemas');

const revenueQuerySchema = z.object({
    from: dateString.optional(),
    to: dateString.optional(),
    type: paymentTypeEnum.optional(),
    search: z.string().optional(),
    groupBy: z.enum(['day', 'week', 'month']).optional(),
});

module.exports = { revenueQuerySchema };

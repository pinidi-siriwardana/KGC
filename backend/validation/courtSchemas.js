const { z } = require('zod');

const updateCourtStatusSchema = z.object({
    status: z.enum(['available', 'maintenance'], { error: "status must be 'available' or 'maintenance'." }),
});

module.exports = { updateCourtStatusSchema };

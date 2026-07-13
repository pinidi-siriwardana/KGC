const fs = require('fs');

// Generic Zod-schema validation middleware. Validates req[source] (body,
// params, or query) and replaces it with the parsed/coerced data on success,
// so downstream controllers see clean, typed values (e.g. numeric ids
// instead of route-param strings).
//
// Express 5 makes req.query a getter-only accessor — a plain `req.query = x`
// silently no-ops instead of throwing, so query validation must go through
// defineProperty to actually take effect.
//
// On multipart routes, validate() runs after multer (req.body isn't parsed
// until then) — so a rejected request here still has an uploaded file sitting
// on disk. Every controller's own `fail()` helper cleans that up on its own
// checks; this must do the same or every failed upload+validate leaks a file.
const validate = (schema, source = 'body') => (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
        if (req.file) fs.unlink(req.file.path, () => {});
        if (req.files) {
            const files = Array.isArray(req.files) ? req.files : Object.values(req.files).flat();
            files.forEach((f) => fs.unlink(f.path, () => {}));
        }
        return res.status(400).json({ message: result.error.issues[0]?.message || 'Invalid request.' });
    }
    if (source === 'query') {
        Object.defineProperty(req, 'query', { value: result.data, configurable: true, enumerable: true, writable: true });
    } else {
        req[source] = result.data;
    }
    next();
};

module.exports = { validate };

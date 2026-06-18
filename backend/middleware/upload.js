const fs = require('fs');
const path = require('path');
const multer = require('multer');

const SLIPS_DIR = path.join(__dirname, '..', 'uploads', 'slips');
fs.mkdirSync(SLIPS_DIR, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, SLIPS_DIR),
    filename: (req, file, cb) => {
        const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
        cb(null, `${Date.now()}-${safeName}`);
    },
});

const fileFilter = (req, file, cb) => {
    const allowed = /^image\/(jpeg|png|webp)$|^application\/pdf$/;
    if (allowed.test(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only JPG, PNG or PDF files are allowed.'));
    }
};

const uploadReceipt = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB, matches the frontend's stated limit
});

module.exports = { uploadReceipt, SLIPS_DIR };

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

const COACHES_DIR = path.join(__dirname, '..', 'uploads', 'coaches');
fs.mkdirSync(COACHES_DIR, { recursive: true });

const coachPhotoStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, COACHES_DIR),
    filename: (req, file, cb) => {
        const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
        cb(null, `${Date.now()}-${safeName}`);
    },
});

const imageOnlyFilter = (req, file, cb) => {
    const allowed = /^image\/(jpeg|png|webp)$/;
    if (allowed.test(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only JPG, PNG or WEBP images are allowed.'));
    }
};

const uploadCoachPhoto = multer({
    storage: coachPhotoStorage,
    fileFilter: imageOnlyFilter,
    limits: { fileSize: 3 * 1024 * 1024 }, // 3MB — a profile photo, not a scanned document
});

const COURTS_DIR = path.join(__dirname, '..', 'uploads', 'courts');
fs.mkdirSync(COURTS_DIR, { recursive: true });

const courtPhotoStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, COURTS_DIR),
    filename: (req, file, cb) => {
        const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
        cb(null, `${Date.now()}-${safeName}`);
    },
});

const uploadCourtPhoto = multer({
    storage: courtPhotoStorage,
    fileFilter: imageOnlyFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB — a wider facility shot, not just a headshot
});

module.exports = { uploadReceipt, uploadCoachPhoto, uploadCourtPhoto, SLIPS_DIR, COACHES_DIR, COURTS_DIR };

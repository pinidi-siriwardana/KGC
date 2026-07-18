const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

const getAllCourts = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM courts ORDER BY court_id ASC');
        res.json({ data: rows });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch courts.', error: err.message });
    }
};

// Admin: replaces a court's photo, shown in the public court gallery. The
// old file (if any) is deleted from disk once the new one is saved, so
// switching photos repeatedly doesn't leave orphaned files behind.
const updateCourtPhoto = async (req, res) => {
    const { id } = req.params;

    const cleanupUpload = () => {
        if (req.file) fs.unlink(req.file.path, () => {});
    };

    if (!req.file) {
        return res.status(400).json({ message: 'A photo file is required.' });
    }

    try {
        const [[court]] = await pool.query('SELECT photo_url FROM courts WHERE court_id = ?', [id]);
        if (!court) {
            cleanupUpload();
            return res.status(404).json({ message: 'Court not found.' });
        }

        const photo_url = `/uploads/courts/${req.file.filename}`;
        await pool.query('UPDATE courts SET photo_url = ? WHERE court_id = ?', [photo_url, id]);

        if (court.photo_url) {
            const oldPath = path.join(__dirname, '..', court.photo_url);
            fs.unlink(oldPath, () => {});
        }

        res.json({ message: 'Court photo updated.', photo_url });
    } catch (err) {
        cleanupUpload();
        res.status(500).json({ message: 'Failed to update court photo.', error: err.message });
    }
};

module.exports = { getAllCourts, updateCourtPhoto };

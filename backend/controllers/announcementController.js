const pool = require('../config/db');

const ensureTable = async () => {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS announcements (
            announcement_id INT AUTO_INCREMENT PRIMARY KEY,
            title           VARCHAR(255) NOT NULL,
            category        VARCHAR(100) NOT NULL DEFAULT 'GENERAL',
            content         TEXT NOT NULL,
            publish_at      DATETIME NULL DEFAULT NULL,
            is_deleted      TINYINT(1) NOT NULL DEFAULT 0,
            created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    `);
};

// Public: only show live (publish_at is null/past) and not deleted
const getAnnouncements = async (req, res) => {
    try {
        await ensureTable();
        const [rows] = await pool.query(
            `SELECT announcement_id, title, category, content, publish_at, created_at
             FROM announcements
             WHERE is_deleted = 0 AND (publish_at IS NULL OR publish_at <= NOW())
             ORDER BY COALESCE(publish_at, created_at) DESC`
        );
        res.json({ data: rows });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch announcements.', error: err.message });
    }
};

// Admin: return all (live + scheduled), not deleted
const getAllAnnouncements = async (req, res) => {
    try {
        await ensureTable();
        const [rows] = await pool.query(
            `SELECT announcement_id, title, category, content, publish_at, created_at
             FROM announcements
             WHERE is_deleted = 0
             ORDER BY COALESCE(publish_at, created_at) DESC`
        );
        res.json({ data: rows });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch announcements.', error: err.message });
    }
};

const createAnnouncement = async (req, res) => {
    const { title, category, content, publish_at } = req.body;
    try {
        await ensureTable();
        const [result] = await pool.query(
            'INSERT INTO announcements (title, category, content, publish_at) VALUES (?, ?, ?, ?)',
            [title, category || 'GENERAL', content, publish_at || null]
        );
        res.status(201).json({ message: 'Announcement created.', announcement_id: result.insertId });
    } catch (err) {
        res.status(500).json({ message: 'Failed to create announcement.', error: err.message });
    }
};

const updateAnnouncement = async (req, res) => {
    const { id } = req.params;
    const { title, category, content, publish_at } = req.body;
    try {
        const [result] = await pool.query(
            `UPDATE announcements
             SET title = ?, category = ?, content = ?, publish_at = ?
             WHERE announcement_id = ? AND is_deleted = 0`,
            [title, category || 'GENERAL', content, publish_at || null, id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Announcement not found.' });
        res.json({ message: 'Announcement updated.' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to update announcement.', error: err.message });
    }
};

const deleteAnnouncement = async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await pool.query(
            'UPDATE announcements SET is_deleted = 1 WHERE announcement_id = ? AND is_deleted = 0',
            [id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Announcement not found.' });
        res.json({ message: 'Announcement removed.' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to delete announcement.', error: err.message });
    }
};

module.exports = { getAnnouncements, getAllAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement };

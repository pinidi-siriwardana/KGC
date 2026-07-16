const pool = require('../config/db');

const getGuests = async (req, res) => {
    const { search } = req.query;

    try {
        const [rows] = search
            ? await pool.query(
                  `SELECT * FROM guests WHERE is_deleted = 0 AND (full_name LIKE ? OR phone LIKE ?) ORDER BY created_at DESC`,
                  [`%${search}%`, `%${search}%`]
              )
            : await pool.query('SELECT * FROM guests WHERE is_deleted = 0 ORDER BY created_at DESC');

        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch guests.', error: err.message });
    }
};

const createGuest = async (req, res) => {
    const { full_name, phone, email } = req.body;

    try {
        const [result] = await pool.query(
            'INSERT INTO guests (full_name, phone, email) VALUES (?, ?, ?)',
            [full_name, phone, email || null]
        );
        res.status(201).json({ message: 'Guest created.', guest_id: result.insertId });
    } catch (err) {
        res.status(500).json({ message: 'Failed to create guest.', error: err.message });
    }
};

const updateGuest = async (req, res) => {
    const { id } = req.params;
    const { full_name, phone, email } = req.body;

    try {
        const [result] = await pool.query(
            'UPDATE guests SET full_name = ?, phone = ?, email = ? WHERE guest_id = ?',
            [full_name, phone, email || null, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Guest not found.' });
        }

        res.json({ message: 'Guest updated.' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to update guest.', error: err.message });
    }
};

// Soft-delete: a hard DELETE would throw a raw FK error for any guest who
// has ever made a court booking (bookings.guest_id has no ON DELETE
// action). Hiding the row instead keeps booking history intact and lets
// the admin undo the removal.
const deleteGuest = async (req, res) => {
    const { id } = req.params;

    try {
        const [result] = await pool.query('UPDATE guests SET is_deleted = 1 WHERE guest_id = ? AND is_deleted = 0', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Guest not found.' });
        }

        res.json({ message: 'Guest removed.' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to delete guest.', error: err.message });
    }
};

const restoreGuest = async (req, res) => {
    const { id } = req.params;

    try {
        const [result] = await pool.query('UPDATE guests SET is_deleted = 0 WHERE guest_id = ? AND is_deleted = 1', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Guest not found.' });
        }

        res.json({ message: 'Guest restored.' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to restore guest.', error: err.message });
    }
};

module.exports = { getGuests, createGuest, updateGuest, deleteGuest, restoreGuest };

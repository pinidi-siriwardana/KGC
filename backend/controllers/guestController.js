const pool = require('../config/db');

const getGuests = async (req, res) => {
    const { search } = req.query;

    try {
        const [rows] = search
            ? await pool.query(
                  `SELECT * FROM guests WHERE (full_name LIKE ? OR phone LIKE ?) ORDER BY created_at DESC`,
                  [`%${search}%`, `%${search}%`]
              )
            : await pool.query('SELECT * FROM guests ORDER BY created_at DESC');

        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch guests.', error: err.message });
    }
};

const createGuest = async (req, res) => {
    const { full_name, phone, email, status } = req.body;

    try {
        const [result] = await pool.query(
            'INSERT INTO guests (full_name, phone, email, status) VALUES (?, ?, ?, ?)',
            [full_name, phone, email || null, status || 'active']
        );
        res.status(201).json({ message: 'Guest created.', guest_id: result.insertId });
    } catch (err) {
        res.status(500).json({ message: 'Failed to create guest.', error: err.message });
    }
};

// No delete for guests (or any admin directory) — status is the only way to
// deactivate one, so real booking/payment history can never be removed from
// the database through the dashboard.
const updateGuest = async (req, res) => {
    const { id } = req.params;
    const { full_name, phone, email, status } = req.body;

    try {
        const [result] = await pool.query(
            'UPDATE guests SET full_name = ?, phone = ?, email = ?, status = ? WHERE guest_id = ?',
            [full_name, phone, email || null, status || 'active', id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Guest not found.' });
        }

        res.json({ message: 'Guest updated.' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to update guest.', error: err.message });
    }
};

module.exports = { getGuests, createGuest, updateGuest };

const pool = require('../config/db');

const getGuests = async (req, res) => {
    const { search } = req.query;

    try {
        const [rows] = search
            ? await pool.query(
                  `SELECT * FROM guests WHERE full_name LIKE ? OR phone LIKE ? ORDER BY created_at DESC`,
                  [`%${search}%`, `%${search}%`]
              )
            : await pool.query('SELECT * FROM guests ORDER BY created_at DESC');

        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch guests.', message: err.message });
    }
};

const createGuest = async (req, res) => {
    const { full_name, phone, email } = req.body;

    if (!full_name || !phone) {
        return res.status(400).json({ error: 'full_name and phone are required.' });
    }

    try {
        const [result] = await pool.query(
            'INSERT INTO guests (full_name, phone, email) VALUES (?, ?, ?)',
            [full_name, phone, email || null]
        );
        res.status(201).json({ message: 'Guest created.', guest_id: result.insertId });
    } catch (err) {
        res.status(500).json({ error: 'Failed to create guest.', message: err.message });
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
            return res.status(404).json({ error: 'Guest not found.' });
        }

        res.json({ message: 'Guest updated.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update guest.', message: err.message });
    }
};

const deleteGuest = async (req, res) => {
    const { id } = req.params;

    try {
        const [result] = await pool.query('DELETE FROM guests WHERE guest_id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Guest not found.' });
        }

        res.json({ message: 'Guest deleted.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete guest.', message: err.message });
    }
};

module.exports = { getGuests, createGuest, updateGuest, deleteGuest };

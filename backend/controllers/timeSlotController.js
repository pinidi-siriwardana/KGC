const pool = require('../config/db');

const getAllTimeSlots = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM time_slots ORDER BY start_time ASC');
        res.json({ data: rows });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch time slots.', error: err.message });
    }
};

module.exports = { getAllTimeSlots };

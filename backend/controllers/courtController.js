const pool = require('../config/db');

const getAllCourts = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM courts ORDER BY court_id ASC');
        res.json({ data: rows });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch courts.', error: err.message });
    }
};

const updateCourtStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!['available', 'maintenance'].includes(status)) {
        return res.status(400).json({ message: "status must be 'available' or 'maintenance'." });
    }

    try {
        const [result] = await pool.query('UPDATE courts SET status = ? WHERE court_id = ?', [status, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Court not found.' });
        }

        res.json({ message: 'Court status updated.' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to update court status.', error: err.message });
    }
};

module.exports = { getAllCourts, updateCourtStatus };

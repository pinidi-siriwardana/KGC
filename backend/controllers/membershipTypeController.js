const pool = require('../config/db');

const getMembershipTypes = async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT membership_type_id, name, duration_months, price FROM membership_types ORDER BY price ASC'
        );
        res.json({ data: rows });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch membership types.', error: err.message });
    }
};

module.exports = { getMembershipTypes };

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

const createMembershipType = async (req, res) => {
    const { name, duration_months, price } = req.body;

    try {
        const [result] = await pool.query(
            'INSERT INTO membership_types (name, duration_months, price) VALUES (?, ?, ?)',
            [name, duration_months, price]
        );
        res.status(201).json({ message: 'Membership type created.', membership_type_id: result.insertId });
    } catch (err) {
        res.status(500).json({ message: 'Failed to create membership type.', error: err.message });
    }
};

const updateMembershipType = async (req, res) => {
    const { id } = req.params;
    const { name, duration_months, price } = req.body;

    try {
        const [result] = await pool.query(
            'UPDATE membership_types SET name = ?, duration_months = ?, price = ? WHERE membership_type_id = ?',
            [name, duration_months, price, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Membership type not found.' });
        }

        res.json({ message: 'Membership type updated.' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to update membership type.', error: err.message });
    }
};

const deleteMembershipType = async (req, res) => {
    const { id } = req.params;

    try {
        const [result] = await pool.query('DELETE FROM membership_types WHERE membership_type_id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Membership type not found.' });
        }

        res.json({ message: 'Membership type deleted.' });
    } catch (err) {
        if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.code === 'ER_ROW_IS_REFERENCED') {
            return res.status(409).json({
                message: 'Cannot delete: this plan is already used by existing registrations or memberships.'
            });
        }
        res.status(500).json({ message: 'Failed to delete membership type.', error: err.message });
    }
};

module.exports = { getMembershipTypes, createMembershipType, updateMembershipType, deleteMembershipType };

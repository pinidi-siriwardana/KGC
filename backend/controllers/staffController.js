const pool = require('../config/db');
const { createStaffRecord } = require('../utils/staffAccount');

// Admin rows are included here too (LEFT JOIN users picks up their
// username/login status) so the directory shows every staff member in one
// list, even though admin rows are only ever created/removed from Access
// Management, not from this page.
const getStaff = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT s.staff_id, s.user_id, s.full_name, s.email, s.phone, s.staff_type, s.position, s.status, s.created_at,
                    u.username, u.status AS login_status
             FROM staff s
             LEFT JOIN users u ON u.user_id = s.user_id
             WHERE s.is_deleted = 0
             ORDER BY s.created_at DESC`
        );
        res.json({ data: rows });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch staff.', error: err.message });
    }
};

// Guards/other staff only — admin staff records are created alongside their
// login via Access Management (userController.createUser).
const createStaff = async (req, res) => {
    const { full_name, email, phone, staff_type, position, status } = req.body;

    try {
        const { staff_id } = await createStaffRecord(pool, { full_name, email, phone, staff_type, position, status });
        res.status(201).json({ message: 'Staff member added.', staff_id });
    } catch (err) {
        res.status(500).json({ message: 'Failed to add staff member.', error: err.message });
    }
};

const updateStaff = async (req, res) => {
    const { id } = req.params;
    const { full_name, email, phone, staff_type, position, status } = req.body;

    try {
        const [[existing]] = await pool.query('SELECT staff_type FROM staff WHERE staff_id = ? AND is_deleted = 0', [id]);
        if (!existing) {
            return res.status(404).json({ message: 'Staff member not found.' });
        }
        if (existing.staff_type === 'admin') {
            return res.status(400).json({ message: "An administrator's contact info is edited from Access Management or their own Profile Settings." });
        }

        const [result] = await pool.query(
            'UPDATE staff SET full_name = ?, email = ?, phone = ?, staff_type = ?, position = ?, status = ? WHERE staff_id = ?',
            [full_name, email || null, phone, staff_type, position || null, status || 'active', id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Staff member not found.' });
        }

        res.json({ message: 'Staff member updated.' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to update staff member.', error: err.message });
    }
};

// Soft-delete (with undo) — same pattern as guests, since a guard/other
// staff record could plausibly get referenced elsewhere later and a hard
// DELETE has no upside over hiding + being able to bring it back.
const deleteStaff = async (req, res) => {
    const { id } = req.params;

    try {
        const [[existing]] = await pool.query('SELECT staff_type FROM staff WHERE staff_id = ? AND is_deleted = 0', [id]);
        if (!existing) {
            return res.status(404).json({ message: 'Staff member not found.' });
        }
        if (existing.staff_type === 'admin') {
            return res.status(400).json({ message: 'Delete the login from Access Management to remove an administrator.' });
        }

        await pool.query('UPDATE staff SET is_deleted = 1 WHERE staff_id = ?', [id]);
        res.json({ message: 'Staff member removed.' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to remove staff member.', error: err.message });
    }
};

const restoreStaff = async (req, res) => {
    const { id } = req.params;

    try {
        const [result] = await pool.query('UPDATE staff SET is_deleted = 0 WHERE staff_id = ? AND is_deleted = 1', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Staff member not found.' });
        }
        res.json({ message: 'Staff member restored.' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to restore staff member.', error: err.message });
    }
};

module.exports = { getStaff, createStaff, updateStaff, deleteStaff, restoreStaff };

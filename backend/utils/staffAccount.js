// Inserts a staff row. For guards/other staff, user_id is null (no login,
// pure HR record). For admins, this is called from userController.createUser
// with the freshly-created user_id, mirroring how createMemberAccount/
// createCoachAccount pair a login with its profile row in one transaction.
const createStaffRecord = async (connection, { user_id, full_name, email, phone, staff_type, position, status }) => {
    const [result] = await connection.query(
        'INSERT INTO staff (user_id, full_name, email, phone, staff_type, position, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [user_id || null, full_name, email || null, phone || null, staff_type, position || null, status || 'active']
    );
    return { staff_id: result.insertId };
};

module.exports = { createStaffRecord };

// Inserts the users + members rows that make up a member account, given an
// already-hashed password. Shared by direct admin creation (memberController)
// and the registration-approval cascade (paymentController), which gets the
// hash from the original registration_requests row instead of re-hashing.
const createMemberAccount = async (connection, { username, password_hash, full_name, email, phone, status }) => {
    const [userResult] = await connection.query(
        "INSERT INTO users (username, password_hash, role, status) VALUES (?, ?, 'member', 'active')",
        [username, password_hash]
    );

    const [memberResult] = await connection.query(
        'INSERT INTO members (user_id, full_name, email, phone, status) VALUES (?, ?, ?, ?, ?)',
        [userResult.insertId, full_name, email, phone, status || 'active']
    );

    return { user_id: userResult.insertId, member_id: memberResult.insertId };
};

module.exports = { createMemberAccount };

// Inserts the users + coaches rows that make up a coach account, given an
// already-hashed password. Shared by direct admin creation (coachController)
// and the manual-payment registration cascade (manualPaymentController).
const createCoachAccount = async (connection, { username, password_hash, full_name, email, phone, specialization, experience_years, status }) => {
    const [userResult] = await connection.query(
        "INSERT INTO users (username, password_hash, role, status) VALUES (?, ?, 'coach', 'active')",
        [username, password_hash]
    );

    const [coachResult] = await connection.query(
        `INSERT INTO coaches (user_id, full_name, email, phone, specialization, experience_years, status)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [userResult.insertId, full_name, email, phone, specialization || null, experience_years || 0, status || 'active']
    );

    return { user_id: userResult.insertId, coach_id: coachResult.insertId };
};

module.exports = { createCoachAccount };

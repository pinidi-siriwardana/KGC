const { withTransaction } = require('../config/db');
const { hashPassword, comparePassword } = require('./password');

// Shared by memberPortalController/coachPortalController's self-service
// "update my profile" — both roles have the exact same two-table shape
// (username/password on `users`, email/phone on their own role table keyed
// by the same user_id), so this is parameterized by table name only.
const updateSelfProfile = async ({ userId, table, username, email, phone, currentPassword, newPassword }) => {
    await withTransaction(async (connection) => {
        const userFields = [];
        const userValues = [];

        if (username !== undefined) {
            userFields.push('username = ?');
            userValues.push(username);
        }

        if (newPassword !== undefined) {
            const [[user]] = await connection.query('SELECT password_hash FROM users WHERE user_id = ? FOR UPDATE', [userId]);
            const matches = await comparePassword(currentPassword, user.password_hash);
            if (!matches) {
                const err = new Error('Current password is incorrect.');
                err.statusCode = 400;
                throw err;
            }
            userFields.push('password_hash = ?');
            userValues.push(await hashPassword(newPassword));
        }

        if (userFields.length > 0) {
            await connection.query(`UPDATE users SET ${userFields.join(', ')} WHERE user_id = ?`, [...userValues, userId]);
        }

        const profileFields = [];
        const profileValues = [];
        if (email !== undefined) { profileFields.push('email = ?'); profileValues.push(email); }
        if (phone !== undefined) { profileFields.push('phone = ?'); profileValues.push(phone); }

        if (profileFields.length > 0) {
            await connection.query(`UPDATE ${table} SET ${profileFields.join(', ')} WHERE user_id = ?`, [...profileValues, userId]);
        }
    });
};

module.exports = { updateSelfProfile };

const pool = require('../config/db');

// Both ALTERs are additive and safe to re-run: if a previous boot already
// applied them, MySQL errors with "duplicate column"/"duplicate key name"
// and we just swallow that, same self-healing convention already used by
// the CREATE TABLE IF NOT EXISTS guards in inquiryController/announcementController.
const ignoreIfAlreadyApplied = (err) => {
    if (['ER_DUP_FIELDNAME', 'ER_DUP_KEYNAME', 'ER_FK_DUP_NAME'].includes(err.code)) return;
    throw err;
};

// guests.is_deleted: lets guest profiles be soft-deleted (with undo) instead
// of hard DELETE, which used to fail with a raw FK error for any guest who
// had ever made a court booking.
const ensureGuestsSchema = async () => {
    try {
        await pool.query('ALTER TABLE guests ADD COLUMN is_deleted TINYINT(1) NOT NULL DEFAULT 0');
    } catch (err) {
        ignoreIfAlreadyApplied(err);
    }
};

// payments.membership_id: links a payment to the exact membership row it
// paid for, so editing/assigning a plan later can update the matching
// payment in place instead of guessing which row to touch.
const ensurePaymentsSchema = async () => {
    try {
        await pool.query(
            `ALTER TABLE payments
             ADD COLUMN membership_id INT(11) DEFAULT NULL,
             ADD CONSTRAINT fk_pay_membership FOREIGN KEY (membership_id) REFERENCES memberships (membership_id) ON DELETE SET NULL`
        );
    } catch (err) {
        ignoreIfAlreadyApplied(err);
    }
};

// staff: HR-style directory for personnel who aren't members/coaches —
// admins (linked to their login via user_id), plus guards/other staff who
// have no system login at all (user_id stays NULL for those). Brand new
// table, so a plain CREATE TABLE IF NOT EXISTS is enough — no ALTER needed.
const ensureStaffSchema = async () => {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS staff (
            staff_id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NULL,
            full_name VARCHAR(100) NOT NULL,
            email VARCHAR(100) NULL,
            phone VARCHAR(20) NULL,
            staff_type ENUM('admin', 'guard', 'other') NOT NULL DEFAULT 'other',
            position VARCHAR(100) NULL,
            status ENUM('active', 'inactive', 'suspended') NOT NULL DEFAULT 'active',
            is_deleted TINYINT(1) NOT NULL DEFAULT 0,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY unique_staff_user (user_id),
            CONSTRAINT fk_staff_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
        )
    `);
};

// Admins created before the Staff Directory existed have no `staff` row —
// without this, their own Profile Settings' email/phone update would
// silently no-op (UPDATE ... WHERE user_id = ? affects zero rows) since
// there'd be nothing to update. Backfilling a baseline row (username as a
// placeholder name, contact fields left blank) means every admin can
// immediately edit their contact info, same as members/coaches always could.
const backfillAdminStaffRecords = async () => {
    await pool.query(`
        INSERT INTO staff (user_id, full_name, staff_type, status)
        SELECT u.user_id, u.username, 'admin', 'active'
        FROM users u
        LEFT JOIN staff s ON s.user_id = u.user_id
        WHERE u.role = 'admin' AND s.staff_id IS NULL
    `);
};

// coaches.photo_url: lets an admin attach a profile photo, shown on the
// public home page's coach section instead of the old hardcoded images.
const ensureCoachesSchema = async () => {
    try {
        await pool.query('ALTER TABLE coaches ADD COLUMN photo_url VARCHAR(255) DEFAULT NULL');
    } catch (err) {
        ignoreIfAlreadyApplied(err);
    }
};

const ensureSchema = async () => {
    await ensureGuestsSchema();
    await ensurePaymentsSchema();
    await ensureStaffSchema();
    await backfillAdminStaffRecords();
    await ensureCoachesSchema();
};

module.exports = { ensureSchema };

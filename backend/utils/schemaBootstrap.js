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

const ensureSchema = async () => {
    await ensureGuestsSchema();
    await ensurePaymentsSchema();
};

module.exports = { ensureSchema };

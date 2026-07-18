const pool = require('../config/db');

// Both ALTERs are additive and safe to re-run: if a previous boot already
// applied them, MySQL errors with "duplicate column"/"duplicate key name"
// and we just swallow that, same self-healing convention already used by
// the CREATE TABLE IF NOT EXISTS guards in inquiryController/announcementController.
const ignoreIfAlreadyApplied = (err) => {
    if (['ER_DUP_FIELDNAME', 'ER_DUP_KEYNAME', 'ER_FK_DUP_NAME'].includes(err.code)) return;
    throw err;
};

// guests.status: replaces is_deleted (see retireGuestSoftDelete below) — the
// admin dashboard no longer deletes any directory record (member/coach/
// staff/guest); every one of them is deactivated via a status column
// instead, so nobody can remove real data (booking/payment history) from
// the database through the UI. 'inactive' plays the same "hide/deprioritize
// without losing history" role is_deleted used to.
const ensureGuestsSchema = async () => {
    try {
        await pool.query("ALTER TABLE guests ADD COLUMN status ENUM('active', 'inactive') NOT NULL DEFAULT 'active'");
    } catch (err) {
        ignoreIfAlreadyApplied(err);
    }
};

// One-time migration for installs where `guests` still has is_deleted:
// carry forward whatever was already soft-deleted as status='inactive' (so
// nothing that was previously hidden suddenly reappears as active), then
// drop the column. Both steps are no-ops on any install past its first run.
const retireGuestSoftDelete = async () => {
    try {
        await pool.query("UPDATE guests SET status = 'inactive' WHERE is_deleted = 1");
    } catch (err) {
        if (err.code !== 'ER_BAD_FIELD_ERROR') throw err;
        return; // column already dropped (or never existed) — nothing to migrate
    }

    try {
        await pool.query('ALTER TABLE guests DROP COLUMN is_deleted');
    } catch (err) {
        if (err.code !== 'ER_CANT_DROP_FIELD_OR_KEY' && err.code !== 'ER_BAD_FIELD_ERROR') throw err;
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
// staff.is_deleted was retired (see retireStaffSoftDelete below) — the admin
// dashboard has no delete for staff at all now (status is the only way to
// deactivate one), so there was nothing left for is_deleted to do.
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
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY unique_staff_user (user_id),
            CONSTRAINT fk_staff_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
        )
    `);
};

// One-time migration for installs where `staff` was created back when it
// still had is_deleted: purge whatever a previous soft-delete already
// marked gone (those rows were already presented to admins as "removed" —
// leaving them in place would resurrect them the moment the column-based
// filter disappears from staffController), then drop the column. Both
// steps are no-ops on any install past its first run after this change.
const retireStaffSoftDelete = async () => {
    try {
        await pool.query('DELETE FROM staff WHERE is_deleted = 1');
    } catch (err) {
        if (err.code !== 'ER_BAD_FIELD_ERROR') throw err;
        return; // column already dropped (or never existed) — nothing to purge
    }

    try {
        await pool.query('ALTER TABLE staff DROP COLUMN is_deleted');
    } catch (err) {
        if (err.code !== 'ER_CANT_DROP_FIELD_OR_KEY' && err.code !== 'ER_BAD_FIELD_ERROR') throw err;
    }
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

// courts.photo_url: lets an admin attach a real photo per court, shown in
// the public court gallery instead of the old hardcoded/fictional images.
const ensureCourtsSchema = async () => {
    try {
        await pool.query('ALTER TABLE courts ADD COLUMN photo_url VARCHAR(255) DEFAULT NULL');
    } catch (err) {
        ignoreIfAlreadyApplied(err);
    }
};

// courts.status ('available'/'maintenance') was retired — maintenance is
// scheduled per date+slot now (bookings.booking_type = 'maintenance', see
// createMaintenanceBlock), not toggled whole-court-indefinitely. Every court
// availability check now looks at is_active alone. One-time, idempotent:
// no-op on any install past its first run after this change.
const retireCourtStatus = async () => {
    try {
        await pool.query('ALTER TABLE courts DROP COLUMN status');
    } catch (err) {
        if (err.code !== 'ER_CANT_DROP_FIELD_OR_KEY' && err.code !== 'ER_BAD_FIELD_ERROR') throw err;
    }
};

// club_settings is a generic key-value store (already holds bank details and
// fee amounts) — these are the club-identity keys the public site's
// Contact/footer sections read, seeded once so the new admin Club Settings
// page and the public pages always agree on the same values instead of each
// hardcoding its own copy. INSERT IGNORE: never overwrites a value an admin
// has already customized via the settings page.
const ensureClubIdentitySettings = async () => {
    const defaults = {
        club_address: 'Peradeniya Road, Kandy, Sri Lanka',
        club_email: 'hello@kandygardenclub.lk',
        club_phone: '+94 (81) 222-3333',
        club_opening_hours: 'Mon – Sun: 08:00 – 20:00',
        club_facebook_url: '',
        club_instagram_url: '',
        club_twitter_url: '',
    };

    await Promise.all(Object.entries(defaults).map(([key, value]) =>
        pool.query('INSERT IGNORE INTO club_settings (setting_key, setting_value) VALUES (?, ?)', [key, value])
    ));
};

// bookings.unique_court_slot used to be a raw UNIQUE(court_id, booking_date,
// slot_id) — blind to status, which is exactly why createBooking/
// createGuestLock used to overwrite (reuse) a cancelled/rejected row's
// booking_id instead of inserting a fresh one for the next person who took
// that same slot. That reuse is what let one booking_id silently end up
// representing two unrelated people's bookings over time, corrupting
// whichever payments (cancellation/no-show/booking fees) were already
// recorded against the earlier one. Replacing it with a UNIQUE index on a
// generated column that's only non-NULL while the row is still
// pending/confirmed keeps the same "can't double-book this slot" guarantee,
// but scoped to *active* rows only — MySQL/MariaDB never treat two NULLs as
// a duplicate, so a cancelled/rejected row's slot becomes free again without
// its own row (and its payment history) ever being touched. A new booking
// for that slot now always gets its own new booking_id.
const ensureBookingsSchema = async () => {
    try {
        await pool.query(`
            ALTER TABLE bookings
            ADD COLUMN active_slot_key VARCHAR(40)
                GENERATED ALWAYS AS (CASE WHEN status IN ('pending', 'confirmed') THEN CONCAT(court_id, '-', booking_date, '-', slot_id) END) VIRTUAL
        `);
    } catch (err) {
        ignoreIfAlreadyApplied(err);
    }

    try {
        await pool.query('ALTER TABLE bookings DROP INDEX unique_court_slot');
    } catch (err) {
        if (err.code !== 'ER_CANT_DROP_FIELD_OR_KEY') throw err;
    }

    try {
        await pool.query('ALTER TABLE bookings ADD INDEX idx_court_date_slot (court_id, booking_date, slot_id)');
    } catch (err) {
        ignoreIfAlreadyApplied(err);
    }

    try {
        await pool.query('ALTER TABLE bookings ADD UNIQUE KEY unique_active_court_slot (active_slot_key)');
    } catch (err) {
        ignoreIfAlreadyApplied(err);
    }

    // lock_token: a possession secret handed back to whoever creates a guest
    // lock, and required by submitGuestPayment before it'll accept a
    // receipt against that booking — closes an unauthenticated hijack where
    // anyone who can guess/enumerate a booking_id could submit a payment
    // against a stranger's in-progress lock.
    try {
        await pool.query('ALTER TABLE bookings ADD COLUMN lock_token VARCHAR(64) DEFAULT NULL');
    } catch (err) {
        ignoreIfAlreadyApplied(err);
    }

    // booking_type = 'maintenance': an admin-scheduled block on a specific
    // court+date+slot, e.g. resurfacing or repairs. Reuses the exact same
    // occupancy machinery real bookings use (status='confirmed' + the
    // active_slot_key/unique_active_court_slot guard above), so a
    // maintenance block shows in every booking grid and blocks/gets blocked
    // by a real booking through the same mechanism — no separate table, no
    // separate conflict-checking code. MODIFY COLUMN is naturally idempotent
    // (re-running it against the same enum is a no-op), so this needs no
    // try/catch guard like the ADD COLUMN statements above.
    await pool.query("ALTER TABLE bookings MODIFY COLUMN booking_type ENUM('member', 'guest', 'coach', 'maintenance') NOT NULL");
};

// registration_requests.created_user_id: a stable back-reference to the
// account approveRegistration created, so undoRegistration can find (and
// remove) it directly instead of re-matching the request's original
// username against users.username — a match that silently breaks the
// moment that username is edited via Access Management.
const ensureRegistrationRequestsSchema = async () => {
    try {
        await pool.query(
            `ALTER TABLE registration_requests
             ADD COLUMN created_user_id INT(11) DEFAULT NULL,
             ADD CONSTRAINT fk_reg_created_user FOREIGN KEY (created_user_id) REFERENCES users (user_id) ON DELETE SET NULL`
        );
    } catch (err) {
        ignoreIfAlreadyApplied(err);
    }
};

// One-time, best-effort backfill for requests approved before the column
// above existed — matches on username (the same fragile method undo used
// to rely on), but only ever runs once per row: it only touches rows still
// NULL, so it can't undo a legitimate later username change once this has
// run.
const backfillRegistrationCreatedUser = async () => {
    await pool.query(`
        UPDATE registration_requests rr
        JOIN users u ON u.username = rr.username
        SET rr.created_user_id = u.user_id
        WHERE rr.status = 'approved' AND rr.created_user_id IS NULL
    `);
};

const ensureSchema = async () => {
    await ensureGuestsSchema();
    await retireGuestSoftDelete();
    await ensurePaymentsSchema();
    await ensureStaffSchema();
    await retireStaffSoftDelete();
    await backfillAdminStaffRecords();
    await ensureCoachesSchema();
    await ensureCourtsSchema();
    await retireCourtStatus();
    await ensureClubIdentitySettings();
    await ensureBookingsSchema();
    await ensureRegistrationRequestsSchema();
    await backfillRegistrationCreatedUser();
};

module.exports = { ensureSchema };

# Kandy Garden Club — Database Structure

Generated from the live schema (`SHOW CREATE TABLE`) rather than hand-maintained — this reflects exactly what's deployed, not what was originally designed. **17 tables**, MariaDB/MySQL, InnoDB, `utf8mb4`.

Two conventions worth knowing before reading the tables:

- **No migration framework.** Every column/table here was added by an idempotent statement in `backend/utils/schemaBootstrap.js`, run at every server boot. There's no separate migration history — the code *is* the history.
- **`dateStrings: true`** on the connection pool — `DATE`/`DATETIME`/`TIMESTAMP` columns come back as plain strings from queries, not JS `Date` objects, specifically to avoid timezone-shift bugs.

---

## Contents

1. [Access control & accounts](#1-access-control--accounts) — `users`, `members`, `coaches`, `staff`, `guests`
2. [Membership](#2-membership) — `membership_types`, `memberships`
3. [Courts & scheduling](#3-courts--scheduling) — `courts`, `time_slots`, `bookings`, `attendance`
4. [Money](#4-money) — `payment_verification`, `payments`
5. [Registration pipeline](#5-registration-pipeline) — `registration_requests`
6. [Public-site content](#6-public-site-content) — `contact_inquiries`, `announcements`
7. [Configuration](#7-configuration) — `club_settings`
8. [Entity relationship summary](#8-entity-relationship-summary)

---

## 1. Access control & accounts

### `users`
The login table — one row per account regardless of role. A role alone doesn't mean much; it must be paired with a matching row in `members`/`coaches`/`staff` to actually function in that role.

| Column | Type | Notes |
|---|---|---|
| `user_id` | `int` PK | |
| `username` | `varchar(50)` | unique |
| `password_hash` | `varchar(255)` | bcrypt |
| `role` | `enum('admin','member','coach')` | default `member` |
| `status` | `enum('active','pending','disabled')` | **login** status — separate from the profile-standing enums below |
| `created_at` | `timestamp` | |

### `members`
| Column | Type | Notes |
|---|---|---|
| `member_id` | `int` PK | |
| `user_id` | `int` | unique, FK → `users`, `ON DELETE CASCADE` |
| `full_name`, `email`, `phone` | | `email` unique |
| `status` | `enum('active','inactive','suspended')` | **membership standing** — not the login status |
| `created_at` | `timestamp` | |

### `coaches`
| Column | Type | Notes |
|---|---|---|
| `coach_id` | `int` PK | |
| `user_id` | `int` | unique, FK → `users`, `ON DELETE CASCADE` |
| `full_name`, `email`, `phone` | | `email` unique |
| `specialization` | `varchar(100)` | nullable |
| `experience_years` | `int` | default `0` |
| `status` | `enum('active','inactive','on-leave')` | ⚠️ a **different** enum than `members.status` — no `'suspended'` here, `'on-leave'` instead |
| `photo_url` | `varchar(255)` | public home-page profile photo |
| `created_at` | `timestamp` | |

### `staff`
HR-style directory for people who aren't members or coaches. Admins get a linked login (`user_id` set); guards/other staff typically don't (`user_id` stays `NULL` — pure record, no account).

| Column | Type | Notes |
|---|---|---|
| `staff_id` | `int` PK | |
| `user_id` | `int` | nullable, **unique**, FK → `users`, `ON DELETE CASCADE` |
| `full_name`, `email`, `phone` | | email/phone nullable (no-login staff may not need them) |
| `staff_type` | `enum('admin','guard','other')` | default `other` |
| `position` | `varchar(100)` | free text |
| `status` | `enum('active','inactive','suspended')` | |
| `created_at` | `timestamp` | |

There is no delete for staff (or any admin directory in this app — see the note on `courts.status` and the API doc) — `status` is the only way to deactivate one. `is_deleted` existed briefly for soft-delete but was retired once delete was removed entirely; `backend/utils/schemaBootstrap.js`'s `retireStaffSoftDelete()` purges anything a prior soft-delete had already marked gone, then drops the column.

### `guests`
Walk-in / non-member court users. No login at all.

| Column | Type | Notes |
|---|---|---|
| `guest_id` | `int` PK | |
| `full_name`, `phone` | | **not unique** — repeat guests are looked up and reused by phone at the application layer, not enforced by a DB constraint |
| `email` | `varchar(100)` | nullable |
| `status` | `enum('active','inactive')` | replaces the old `is_deleted` soft-delete flag — no delete anywhere in the admin dashboard, `status` is the only way to deactivate a guest. `active` is the only state a guest can be booked/matched against (`bookingController.js`'s guest lookups all filter `status = 'active'`). |
| `created_at` | `timestamp` | |

---

## 2. Membership

### `membership_types`
The admin-editable plan catalog (e.g. Junior/Senior).

| Column | Type | Notes |
|---|---|---|
| `membership_type_id` | `int` PK | |
| `name` | `varchar(100)` | |
| `duration_months` | `int` | |
| `price` | `decimal(10,2)` | |
| `created_at` | `timestamp` | |

### `memberships`
A specific member's purchased term. A member can have several rows over time (renewal history); "current" means the most recent by `start_date`/`membership_id`.

| Column | Type | Notes |
|---|---|---|
| `membership_id` | `int` PK | |
| `member_id` | `int` | FK → `members`, `ON DELETE CASCADE` |
| `membership_type_id` | `int` | FK → `membership_types` |
| `purchase_price` | `decimal(10,2)` | snapshot of the price paid — doesn't move if the plan's list price changes later |
| `start_date`, `end_date` | `date` | |
| `status` | `enum('active','expired')` | |

---

## 3. Courts & scheduling

### `courts`
| Column | Type | Notes |
|---|---|---|
| `court_id` | `int` PK | |
| `court_name` | `varchar(50)` | unique |
| `court_type` | `varchar(30)` | default `Clay` |
| `is_active` | `tinyint(1)` | default `1` — the only whole-court availability flag now |
| `photo_url` | `varchar(255)` | public court-gallery photo |
| `created_at` | `timestamp` | |

`courts.status` (`enum('available','maintenance')`) existed originally as a whole-court, indefinite-until-manually-reverted maintenance flag, toggled from the admin dashboard. It's been retired (`schemaBootstrap.js`'s `retireCourtStatus()` drops it) in favor of **time-boxed maintenance**: an admin schedules maintenance for a specific court + date + one or more `time_slots` by creating a `bookings` row with `booking_type = 'maintenance'` (see below) — it occupies exactly those slots via the same `unique_active_court_slot` mechanism a real booking uses, shows up in every booking grid as `maintenance` for just that window, and is undone the same way any booking is cancelled (`PATCH /api/bookings/:id`, `action: 'cancel'`). `is_active` is the only remaining whole-court switch, for a court taken out of service entirely — there's currently no admin UI to toggle it.

### `time_slots`
Fixed daily 1-hour blocks (currently 16, 06:00–22:00), shared by every court.

| Column | Type | Notes |
|---|---|---|
| `slot_id` | `int` PK | |
| `slot_name` | `varchar(50)` | e.g. `Slot 03 (08:00 - 09:00)` |
| `start_time`, `end_time` | `time` | |

### `bookings`
The busiest table in the schema — every court reservation, from every surface (guest/member/coach/admin), lands here.

| Column | Type | Notes |
|---|---|---|
| `booking_id` | `int` PK | |
| `court_id` | `int` | FK → `courts` |
| `slot_id` | `int` | FK → `time_slots` |
| `booking_date` | `date` | |
| `booking_type` | `enum('member','guest','coach','maintenance')` | `'maintenance'` is an admin-scheduled block on a court+date+slot (e.g. resurfacing), not a real reservation — see the note on `courts.status` above |
| `amount_charged` | `decimal(10,2)` | historical price snapshot; `0` for member/coach/maintenance bookings, non-zero for guest fees |
| `member_id` / `guest_id` / `coach_id` | `int` | nullable, exactly one set per row for `member`/`guest`/`coach`; **all three `NULL`** for `maintenance` |
| `status` | `enum('pending','confirmed','rejected','cancelled')` | `pending` = an unpaid guest hold (5-min window) |
| `lock_status` | `enum('locked','unlocked')` | admin-only flag — a `locked` booking can't be self-cancelled by the member/coach who made it |
| `lock_expires_at` | `datetime` | nullable — when a guest's payment hold expires; `NULL` once paid/confirmed |
| `active_slot_key` | `varchar(40)`, **generated (virtual)** | `court_id-booking_date-slot_id` **only while `status` is `pending`/`confirmed`**, else `NULL` |
| `lock_token` | `varchar(64)` | nullable — a random secret handed to whoever creates a guest hold, required back before a receipt can be submitted against it |
| `created_by_user_id` | `int` | FK → `users` |
| `created_at` | `timestamp` | |

**Keys worth knowing:**
- `UNIQUE KEY unique_active_court_slot (active_slot_key)` — this is the real "can't double-book a slot" guarantee. Because `active_slot_key` is `NULL` for any cancelled/rejected booking, MySQL never treats two `NULL`s as a duplicate — so a freed-up slot can be booked again by someone else *without reusing the old row*. (An earlier version of this schema used a plain `UNIQUE(court_id, booking_date, slot_id)` with no status awareness, which caused cancelled bookings' rows to get silently overwritten by the next person's booking — corrupting whichever payments were already recorded against the original. Fixed; this generated-column approach is the fix.)
- `KEY idx_court_date_slot` — a plain (non-unique) index kept alongside, purely so `SELECT ... FOR UPDATE` lookups on a court/date/slot stay fast and properly row-locked regardless of status.

### `attendance`
Check-in/check-out log, tied back to the specific booking it's for.

| Column | Type | Notes |
|---|---|---|
| `attendance_id` | `int` PK | |
| `booking_id` | `int` | nullable, FK → `bookings`, `ON DELETE SET NULL` |
| `member_id` / `coach_id` | `int` | nullable — whichever attended |
| `checkin_time` | `timestamp` | |
| `checkout_time` | `timestamp` | nullable — `NULL` while still "on court" |

Guests are deliberately excluded from this table — there's no `guest_id` column, since there's no account to charge a no-show fee to.

---

## 4. Money

### `payment_verification`
The pending-review queue: every receipt a member/coach/guest/applicant uploads lands here first, before an admin approves or rejects it. One row can represent very different things depending on which of `request_id` / `booking_id` / `settles_payment_id` is set.

| Column | Type | Notes |
|---|---|---|
| `verification_id` | `int` PK | |
| `request_id` | `int` | nullable, **unique**, FK → `registration_requests` — set only for a new-member application |
| `booking_id` | `int` | nullable, FK-less* — set only for a guest's court-booking payment |
| `member_id` / `coach_id` | `int` | nullable, FK → respective table — set for a self-service submission (renewal, donation, fee settlement) |
| `membership_type_id` | `int` | nullable, FK → `membership_types` — the plan being renewed |
| `settles_payment_id` | `int` | nullable, FK → `payments` — set when this receipt is meant to pay off a specific already-recorded fee (e.g. a cancellation/no-show charge), rather than create a new one |
| `payment_type` | `enum('registration','booking','membership_renewal','donation','tournament_fee','cancellation_fee','no_show_fee','other')` | every value here reliably produces (or updates) a `payments` row on approval — `backend/controllers/paymentVerificationController.js`'s `reviewVerification` dispatches each to its own handler (`approveRegistration`/`approveMembershipRenewal`/`approveGuestBooking`/`approveFeeSettlement` when `settles_payment_id` is set, else `approveMemberPayment` for everything else) |
| `receipt_file_url` | `varchar(255)` | path under `/uploads/slips/` |
| `amount_declared` | `decimal(10,2)` | what the submitter claims they paid |
| `status` | `enum('pending','approved','rejected')` | |
| `submitted_at`, `reviewed_by`, `reviewed_at` | | |
| `remarks` | `text` | admin's review note |
| `note` | `varchar(255)` | submitter's own note (e.g. "paid via bank transfer") |

<sub>*`booking_id` has no FK constraint — deliberately, so a booking row further along the reuse lifecycle can't block deleting/altering this table's history.</sub>

### `payments`
The actual ledger — money that's been charged, waived, or is outstanding. This is what revenue reports query.

| Column | Type | Notes |
|---|---|---|
| `payment_id` | `int` PK | |
| `amount` | `decimal(10,2)` | |
| `payment_date` | `timestamp` | |
| `payment_type` | `enum('membership','booking_fee','coach_registration','other','cancellation_fee','donation','tournament_fee','no_show_fee')` | |
| `member_id` / `coach_id` | `int` | nullable, `ON DELETE SET NULL` |
| `booking_id` | `int` | nullable, FK → `bookings`, `ON DELETE SET NULL` |
| `membership_id` | `int` | nullable, FK → `memberships`, `ON DELETE SET NULL` — links a payment to the exact term it paid for, so a later plan correction updates this row instead of inserting a duplicate |
| `verification_id` | `int` | nullable, FK → `payment_verification`, `ON DELETE SET NULL` — links back to the receipt that created/settled this entry, if any |
| `handled_by` | `int` **NOT NULL** | FK → `users` — which admin account is responsible (a real admin for manual entries, the oldest active admin for automated charges like no-show fees) |
| `status` | `enum('completed','recorded','failed','refunded','waived')` | `recorded` = charged but not yet paid (an outstanding fee); `completed` = paid; `waived` = forgiven |
| `notes` | `varchar(255)` | free text |

---

## 5. Registration pipeline

### `registration_requests`
A prospective member's public sign-up application, before any account exists.

| Column | Type | Notes |
|---|---|---|
| `request_id` | `int` PK | |
| `full_name`, `email` (unique), `phone` | | |
| `username` (unique), `password_hash` | | pre-hashed at submission — the real account is created verbatim from these on approval |
| `status` | `enum('pending','approved','rejected')` | |
| `submitted_at`, `reviewed_by`, `reviewed_at` | | |
| `membership_type_id` | `int` | nullable, FK → `membership_types` — plan requested |
| `created_user_id` | `int` | nullable, FK → `users`, `ON DELETE SET NULL` — set once, at approval, so a later "undo approval" can find and remove the exact account it created even if that account's `username` gets changed afterward |

---

## 6. Public-site content

### `contact_inquiries`
Submissions from the public contact form.

| Column | Type | Notes |
|---|---|---|
| `inquiry_id` | `int` PK | |
| `full_name`, `email`, `phone` | | phone nullable |
| `message` | `text` | |
| `status` | `enum('unread','read','replied')` | |
| `reply_message`, `replied_at` | | set when an admin replies (sends a real email via `nodemailer`) |
| `is_deleted` | `tinyint(1)` | soft-delete |
| `created_at` | `datetime` | |

### `announcements`
Admin-published news shown on the public Updates page.

| Column | Type | Notes |
|---|---|---|
| `announcement_id` | `int` PK | |
| `title`, `content` | | |
| `category` | `varchar(100)` | default `GENERAL` |
| `publish_at` | `datetime` | nullable — supports scheduling a post for the future |
| `is_deleted` | `tinyint(1)` | soft-delete |
| `created_at`, `updated_at` | | |

---

## 7. Configuration

### `club_settings`
A generic key/value store — deliberately schema-less so new settings never need a migration.

| Column | Type | Notes |
|---|---|---|
| `setting_key` | `varchar(50)` PK | |
| `setting_value` | `varchar(255)` | always stored as a string, parsed by whichever code reads it |
| `updated_at` | `timestamp` | |

Keys currently in use: `cancellation_fee`, `guest_booking_fee`, `no_show_fee` (numeric, validated), `bank_name`, `account_name`, `account_number`, `branch`, `payment_instructions` (bank-transfer details shown to payers), and `club_address`, `club_email`, `club_phone`, `club_opening_hours`, `club_facebook_url`, `club_instagram_url`, `club_twitter_url` (public contact info, editable from the admin Club Settings page).

---

## 8. Entity relationship summary

```
users ──┬── members ──── memberships ──── membership_types
        ├── coaches                             │
        └── staff                               │
                                                 │
courts ──┐                                      │
time_slots ┴── bookings ──┬── attendance         │
                           │                     │
guests ────────────────────┘                     │
                                                  │
registration_requests ── payment_verification ── payments
                                   │                 │
                    (settles_payment_id ────────────┘  — a receipt paying off
                     an existing outstanding fee)

contact_inquiries, announcements, club_settings — standalone, no FKs in/out
```

**Not a real table:** an earlier design considered a `booking_participants` join table (for bookings with more than one attendee) — it was never actually created in the live database. `attendance` handles multi-person sessions today by allowing multiple rows against the same `booking_id`.

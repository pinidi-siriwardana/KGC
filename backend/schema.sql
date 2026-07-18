-- Kandy Garden Club — base database schema + reference-data seed.
--
-- Generated from the live schema (`SHOW CREATE TABLE`) and cross-checked
-- against DB.md — this is the actual DDL, not a hand-transcription of it.
-- Tables are ordered so every foreign key already points at something that
-- exists by the time it's declared, except `payments` <-> `payment_verification`,
-- which reference each other; that one circular FK is added with an ALTER
-- at the end once both tables exist.
--
-- Run this once against a fresh, empty database:
--   mysql -u <user> -p <database_name> < schema.sql
--
-- After this, `node server.js` handles everything else: `schemaBootstrap.js`
-- runs its additive checks on every boot, but every column/index/table it
-- would otherwise add already exists here, so they're all no-ops.
--
-- This does NOT create a login account. See the README's "First login"
-- section for creating the first admin user by hand.

SET FOREIGN_KEY_CHECKS = 0;
SET NAMES utf8mb4;

-- ---------------------------------------------------------------------------
-- 1. Access control & accounts
-- ---------------------------------------------------------------------------

CREATE TABLE `users` (
  `user_id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('admin','member','coach') NOT NULL DEFAULT 'member',
  `status` enum('active','pending','disabled') DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `membership_types` (
  `membership_type_id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `duration_months` int(11) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`membership_type_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `courts` (
  `court_id` int(11) NOT NULL AUTO_INCREMENT,
  `court_name` varchar(50) NOT NULL,
  `court_type` varchar(30) DEFAULT 'Clay',
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `photo_url` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`court_id`),
  UNIQUE KEY `court_name` (`court_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `time_slots` (
  `slot_id` int(11) NOT NULL AUTO_INCREMENT,
  `slot_name` varchar(50) NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  PRIMARY KEY (`slot_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `members` (
  `member_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `status` enum('active','inactive','suspended') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`member_id`),
  UNIQUE KEY `user_id` (`user_id`),
  UNIQUE KEY `email` (`email`),
  CONSTRAINT `fk_member_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `coaches` (
  `coach_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `specialization` varchar(100) DEFAULT NULL,
  `experience_years` int(11) DEFAULT 0,
  `status` enum('active','inactive','on-leave') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `photo_url` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`coach_id`),
  UNIQUE KEY `user_id` (`user_id`),
  UNIQUE KEY `email` (`email`),
  CONSTRAINT `fk_coach_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `staff` (
  `staff_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `full_name` varchar(100) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `staff_type` enum('admin','guard','other') NOT NULL DEFAULT 'other',
  `position` varchar(100) DEFAULT NULL,
  `status` enum('active','inactive','suspended') NOT NULL DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`staff_id`),
  UNIQUE KEY `unique_staff_user` (`user_id`),
  CONSTRAINT `fk_staff_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `guests` (
  `guest_id` int(11) NOT NULL AUTO_INCREMENT,
  `full_name` varchar(100) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  PRIMARY KEY (`guest_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ---------------------------------------------------------------------------
-- 2. Membership
-- ---------------------------------------------------------------------------

CREATE TABLE `memberships` (
  `membership_id` int(11) NOT NULL AUTO_INCREMENT,
  `member_id` int(11) NOT NULL,
  `membership_type_id` int(11) NOT NULL,
  `purchase_price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `status` enum('active','expired') DEFAULT 'active',
  PRIMARY KEY (`membership_id`),
  KEY `membership_type_id` (`membership_type_id`),
  KEY `member_id` (`member_id`),
  CONSTRAINT `fk_mem_member` FOREIGN KEY (`member_id`) REFERENCES `members` (`member_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_mem_type` FOREIGN KEY (`membership_type_id`) REFERENCES `membership_types` (`membership_type_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ---------------------------------------------------------------------------
-- 5. Registration pipeline (created before bookings/payments — both
--    payment_verification and bookings/payments reference it or users)
-- ---------------------------------------------------------------------------

CREATE TABLE `registration_requests` (
  `request_id` int(11) NOT NULL AUTO_INCREMENT,
  `full_name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `submitted_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `reviewed_by` int(11) DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `membership_type_id` int(11) DEFAULT NULL,
  `created_user_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`request_id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `username` (`username`),
  KEY `reviewed_by` (`reviewed_by`),
  KEY `membership_type_id` (`membership_type_id`),
  KEY `fk_reg_created_user` (`created_user_id`),
  CONSTRAINT `fk_reg_created_user` FOREIGN KEY (`created_user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_reg_reviewer` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_reg_type` FOREIGN KEY (`membership_type_id`) REFERENCES `membership_types` (`membership_type_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ---------------------------------------------------------------------------
-- 3. Courts & scheduling
-- ---------------------------------------------------------------------------

CREATE TABLE `bookings` (
  `booking_id` int(11) NOT NULL AUTO_INCREMENT,
  `court_id` int(11) NOT NULL,
  `slot_id` int(11) NOT NULL,
  `booking_date` date NOT NULL,
  `booking_type` enum('member','guest','coach','maintenance') NOT NULL,
  `amount_charged` decimal(10,2) NOT NULL DEFAULT 0.00,
  `member_id` int(11) DEFAULT NULL,
  `guest_id` int(11) DEFAULT NULL,
  `coach_id` int(11) DEFAULT NULL,
  `status` enum('pending','confirmed','rejected','cancelled') DEFAULT 'pending',
  `lock_status` enum('locked','unlocked') DEFAULT 'unlocked',
  `lock_expires_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `created_by_user_id` int(11) DEFAULT NULL,
  `active_slot_key` varchar(40) GENERATED ALWAYS AS (case when `status` in ('pending','confirmed') then concat(`court_id`,'-',`booking_date`,'-',`slot_id`) end) VIRTUAL,
  `lock_token` varchar(64) DEFAULT NULL,
  PRIMARY KEY (`booking_id`),
  UNIQUE KEY `unique_active_court_slot` (`active_slot_key`),
  KEY `court_id` (`court_id`),
  KEY `slot_id` (`slot_id`),
  KEY `created_by_user_id` (`created_by_user_id`),
  KEY `member_id` (`member_id`),
  KEY `guest_id` (`guest_id`),
  KEY `coach_id` (`coach_id`),
  KEY `idx_court_date_slot` (`court_id`,`booking_date`,`slot_id`),
  CONSTRAINT `fk_booking_coach` FOREIGN KEY (`coach_id`) REFERENCES `coaches` (`coach_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_booking_court` FOREIGN KEY (`court_id`) REFERENCES `courts` (`court_id`),
  CONSTRAINT `fk_booking_creator` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `fk_booking_guest` FOREIGN KEY (`guest_id`) REFERENCES `guests` (`guest_id`),
  CONSTRAINT `fk_booking_member` FOREIGN KEY (`member_id`) REFERENCES `members` (`member_id`),
  CONSTRAINT `fk_booking_slot` FOREIGN KEY (`slot_id`) REFERENCES `time_slots` (`slot_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `attendance` (
  `attendance_id` int(11) NOT NULL AUTO_INCREMENT,
  `booking_id` int(11) DEFAULT NULL,
  `member_id` int(11) DEFAULT NULL,
  `coach_id` int(11) DEFAULT NULL,
  `checkin_time` timestamp NOT NULL DEFAULT current_timestamp(),
  `checkout_time` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`attendance_id`),
  KEY `member_id` (`member_id`),
  KEY `coach_id` (`coach_id`),
  KEY `booking_id` (`booking_id`),
  CONSTRAINT `fk_att_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`booking_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_att_coach` FOREIGN KEY (`coach_id`) REFERENCES `coaches` (`coach_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_att_member` FOREIGN KEY (`member_id`) REFERENCES `members` (`member_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ---------------------------------------------------------------------------
-- 4. Money — payment_verification and payments reference each other
--    (payment_verification.settles_payment_id <-> payments.verification_id),
--    so payment_verification is created first WITHOUT that one FK, payments
--    is created next (both other FK targets already exist by then), and the
--    circular constraint is added last via ALTER TABLE.
-- ---------------------------------------------------------------------------

CREATE TABLE `payment_verification` (
  `verification_id` int(11) NOT NULL AUTO_INCREMENT,
  `request_id` int(11) DEFAULT NULL,
  `booking_id` int(11) DEFAULT NULL,
  `member_id` int(11) DEFAULT NULL,
  `coach_id` int(11) DEFAULT NULL,
  `membership_type_id` int(11) DEFAULT NULL,
  `settles_payment_id` int(11) DEFAULT NULL,
  `payment_type` enum('registration','booking','membership_renewal','donation','tournament_fee','cancellation_fee','no_show_fee','other') NOT NULL DEFAULT 'registration',
  `receipt_file_url` varchar(255) NOT NULL,
  `amount_declared` decimal(10,2) DEFAULT 0.00,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `submitted_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `reviewed_by` int(11) DEFAULT NULL,
  `reviewed_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `remarks` text DEFAULT NULL,
  `note` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`verification_id`),
  UNIQUE KEY `request_id` (`request_id`),
  KEY `booking_id` (`booking_id`),
  KEY `reviewed_by` (`reviewed_by`),
  KEY `fk_ver_member` (`member_id`),
  KEY `fk_ver_plan` (`membership_type_id`),
  KEY `fk_ver_coach` (`coach_id`),
  KEY `fk_ver_settles` (`settles_payment_id`),
  CONSTRAINT `fk_ver_coach` FOREIGN KEY (`coach_id`) REFERENCES `coaches` (`coach_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_ver_member` FOREIGN KEY (`member_id`) REFERENCES `members` (`member_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_ver_plan` FOREIGN KEY (`membership_type_id`) REFERENCES `membership_types` (`membership_type_id`),
  CONSTRAINT `fk_ver_request` FOREIGN KEY (`request_id`) REFERENCES `registration_requests` (`request_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ver_reviewer` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `payments` (
  `payment_id` int(11) NOT NULL AUTO_INCREMENT,
  `amount` decimal(10,2) NOT NULL,
  `payment_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `payment_type` enum('membership','booking_fee','coach_registration','other','cancellation_fee','donation','tournament_fee','no_show_fee') NOT NULL,
  `member_id` int(11) DEFAULT NULL,
  `coach_id` int(11) DEFAULT NULL,
  `booking_id` int(11) DEFAULT NULL,
  `verification_id` int(11) DEFAULT NULL,
  `handled_by` int(11) NOT NULL,
  `status` enum('completed','recorded','failed','refunded','waived') DEFAULT 'completed',
  `notes` varchar(255) DEFAULT NULL,
  `membership_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`payment_id`),
  KEY `handled_by` (`handled_by`),
  KEY `member_id` (`member_id`),
  KEY `booking_id` (`booking_id`),
  KEY `verification_id` (`verification_id`),
  KEY `fk_pay_coach` (`coach_id`),
  KEY `fk_pay_membership` (`membership_id`),
  CONSTRAINT `fk_pay_admin` FOREIGN KEY (`handled_by`) REFERENCES `users` (`user_id`),
  CONSTRAINT `fk_pay_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`booking_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_pay_coach` FOREIGN KEY (`coach_id`) REFERENCES `coaches` (`coach_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_pay_member` FOREIGN KEY (`member_id`) REFERENCES `members` (`member_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_pay_membership` FOREIGN KEY (`membership_id`) REFERENCES `memberships` (`membership_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_payment_verification` FOREIGN KEY (`verification_id`) REFERENCES `payment_verification` (`verification_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

ALTER TABLE `payment_verification`
  ADD CONSTRAINT `fk_ver_settles` FOREIGN KEY (`settles_payment_id`) REFERENCES `payments` (`payment_id`) ON DELETE SET NULL;

-- ---------------------------------------------------------------------------
-- 6. Public-site content
-- ---------------------------------------------------------------------------

CREATE TABLE `contact_inquiries` (
  `inquiry_id` int(11) NOT NULL AUTO_INCREMENT,
  `full_name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `message` text NOT NULL,
  `status` enum('unread','read','replied') NOT NULL DEFAULT 'unread',
  `reply_message` text DEFAULT NULL,
  `replied_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`inquiry_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `announcements` (
  `announcement_id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `category` varchar(100) NOT NULL DEFAULT 'GENERAL',
  `content` text NOT NULL,
  `publish_at` datetime DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`announcement_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ---------------------------------------------------------------------------
-- 7. Configuration
-- ---------------------------------------------------------------------------

CREATE TABLE `club_settings` (
  `setting_key` varchar(50) NOT NULL,
  `setting_value` varchar(255) NOT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ---------------------------------------------------------------------------
-- Reference data — courts, time slots, membership plans, and club settings.
-- No real member/coach/booking/payment rows are included here on purpose:
-- that's per-deployment data, not schema. See the README's "First login"
-- section for creating the first admin account.
-- ---------------------------------------------------------------------------

INSERT INTO `courts` (`court_id`, `court_name`, `court_type`, `is_active`, `photo_url`) VALUES
  (1, 'Court 1', 'Clay', 1, '/uploads/courts/1784261742041-tennis-clay-court-500x500.jpeg'),
  (2, 'Court 2', 'Clay', 1, '/uploads/courts/1784261751031-R.jpeg'),
  (3, 'Court 3', 'Clay', 1, '/uploads/courts/1784261757584-pngtree-large-clay-tennis-court-without-people-win-outdoor-court-photo-image_33055674.jpg'),
  (4, 'Court 4', 'Clay', 1, '/uploads/courts/1784261763441-istockphoto-469686560-170667a.jpg');

INSERT INTO `time_slots` (`slot_id`, `slot_name`, `start_time`, `end_time`) VALUES
  (1, 'Slot 01 (06:00 - 07:00)', '06:00:00', '07:00:00'),
  (2, 'Slot 02 (07:00 - 08:00)', '07:00:00', '08:00:00'),
  (3, 'Slot 03 (08:00 - 09:00)', '08:00:00', '09:00:00'),
  (4, 'Slot 04 (09:00 - 10:00)', '09:00:00', '10:00:00'),
  (5, 'Slot 05 (10:00 - 11:00)', '10:00:00', '11:00:00'),
  (6, 'Slot 06 (11:00 - 12:00)', '11:00:00', '12:00:00'),
  (7, 'Slot 07 (12:00 - 13:00)', '12:00:00', '13:00:00'),
  (8, 'Slot 08 (13:00 - 14:00)', '13:00:00', '14:00:00'),
  (9, 'Slot 09 (14:00 - 15:00)', '14:00:00', '15:00:00'),
  (10, 'Slot 10 (15:00 - 16:00)', '15:00:00', '16:00:00'),
  (11, 'Slot 11 (16:00 - 17:00)', '16:00:00', '17:00:00'),
  (12, 'Slot 12 (17:00 - 18:00)', '17:00:00', '18:00:00'),
  (13, 'Slot 13 (18:00 - 19:00)', '18:00:00', '19:00:00'),
  (14, 'Slot 14 (19:00 - 20:00)', '19:00:00', '20:00:00'),
  (15, 'Slot 15 (20:00 - 21:00)', '20:00:00', '21:00:00'),
  (16, 'Slot 16 (21:00 - 22:00)', '21:00:00', '22:00:00');

INSERT INTO `membership_types` (`membership_type_id`, `name`, `duration_months`, `price`) VALUES
  (1, 'Junior Membership', 12, 7500.00),
  (2, 'Senior Membership', 12, 10000.00);

INSERT INTO `club_settings` (`setting_key`, `setting_value`) VALUES
  ('account_name', 'Kandy Garden Club'),
  ('account_number', '000-000-0000'),
  ('bank_name', 'Sample Bank'),
  ('branch', 'Kandy'),
  ('cancellation_fee', '200'),
  ('club_address', 'Peradeniya Road, Kandy, Sri Lanka'),
  ('club_email', 'hello@kandygardenclub.lk'),
  ('club_facebook_url', ''),
  ('club_instagram_url', ''),
  ('club_opening_hours', 'Mon – Sun: 08:00 – 22:00'),
  ('club_phone', '+94 (81) 222-3333'),
  ('club_twitter_url', ''),
  ('guest_booking_fee', '1500.00'),
  ('no_show_fee', '500.00'),
  ('payment_instructions', 'Transfer the amount to the account below, then upload your slip. Your payment will be reviewed by an admin within 1-2 business days.');

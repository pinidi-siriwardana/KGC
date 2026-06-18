SET SQL\_MODE \= "NO\_AUTO\_VALUE\_ON\_ZERO";  
START TRANSACTION;  
SET time\_zone \= "+00:00";

CREATE DATABASE IF NOT EXISTS \`kandy\_garden\_club\_db\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4\_general\_ci;  
USE \`kandy\_garden\_club\_db\`;

\-- \=========================================================================  
\-- MODULE 1: ACCESS CONTROL & USER ACCOUNTS  
\-- \=========================================================================

CREATE TABLE \`users\` (  
  \`user\_id\` INT(11) NOT NULL AUTO\_INCREMENT,  
  \`username\` VARCHAR(50) NOT NULL,  
  \`password\_hash\` VARCHAR(255) NOT NULL,  
  \`role\` ENUM('admin', 'member', 'coach') NOT NULL DEFAULT 'member',  
  \`status\` ENUM('active', 'pending', 'disabled') DEFAULT 'pending',  
  \`created\_at\` TIMESTAMP NOT NULL DEFAULT CURRENT\_TIMESTAMP(),  
  PRIMARY KEY (\`user\_id\`),  
  UNIQUE KEY \`username\` (\`username\`)  
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4\_general\_ci;

\-- Sample user table entries (sanitized placeholder data)  
INSERT INTO \`users\` (\`user\_id\`, \`username\`, \`password\_hash\`, \`role\`, \`status\`, \`created\_at\`) VALUES  
(3, 'sample\_coach1', '$2b$10$placeholderHashDoNotUseXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', 'coach', 'active', '2026-04-19 04:23:38'),  
(19, 'sample\_admin', '$2b$10$placeholderHashDoNotUseXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', 'admin', 'active', '2026-04-26 06:15:07'),  
(20, 'sample\_member1', '$2b$10$placeholderHashDoNotUseXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', 'member', 'active', '2026-04-26 06:16:44'),  
(21, 'sample\_coach2', '$2b$10$placeholderHashDoNotUseXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', 'coach', 'active', '2026-04-26 06:17:17'),  
(23, 'sample\_member2', '$2b$10$placeholderHashDoNotUseXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', 'member', 'pending', '2026-05-01 10:09:05'),  
(24, 'sample\_member3', '$2b$10$placeholderHashDoNotUseXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', 'member', 'pending', '2026-05-29 12:45:40');

\-- \=========================================================================  
\-- MODULE 2: SUBSCRIPTION TIERS & MASTER RULES  
\-- \=========================================================================

CREATE TABLE \`membership\_types\` (  
  \`membership\_type\_id\` INT(11) NOT NULL AUTO\_INCREMENT,  
  \`name\` VARCHAR(100) NOT NULL,  
  \`duration\_months\` INT(11) NOT NULL,  
  \`price\` DECIMAL(10,2) NOT NULL,  
  \`created\_at\` TIMESTAMP NOT NULL DEFAULT CURRENT\_TIMESTAMP(),  
  PRIMARY KEY (\`membership\_type\_id\`)  
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4\_general\_ci;

INSERT INTO \`membership\_types\` (\`membership\_type\_id\`, \`name\`, \`duration\_months\`, \`price\`, \`created\_at\`) VALUES  
(1, 'Junior Membership', 6, 7500.00, '2026-04-19 06:35:39'),  
(2, 'Senior Membership', 6, 10000.00, '2026-04-19 06:35:39');

CREATE TABLE \`time\_slots\` (  
  \`slot\_id\` INT(11) NOT NULL AUTO\_INCREMENT,  
  \`slot\_name\` VARCHAR(50) NOT NULL,  
  \`start\_time\` TIME NOT NULL,  
  \`end\_time\` TIME NOT NULL,  
  PRIMARY KEY (\`slot\_id\`)  
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4\_general\_ci;

CREATE TABLE \`courts\` (  
  \`court\_id\` INT(11) NOT NULL AUTO\_INCREMENT,  
  \`court\_name\` VARCHAR(50) NOT NULL,  
  \`court\_type\` VARCHAR(30) DEFAULT 'Clay',  
  \`status\` ENUM('available', 'maintenance') DEFAULT 'available',  
  \`is\_active\` TINYINT(1) DEFAULT 1,  
  \`created\_at\` TIMESTAMP NOT NULL DEFAULT CURRENT\_TIMESTAMP(),  
  PRIMARY KEY (\`court\_id\`),  
  UNIQUE KEY \`court\_name\` (\`court\_name\`)  
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4\_general\_ci;

INSERT INTO \`courts\` (\`court\_id\`, \`court\_name\`, \`court\_type\`, \`status\`, \`is\_active\`, \`created\_at\`) VALUES  
(1, 'Court 1', 'Clay', 'available', 1, '2026-04-17 14:40:23'),  
(2, 'Court 2', 'Clay', 'available', 1, '2026-04-17 14:40:23'),  
(3, 'Court 3', 'Clay', 'available', 1, '2026-04-17 14:40:23'),  
(4, 'Court 4', 'Clay', 'available', 1, '2026-04-17 14:40:23');

\-- \=========================================================================  
\-- MODULE 3: PROFILE REGISTRY (ACTORS)  
\-- \=========================================================================

CREATE TABLE \`members\` (  
  \`member\_id\` INT(11) NOT NULL AUTO\_INCREMENT,  
  \`user\_id\` INT(11) NOT NULL,  
  \`full\_name\` VARCHAR(255) NOT NULL,  
  \`email\` VARCHAR(255) NOT NULL,  
  \`phone\` VARCHAR(20) NOT NULL,  
  \`status\` ENUM('active', 'inactive', 'suspended') DEFAULT 'active',  
  \`created\_at\` TIMESTAMP NOT NULL DEFAULT CURRENT\_TIMESTAMP(),  
  PRIMARY KEY (\`member\_id\`),  
  UNIQUE KEY \`user\_id\` (\`user\_id\`),  
  UNIQUE KEY \`email\` (\`email\`),  
  CONSTRAINT \`fk\_member\_user\` FOREIGN KEY (\`user\_id\`) REFERENCES \`users\` (\`user\_id\`) ON DELETE CASCADE  
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4\_general\_ci;

INSERT INTO \`members\` (\`member\_id\`, \`user\_id\`, \`full\_name\`, \`email\`, \`phone\`, \`status\`, \`created\_at\`) VALUES  
(9, 23, 'Jane Doe', 'jane.doe@example.com', '0760000001', 'active', '2026-05-01 10:09:05'),  
(10, 24, 'John Smith', 'john.smith@example.com', '0760000002', 'active', '2026-05-29 12:45:40');

CREATE TABLE \`coaches\` (  
  \`coach\_id\` INT(11) NOT NULL AUTO\_INCREMENT,  
  \`user\_id\` INT(11) NOT NULL,  
  \`full\_name\` VARCHAR(100) NOT NULL,  
  \`email\` VARCHAR(100) NOT NULL,  
  \`phone\` VARCHAR(20) NOT NULL,  
  \`specialization\` VARCHAR(100) DEFAULT NULL,  
  \`experience\_years\` INT(11) DEFAULT 0,  
  \`status\` ENUM('active', 'inactive', 'on-leave') DEFAULT 'active',  
  \`created\_at\` TIMESTAMP NOT NULL DEFAULT CURRENT\_TIMESTAMP(),  
  PRIMARY KEY (\`coach\_id\`),  
  UNIQUE KEY \`user\_id\` (\`user\_id\`),  
  UNIQUE KEY \`email\` (\`email\`),  
  CONSTRAINT \`fk\_coach\_user\` FOREIGN KEY (\`user\_id\`) REFERENCES \`users\` (\`user\_id\`) ON DELETE CASCADE  
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4\_general\_ci;

INSERT INTO \`coaches\` (\`coach\_id\`, \`user\_id\`, \`full\_name\`, \`email\`, \`phone\`, \`specialization\`, \`experience\_years\`, \`status\`, \`created\_at\`) VALUES  
(1, 3, 'Sample Coach', 'coach1@example.com', '+94770000000', 'Advanced Clay Court Tactics', 12, 'on-leave', '2026-04-19 04:23:38');

CREATE TABLE \`guests\` (  
  \`guest\_id\` INT(11) NOT NULL AUTO\_INCREMENT,  
  \`full\_name\` VARCHAR(100) NOT NULL,  
  \`phone\` VARCHAR(20) NOT NULL, \-- Dropped UNIQUE to allow repeating customers  
  \`email\` VARCHAR(100) DEFAULT NULL, \-- Dropped UNIQUE  
  \`created\_at\` TIMESTAMP NOT NULL DEFAULT CURRENT\_TIMESTAMP(),  
  PRIMARY KEY (\`guest\_id\`)  
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4\_general\_ci;

INSERT INTO \`guests\` (\`guest\_id\`, \`full\_name\`, \`phone\`, \`email\`, \`created\_at\`) VALUES  
(2, 'Guest One', '0760000010', 'guest1@example.com', '2026-04-19 13:11:57'),  
(3, 'Test Guest', '0760000011', 'test@example.com', '2026-04-19 14:44:08');

\-- \=========================================================================  
\-- MODULE 4: OPERATIONS & SCHEDULING  
\-- \=========================================================================

CREATE TABLE \`bookings\` (  
  \`booking\_id\` INT(11) NOT NULL AUTO\_INCREMENT,  
  \`court\_id\` INT(11) NOT NULL,  
  \`slot\_id\` INT(11) NOT NULL,  
  \`booking\_date\` DATE NOT NULL,  
  \`booking\_type\` ENUM('member', 'guest', 'coach') NOT NULL,  
  \`amount\_charged\` DECIMAL(10,2) NOT NULL DEFAULT 0.00, \-- Historical Price Snapshots  
  \`member\_id\` INT(11) DEFAULT NULL,  
  \`guest\_id\` INT(11) DEFAULT NULL,  
  \`coach\_id\` INT(11) DEFAULT NULL,  
  \`status\` ENUM('pending', 'confirmed', 'rejected', 'cancelled') DEFAULT 'pending',  
  \`lock\_status\` ENUM('locked', 'unlocked') DEFAULT 'unlocked',  
  \`created\_at\` TIMESTAMP NOT NULL DEFAULT CURRENT\_TIMESTAMP(),  
  \`created\_by\_user\_id\` INT(11) NOT NULL,  
  PRIMARY KEY (\`booking\_id\`),  
  KEY \`court\_id\` (\`court\_id\`),  
  KEY \`slot\_id\` (\`slot\_id\`),  
  KEY \`created\_by\_user\_id\` (\`created\_by\_user\_id\`),  
  KEY \`member\_id\` (\`member\_id\`),  
  KEY \`guest\_id\` (\`guest\_id\`),  
  KEY \`coach\_id\` (\`coach\_id\`),  
    
  \-- Core Hardware Guard: Blocks double booking overlaps completely  
  UNIQUE KEY \`unique\_court\_slot\` (\`court\_id\`, \`booking\_date\`, \`slot\_id\`),  
    
  CONSTRAINT \`fk\_booking\_court\` FOREIGN KEY (\`court\_id\`) REFERENCES \`courts\` (\`court\_id\`),  
  CONSTRAINT \`fk\_booking\_slot\` FOREIGN KEY (\`slot\_id\`) REFERENCES \`time\_slots\` (\`slot\_id\`),  
  CONSTRAINT \`fk\_booking\_member\` FOREIGN KEY (\`member\_id\`) REFERENCES \`members\` (\`member\_id\`),  
  CONSTRAINT \`fk\_booking\_guest\` FOREIGN KEY (\`guest\_id\`) REFERENCES \`guests\` (\`guest\_id\`),  
  CONSTRAINT \`fk\_booking\_coach\` FOREIGN KEY (\`coach\_id\`) REFERENCES \`coaches\` (\`coach\_id\`) ON DELETE SET NULL,  
  CONSTRAINT \`fk\_booking\_creator\` FOREIGN KEY (\`created\_by\_user\_id\`) REFERENCES \`users\` (\`user\_id\`)  
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4\_general\_ci;

CREATE TABLE \`booking\_participants\` (  
  \`participant\_id\` INT(11) NOT NULL AUTO\_INCREMENT,  
  \`booking\_id\` INT(11) NOT NULL,  
  \`member\_id\` INT(11) DEFAULT NULL,  
  \`guest\_id\` INT(11) DEFAULT NULL,  
  PRIMARY KEY (\`participant\_id\`),  
  KEY \`booking\_id\` (\`booking\_id\`),  
  KEY \`member\_id\` (\`member\_id\`),  
  KEY \`guest\_id\` (\`guest\_id\`),  
  CONSTRAINT \`fk\_part\_booking\` FOREIGN KEY (\`booking\_id\`) REFERENCES \`bookings\` (\`booking\_id\`) ON DELETE CASCADE,  
  CONSTRAINT \`fk\_part\_member\` FOREIGN KEY (\`member\_id\`) REFERENCES \`members\` (\`member\_id\`) ON DELETE CASCADE,  
  CONSTRAINT \`fk\_part\_guest\` FOREIGN KEY (\`guest\_id\`) REFERENCES \`guests\` (\`guest\_id\`) ON DELETE CASCADE  
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4\_general\_ci;

CREATE TABLE \`memberships\` (  
  \`membership\_id\` INT(11) NOT NULL AUTO\_INCREMENT,  
  \`member\_id\` INT(11) NOT NULL,  
  \`membership\_type\_id\` INT(11) NOT NULL,  
  \`purchase\_price\` DECIMAL(10,2) NOT NULL DEFAULT 0.00, \-- Historical accounting snapshot  
  \`start\_date\` DATE NOT NULL,  
  \`end\_date\` DATE NOT NULL,  
  \`status\` ENUM('active', 'expired') DEFAULT 'active',  
  PRIMARY KEY (\`membership\_id\`),  
  KEY \`membership\_type\_id\` (\`membership\_type\_id\`),  
  KEY \`member\_id\` (\`member\_id\`),  
  CONSTRAINT \`fk\_mem\_member\` FOREIGN KEY (\`member\_id\`) REFERENCES \`members\` (\`member\_id\`) ON DELETE CASCADE,  
  CONSTRAINT \`fk\_mem\_type\` FOREIGN KEY (\`membership\_type\_id\`) REFERENCES \`membership\_types\` (\`membership\_type\_id\`)  
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4\_general\_ci;

CREATE TABLE \`attendance\` (  
  \`attendance\_id\` INT(11) NOT NULL AUTO\_INCREMENT,  
  \`member\_id\` INT(11) DEFAULT NULL,  
  \`coach\_id\` INT(11) DEFAULT NULL,  
  \`checkin\_time\` TIMESTAMP NOT NULL DEFAULT CURRENT\_TIMESTAMP(),  
  \`checkout\_time\` TIMESTAMP NULL DEFAULT NULL,  
  PRIMARY KEY (\`attendance\_id\`),  
  KEY \`member\_id\` (\`member\_id\`),  
  KEY \`coach\_id\` (\`coach\_id\`),  
  CONSTRAINT \`fk\_att\_member\` FOREIGN KEY (\`member\_id\`) REFERENCES \`members\` (\`member\_id\`) ON DELETE CASCADE,  
  CONSTRAINT \`fk\_att\_coach\` FOREIGN KEY (\`coach\_id\`) REFERENCES \`coaches\` (\`coach\_id\`) ON DELETE CASCADE  
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4\_general\_ci;

\-- \=========================================================================  
\-- MODULE 5: WORKFLOW PIPELINES & REVENUE LEDGERS  
\-- \=========================================================================

CREATE TABLE \`registration\_requests\` (  
  \`request\_id\` INT(11) NOT NULL AUTO\_INCREMENT,  
  \`full\_name\` VARCHAR(100) NOT NULL,  
  \`email\` VARCHAR(100) NOT NULL,  
  \`phone\` VARCHAR(20) NOT NULL,  
  \`username\` VARCHAR(50) NOT NULL,  
  \`password\_hash\` VARCHAR(255) NOT NULL,  
  \`status\` ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',  
  \`submitted\_at\` TIMESTAMP NOT NULL DEFAULT CURRENT\_TIMESTAMP(),  
  \`reviewed\_by\` INT(11) DEFAULT NULL,  
  \`reviewed\_at\` TIMESTAMP NULL DEFAULT NULL,  
  \`membership\_type\_id\` INT(11) DEFAULT NULL,  
  PRIMARY KEY (\`request\_id\`),  
  UNIQUE KEY \`email\` (\`email\`),  
  UNIQUE KEY \`username\` (\`username\`),  
  KEY \`reviewed\_by\` (\`reviewed\_by\`),  
  KEY \`membership\_type\_id\` (\`membership\_type\_id\`),  
  CONSTRAINT \`fk\_reg\_type\` FOREIGN KEY (\`membership\_type\_id\`) REFERENCES \`membership\_types\` (\`membership\_type\_id\`),  
  CONSTRAINT \`fk\_reg\_reviewer\` FOREIGN KEY (\`reviewed\_by\`) REFERENCES \`users\` (\`user\_id\`) ON DELETE SET NULL  
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4\_general\_ci;

\-- Sample registration data rows (sanitized placeholder data)  
INSERT INTO \`registration\_requests\` (\`request\_id\`, \`full\_name\`, \`email\`, \`phone\`, \`username\`, \`password\_hash\`, \`status\`, \`submitted\_at\`, \`reviewed\_by\`, \`reviewed\_at\`, \`membership\_type\_id\`) VALUES  
(1, 'Sample Applicant 1', 'applicant1@example.com', '0760000020', 'applicant1', '$2b$10$placeholderHashDoNotUseXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', 'approved', '2026-04-17 09:15:51', NULL, NULL, NULL),  
(2, 'Test Member', 'test@example.com', '0760000021', 'tester01', '$2b$10$placeholderHashDoNotUseXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', 'rejected', '2026-04-17 09:24:55', NULL, NULL, NULL),  
(4, 'Sample Applicant 2', 'applicant2@example.com', '0760000022', 'applicant2', '$2b$10$placeholderHashDoNotUseXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', 'approved', '2026-04-17 09:41:55', NULL, NULL, NULL),  
(6, 'Sample Applicant 3', 'applicant3@example.com', '0760000023', 'applicant3', '$2b$10$placeholderHashDoNotUseXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', 'approved', '2026-04-17 10:01:43', NULL, NULL, NULL),  
(7, 'Sample Applicant 4', 'applicant4@example.com', '0760000024', 'applicant4', '$2b$10$placeholderHashDoNotUseXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', 'approved', '2026-04-17 11:19:54', NULL, NULL, NULL),  
(9, 'Sample Applicant 5', 'applicant5@example.com', '0760000025', 'applicant5', '$2b$10$placeholderHashDoNotUseXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', 'approved', '2026-04-17 12:57:11', NULL, NULL, NULL),  
(12, 'Sample Applicant 6', 'applicant6@example.com', '0760000026', 'applicant6', '$2b$10$placeholderHashDoNotUseXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', 'approved', '2026-04-19 14:24:15', NULL, '2026-04-19 14:53:22', NULL);

CREATE TABLE \`payment\_verification\` (  
  \`verification\_id\` INT(11) NOT NULL AUTO\_INCREMENT,  
  \`request\_id\` INT(11) DEFAULT NULL,  
  \`booking\_id\` INT(11) DEFAULT NULL,  
  \`payment\_type\` ENUM('registration', 'booking', 'membership\_renewal', 'other') NOT NULL DEFAULT 'registration',  
  \`receipt\_file\_url\` VARCHAR(255) NOT NULL,  
  \`amount\_declared\` DECIMAL(10,2) DEFAULT 0.00,  
  \`status\` ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',  
  \`submitted\_at\` TIMESTAMP NOT NULL DEFAULT CURRENT\_TIMESTAMP(),  
  \`reviewed\_by\` INT(11) DEFAULT NULL,  
  \`reviewed\_at\` TIMESTAMP NOT NULL DEFAULT CURRENT\_TIMESTAMP() ON UPDATE CURRENT\_TIMESTAMP(),  
  \`remarks\` TEXT DEFAULT NULL,  
  PRIMARY KEY (\`verification\_id\`),  
  UNIQUE KEY \`request\_id\` (\`request\_id\`), \-- Retained unique: one request, one verification loop  
  KEY \`booking\_id\` (\`booking\_id\`),         \-- Dropped unique constraint to allow multi-upload retries for rejected runs  
  KEY \`reviewed\_by\` (\`reviewed\_by\`),  
  CONSTRAINT \`fk\_ver\_request\` FOREIGN KEY (\`request\_id\`) REFERENCES \`registration\_requests\` (\`request\_id\`) ON DELETE CASCADE,  
  CONSTRAINT \`fk\_ver\_reviewer\` FOREIGN KEY (\`reviewed\_by\`) REFERENCES \`users\` (\`user\_id\`) ON DELETE SET NULL  
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4\_general\_ci;

\-- Seed historical registration verification lines  
INSERT INTO \`payment\_verification\` (\`verification\_id\`, \`request\_id\`, \`booking\_id\`, \`payment\_type\`, \`receipt\_file\_url\`, \`amount\_declared\`, \`status\`, \`submitted\_at\`, \`reviewed\_by\`, \`reviewed\_at\`, \`remarks\`) VALUES  
(1, 6, NULL, 'registration', 'uploads\\\\slips\\\\sample-receipt-1.png', 0.00, 'approved', '2026-04-17 10:01:43', NULL, '2026-04-19 12:20:17', NULL),  
(2, 7, NULL, 'registration', 'uploads\\\\slips\\\\sample-receipt-2.png', 0.00, 'approved', '2026-04-17 11:19:54', NULL, '2026-04-19 14:25:12', NULL),  
(3, 12, NULL, 'registration', 'uploads\\\\slips\\\\sample-receipt-3.png', 0.00, 'approved', '2026-04-19 14:24:15', NULL, '2026-04-19 14:53:22', NULL);

CREATE TABLE \`payments\` (  
  \`payment\_id\` INT(11) NOT NULL AUTO\_INCREMENT,  
  \`amount\` DECIMAL(10,2) NOT NULL,  
  \`payment\_date\` TIMESTAMP NOT NULL DEFAULT CURRENT\_TIMESTAMP(),  
  \`payment\_type\` ENUM('membership', 'booking\_fee') NOT NULL,  
  \`member\_id\` INT(11) DEFAULT NULL,  
  \`booking\_id\` INT(11) DEFAULT NULL,  
  \`handled\_by\` INT(11) NOT NULL, \-- Admin tracking compliance metric  
  \`status\` ENUM('completed', 'recorded', 'failed', 'refunded') DEFAULT 'completed',  
  PRIMARY KEY (\`payment\_id\`),  
  KEY \`handled\_by\` (\`handled\_by\`),  
  KEY \`member\_id\` (\`member\_id\`),  
  KEY \`booking\_id\` (\`booking\_id\`),  
  CONSTRAINT \`fk\_pay\_admin\` FOREIGN KEY (\`handled\_by\`) REFERENCES \`users\` (\`user\_id\`),  
  CONSTRAINT \`fk\_pay\_member\` FOREIGN KEY (\`member\_id\`) REFERENCES \`members\` (\`member\_id\`) ON DELETE SET NULL,  
  CONSTRAINT \`fk\_pay\_booking\` FOREIGN KEY (\`booking\_id\`) REFERENCES \`bookings\` (\`booking\_id\`) ON DELETE SET NULL  
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4\_general\_ci;

\-- Consolidated payment references (table name altered to matching plural form 'payments')  
INSERT INTO \`payments\` (\`payment\_id\`, \`amount\`, \`payment\_date\`, \`payment\_type\`, \`member\_id\`, \`booking\_id\`, \`handled\_by\`, \`status\`) VALUES  
(1, 5000.00, '2026-04-17 10:39:56', 'membership', NULL, NULL, 19, 'completed'),  
(2, 5000.00, '2026-04-19 14:25:12', 'membership', NULL, NULL, 19, 'completed'),  
(3, 0.00, '2026-04-19 14:53:22', 'membership', NULL, NULL, 19, 'completed'),  
(4, 5000.00, '2026-04-26 04:54:37', 'membership', NULL, NULL, 19, 'completed'),  
(5, 5000.00, '2026-05-29 12:45:40', 'membership', 10, NULL, 19, 'completed');

\-- \=========================================================================  
\-- INITIAL SEED DATA  
\-- \=========================================================================

\-- Seed the 16 fixed operational 1-hour club blocks (06:00 AM to 10:00 PM)  
INSERT INTO \`time\_slots\` (\`slot\_name\`, \`start\_time\`, \`end\_time\`) VALUES  
('Slot 01 (06:00 \- 07:00)', '06:00:00', '07:00:00'),  
('Slot 02 (07:00 \- 08:00)', '07:00:00', '08:00:00'),  
('Slot 03 (08:00 \- 09:00)', '08:00:00', '09:00:00'),  
('Slot 04 (09:00 \- 10:00)', '09:00:00', '10:00:00'),  
('Slot 05 (10:00 \- 11:00)', '10:00:00', '11:00:00'),  
('Slot 06 (11:00 \- 12:00)', '11:00:00', '12:00:00'),  
('Slot 07 (12:00 \- 13:00)', '12:00:00', '13:00:00'),  
('Slot 08 (13:00 \- 14:00)', '13:00:00', '14:00:00'),  
('Slot 09 (14:00 \- 15:00)', '14:00:00', '15:00:00'),  
('Slot 10 (15:00 \- 16:00)', '15:00:00', '16:00:00'),  
('Slot 11 (16:00 \- 17:00)', '16:00:00', '17:00:00'),  
('Slot 12 (17:00 \- 18:00)', '17:00:00', '18:00:00'),  
('Slot 13 (18:00 \- 19:00)', '18:00:00', '19:00:00'),  
('Slot 14 (19:00 \- 20:00)', '19:00:00', '20:00:00'),  
('Slot 15 (20:00 \- 21:00)', '20:00:00', '21:00:00'),  
('Slot 16 (21:00 \- 22:00)', '21:00:00', '22:00:00');

\-- Injecting the historical booking linked with our new standardized Time Slots mapping (08:00 to 09:00 maps to Slot 03\)  
INSERT INTO \`bookings\` (\`booking\_id\`, \`court\_id\`, \`slot\_id\`, \`booking\_date\`, \`booking\_type\`, \`amount\_charged\`, \`member\_id\`, \`guest\_id\`, \`coach\_id\`, \`status\`, \`lock\_status\`, \`created\_at\`, \`created\_by\_user\_id\`) VALUES  
(3, 1, 3, '2026-04-20', 'guest', 1500.00, NULL, 3, NULL, 'pending', 'unlocked', '2026-04-19 14:49:48', 19);

INSERT INTO \`payment\_verification\` (\`verification\_id\`, \`request\_id\`, \`booking\_id\`, \`payment\_type\`, \`receipt\_file\_url\`, \`amount\_declared\`, \`status\`, \`submitted\_at\`, \`reviewed\_by\`, \`reviewed\_at\`, \`remarks\`) VALUES  
(4, NULL, 3, 'booking', '/uploads/receipts/sample-receipt-4.png', 1500.00, 'pending', '2026-04-19 14:51:46', NULL, '2026-04-19 14:51:46', NULL);

COMMIT;  

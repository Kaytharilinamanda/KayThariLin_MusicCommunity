-- Harmony accounts for XAMPP MySQL (phpMyAdmin).
-- Login and register only. Roles: user, organizer, admin.
--
-- Sample logins (password_hash is scrypt, not the plain password):
--   admin@harmony.community      HarmonyAdmin1   role admin      status active
--   user@harmony.community       Listener123     role user       status active
--   organizer@harmony.community  Organizer123    role organizer  status active

CREATE DATABASE IF NOT EXISTS music_community
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE music_community;

CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('user', 'organizer', 'admin') NOT NULL,
  status ENUM('active', 'pending', 'suspended', 'rejected') NOT NULL DEFAULT 'active',
  phone VARCHAR(40) NOT NULL DEFAULT '',
  city VARCHAR(80) NOT NULL DEFAULT '',
  organization VARCHAR(160) NOT NULL DEFAULT '',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY users_email_unique (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO users (name, email, password_hash, role, status, phone, city, organization)
SELECT 'Harmony Admin', 'admin@harmony.community', 'd2a47cc972cee109fe6ee203061d92f6:70b3debea4952e2c1f2d243896b89569736bbab089af7bc469f1c172b438c1a9', 'admin', 'active', '', 'Yangon', 'Harmony'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@harmony.community');

INSERT INTO users (name, email, password_hash, role, status, phone, city, organization)
SELECT 'Kay User', 'user@harmony.community', 'd3734635345036e06e86f69b1d6baff6:47ac06af3b5dcb689e1f25a8f31cc7c37cf19f50d55bbc8f7a11a3fbefd860ab', 'user', 'active', '09111111111', 'Yangon', ''
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'user@harmony.community');

INSERT INTO users (name, email, password_hash, role, status, phone, city, organization)
SELECT 'Stage Organizer', 'organizer@harmony.community', 'd1bf4d070359ba3eb9847e45935cd6b2:b2d089f31c177b68f8828e1b58a730d295050c23cd4fd2c101ef4e523aef640c', 'organizer', 'active', '09222222222', 'Mandalay', 'Yangon Live'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'organizer@harmony.community');

-- Organizer submissions. Admin approves or rejects; only approved rows are public.
CREATE TABLE IF NOT EXISTS events (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  organizer_id INT UNSIGNED NOT NULL,
  title VARCHAR(160) NOT NULL,
  artist VARCHAR(160) NOT NULL DEFAULT '',
  category VARCHAR(80) NOT NULL DEFAULT 'Pop',
  event_date DATE NOT NULL,
  event_time VARCHAR(40) NOT NULL DEFAULT '',
  venue VARCHAR(160) NOT NULL DEFAULT '',
  address VARCHAR(255) NOT NULL DEFAULT '',
  city VARCHAR(80) NOT NULL DEFAULT '',
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  image VARCHAR(255) NOT NULL DEFAULT '/images/crowd.jpg',
  blurb VARCHAR(500) NOT NULL DEFAULT '',
  description TEXT,
  approval_status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  rejection_reason VARCHAR(500) NOT NULL DEFAULT '',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY events_organizer_idx (organizer_id),
  CONSTRAINT events_organizer_fk FOREIGN KEY (organizer_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tickets (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  event_id INT UNSIGNED NOT NULL,
  organizer_id INT UNSIGNED NOT NULL,
  name VARCHAR(120) NOT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  note VARCHAR(255) NOT NULL DEFAULT '',
  quantity INT UNSIGNED NOT NULL DEFAULT 0,
  sales_start DATE NULL,
  sales_end DATE NULL,
  approval_status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  rejection_reason VARCHAR(500) NOT NULL DEFAULT '',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY tickets_event_idx (event_id),
  KEY tickets_organizer_idx (organizer_id),
  CONSTRAINT tickets_event_fk FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE,
  CONSTRAINT tickets_organizer_fk FOREIGN KEY (organizer_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Workshops, courses, categories, centers, and enrollments submitted by organizers.
CREATE TABLE IF NOT EXISTS programs (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  organizer_id INT UNSIGNED NOT NULL,
  kind ENUM('workshop', 'course', 'category', 'center', 'enrollment') NOT NULL,
  payload JSON NOT NULL,
  approval_status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  rejection_reason VARCHAR(500) NOT NULL DEFAULT '',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY programs_kind_idx (kind, organizer_id),
  CONSTRAINT programs_organizer_fk FOREIGN KEY (organizer_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

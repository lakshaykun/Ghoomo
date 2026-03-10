-- ============================================================
-- Ghoomo Database Schema  –  Supabase (PostgreSQL)
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Enable the pgcrypto extension for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;


-- ============================================================
-- 1. USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(255)  NOT NULL,
  email         CITEXT        UNIQUE,
  phone_number  VARCHAR(20)   NOT NULL UNIQUE,
  password_hash TEXT,
  role          VARCHAR(20)   NOT NULL DEFAULT 'student'
                  CHECK (role IN ('student', 'driver', 'admin')),
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CHECK (
    (role = 'admin' AND password_hash IS NOT NULL)
    OR
    role IN ('student','driver')
  )
);


-- ============================================================
-- 2. DRIVERS
-- ============================================================
CREATE TABLE IF NOT EXISTS drivers (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID        NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  vehicle_number    VARCHAR(50) NOT NULL UNIQUE,
  vehicle_type      VARCHAR(10) NOT NULL CHECK (vehicle_type IN ('auto', 'cab')),
  license_number    VARCHAR(100) NOT NULL UNIQUE,
  status            VARCHAR(20) NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('approved', 'pending', 'suspended')),
  is_available      BOOLEAN     NOT NULL DEFAULT FALSE,
  current_latitude  DECIMAL(10, 8),
  current_longitude DECIMAL(11, 8),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 3. RIDE REQUESTS
-- ============================================================
CREATE TABLE IF NOT EXISTS ride_requests (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id        UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  matched_driver_id UUID        REFERENCES drivers(id) ON DELETE SET NULL,
  pickup_location   TEXT        NOT NULL,
  drop_location     TEXT        NOT NULL,
  pickup_latitude   DECIMAL(10, 8) NOT NULL,
  pickup_longitude  DECIMAL(11, 8) NOT NULL,
  drop_latitude     DECIMAL(10, 8) NOT NULL,
  drop_longitude    DECIMAL(11, 8) NOT NULL,
  request_time      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status            VARCHAR(20) NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending', 'matched', 'cancelled'))
);


-- ============================================================
-- 4. RIDES
-- ============================================================
CREATE TABLE IF NOT EXISTS rides (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id      UUID          NOT NULL UNIQUE REFERENCES ride_requests(id) ON DELETE RESTRICT,
  student_id      UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  driver_id       UUID          NOT NULL REFERENCES drivers(id) ON DELETE RESTRICT,
  pickup_location TEXT          NOT NULL,
  drop_location   TEXT          NOT NULL,
  fare            DECIMAL(10, 2),
  distance        DECIMAL(10, 3),          -- kilometres
  status          VARCHAR(20)   NOT NULL DEFAULT 'accepted'
                    CHECK (status IN ('accepted', 'started', 'completed', 'cancelled')),
  start_time      TIMESTAMPTZ,
  end_time        TIMESTAMPTZ,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 5. GPS LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS gps_logs (
  id         UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id  UUID          NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  ride_id    UUID          REFERENCES rides(id) ON DELETE SET NULL,
  latitude   DECIMAL(10, 8) NOT NULL,
  longitude  DECIMAL(11, 8) NOT NULL,
  timestamp  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 6. DRIVER RATINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS driver_ratings (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id     UUID        NOT NULL UNIQUE REFERENCES rides(id) ON DELETE CASCADE,
  student_id  UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  driver_id   UUID        NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  rating      SMALLINT    NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 7. CAMPUS ENTRY LOGS
-- (Created by backend when a driver enters / exits campus)
-- ============================================================
CREATE TABLE IF NOT EXISTS campus_entry_logs (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id    UUID        NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  driver_id  UUID        NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  entry_time TIMESTAMPTZ,
  exit_time  TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_users_email               ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role                ON users(role);

CREATE INDEX IF NOT EXISTS idx_drivers_user_id           ON drivers(user_id);
CREATE INDEX IF NOT EXISTS idx_drivers_status            ON drivers(status);
CREATE INDEX IF NOT EXISTS idx_drivers_is_available      ON drivers(is_available);

CREATE INDEX IF NOT EXISTS idx_ride_requests_student_id  ON ride_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_ride_requests_driver_id   ON ride_requests(matched_driver_id);
CREATE INDEX IF NOT EXISTS idx_ride_requests_status      ON ride_requests(status);

CREATE INDEX IF NOT EXISTS idx_rides_student_id          ON rides(student_id);
CREATE INDEX IF NOT EXISTS idx_rides_driver_id           ON rides(driver_id);
CREATE INDEX IF NOT EXISTS idx_rides_status              ON rides(status);
CREATE INDEX IF NOT EXISTS idx_rides_request_id          ON rides(request_id);

CREATE INDEX IF NOT EXISTS idx_gps_logs_driver_id        ON gps_logs(driver_id);
CREATE INDEX IF NOT EXISTS idx_gps_logs_ride_id          ON gps_logs(ride_id);
CREATE INDEX IF NOT EXISTS idx_gps_logs_timestamp        ON gps_logs(timestamp);

CREATE INDEX IF NOT EXISTS idx_driver_ratings_driver_id  ON driver_ratings(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_ratings_ride_id    ON driver_ratings(ride_id);

CREATE INDEX IF NOT EXISTS idx_campus_entry_logs_ride_id    ON campus_entry_logs(ride_id);
CREATE INDEX IF NOT EXISTS idx_campus_entry_logs_driver_id  ON campus_entry_logs(driver_id);


-- ============================================================
-- AUTO-UPDATE updated_at TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER trg_drivers_updated_at
  BEFORE UPDATE ON drivers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER trg_rides_updated_at
  BEFORE UPDATE ON rides
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ============================================================
-- ROW LEVEL SECURITY  (enable but leave policies to your app)
-- ============================================================
ALTER TABLE users               ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers             ENABLE ROW LEVEL SECURITY;
ALTER TABLE ride_requests       ENABLE ROW LEVEL SECURITY;
ALTER TABLE rides               ENABLE ROW LEVEL SECURITY;
ALTER TABLE gps_logs            ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_ratings      ENABLE ROW LEVEL SECURITY;
ALTER TABLE campus_entry_logs   ENABLE ROW LEVEL SECURITY;

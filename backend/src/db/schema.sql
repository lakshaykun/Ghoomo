-- ============================================================
-- Ghoomo Database Schema – FINAL PRODUCTION VERSION
-- Supabase (PostgreSQL)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
name          VARCHAR(255) NOT NULL,
email         CITEXT NOT NULL UNIQUE,
phone         VARCHAR(20) NOT NULL UNIQUE,
password_hash TEXT NOT NULL,
role          VARCHAR(20) NOT NULL DEFAULT 'rider'
CHECK (role IN ('rider','driver','bus_driver','admin')),
created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- DRIVERS
-- ============================================================
CREATE TABLE IF NOT EXISTS drivers (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

  status       VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('approved','pending','suspended','rejected')),

  is_available BOOLEAN NOT NULL DEFAULT FALSE,
  rating       DECIMAL(2,1) CHECK (rating BETWEEN 1.0 AND 5.0),

  last_seen_at TIMESTAMPTZ,

  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vehicles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_number  VARCHAR(50) NOT NULL UNIQUE,
  vehicle_type    VARCHAR(10) NOT NULL 
    CHECK (vehicle_type IN ('auto','cab')),

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS driver_vehicles (
  driver_id   UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  vehicle_id  UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,

  is_active   BOOLEAN DEFAULT TRUE,

  PRIMARY KEY (driver_id, vehicle_id)
);

CREATE TABLE IF NOT EXISTS driver_locations (
  driver_id         UUID PRIMARY KEY REFERENCES drivers(id) ON DELETE CASCADE,
  current_latitude  DECIMAL(10,8),
  current_longitude DECIMAL(11,8),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- RIDE REQUESTS
-- ============================================================
CREATE TABLE IF NOT EXISTS ride_requests (
id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
student_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

pickup_location   TEXT NOT NULL,
drop_location     TEXT NOT NULL,

pickup_latitude   DECIMAL(10,8) NOT NULL CHECK (pickup_latitude BETWEEN -90 AND 90),
pickup_longitude  DECIMAL(11,8) NOT NULL CHECK (pickup_longitude BETWEEN -180 AND 180),
drop_latitude     DECIMAL(10,8) NOT NULL,
drop_longitude    DECIMAL(11,8) NOT NULL,

request_time      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
expires_at        TIMESTAMPTZ,

is_shared         BOOLEAN NOT NULL DEFAULT FALSE,
locked            BOOLEAN DEFAULT FALSE,

status            VARCHAR(20) NOT NULL DEFAULT 'searching'
CHECK (status IN ('searching','matched','cancelled','expired')),

created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- MATCHING TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS ride_request_candidates (
id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
request_id    UUID NOT NULL REFERENCES ride_requests(id) ON DELETE CASCADE,
driver_id     UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,

status        VARCHAR(20) NOT NULL DEFAULT 'pending'
CHECK (status IN ('pending','notified','accepted','rejected','timeout')),

distance_km   DECIMAL(6,2),
retry_count   INT DEFAULT 0,

offered_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
responded_at  TIMESTAMPTZ,

UNIQUE(request_id, driver_id)
);

-- ============================================================
-- RIDES
-- ============================================================
CREATE TABLE IF NOT EXISTS rides (
id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
request_id      UUID UNIQUE REFERENCES ride_requests(id) ON DELETE SET NULL,

student_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
driver_id       UUID NOT NULL REFERENCES drivers(id) ON DELETE RESTRICT,

pickup_location TEXT NOT NULL,
drop_location   TEXT NOT NULL,

pickup_latitude   DECIMAL(10,8) NOT NULL,
pickup_longitude  DECIMAL(11,8) NOT NULL,
drop_latitude     DECIMAL(10,8) NOT NULL,
drop_longitude    DECIMAL(11,8) NOT NULL,

fare            DECIMAL(10,2),
distance        DECIMAL(10,3),

status          VARCHAR(20) NOT NULL DEFAULT 'assigned'
CHECK (status IN ('assigned','arriving','started','completed','cancelled')),

start_time      TIMESTAMPTZ,
end_time        TIMESTAMPTZ,

is_shared       BOOLEAN NOT NULL DEFAULT FALSE,

created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SHARED RIDES
-- ============================================================
CREATE TABLE IF NOT EXISTS shared_rides (
id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
base_ride_id    UUID REFERENCES rides(id) ON DELETE CASCADE,
status          VARCHAR(20) NOT NULL CHECK (status IN ('open','full','completed','cancelled')),
max_participants INT DEFAULT 2,
created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shared_ride_participants (
id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
shared_ride_id  UUID NOT NULL REFERENCES shared_rides(id) ON DELETE CASCADE,
user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

pickup_location TEXT NOT NULL,
drop_location   TEXT NOT NULL,

pickup_latitude   DECIMAL(10,8),
pickup_longitude  DECIMAL(11,8),
drop_latitude     DECIMAL(10,8),
drop_longitude    DECIMAL(11,8),

status          VARCHAR(20) NOT NULL CHECK (status IN ('joined','picked','dropped','cancelled')),
fare_split      DECIMAL(10,2),

UNIQUE(shared_ride_id, user_id)
);


-- ============================================================
-- DRIVER RATINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS driver_ratings (
id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
ride_id     UUID NOT NULL UNIQUE REFERENCES rides(id) ON DELETE CASCADE,
student_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
driver_id   UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
rating      DECIMAL(2,1) NOT NULL CHECK (rating BETWEEN 1.0 AND 5.0),
review_text TEXT,
created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
UNIQUE(student_id, driver_id, ride_id)
);

-- ============================================================
-- CAMPUS ENTRY LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS campus_entry_logs (
id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
ride_id    UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
driver_id  UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
entry_time TIMESTAMPTZ,
exit_time  TIMESTAMPTZ,
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- BUS SYSTEM
-- ============================================================
CREATE TABLE IF NOT EXISTS bus_drivers (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

  license_number VARCHAR(100) NOT NULL UNIQUE,

  status       VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('approved','pending','suspended','rejected')),

  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bus_routes (
id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
name           TEXT NOT NULL,
departure_time TIME NOT NULL,
arrival_time   TIME NOT NULL,
created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bus_stops (
id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
name        TEXT NOT NULL,
latitude    DECIMAL(10,8),
longitude   DECIMAL(11,8),
created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bus_route_stops (
id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
route_id      UUID NOT NULL REFERENCES bus_routes(id) ON DELETE CASCADE,
stop_id       UUID NOT NULL REFERENCES bus_stops(id) ON DELETE CASCADE,
stop_order    INT NOT NULL CHECK (stop_order > 0),
stop_type     VARCHAR(10) NOT NULL CHECK (stop_type IN ('pickup','dropoff','both')),
arrival_time  TIME NOT NULL,

UNIQUE(route_id, stop_order),
UNIQUE(route_id, stop_id)
);

CREATE TABLE IF NOT EXISTS bus_bookings (
id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
route_id      UUID REFERENCES bus_routes(id) ON DELETE SET NULL,
user_id       UUID REFERENCES users(id) ON DELETE SET NULL,
status        VARCHAR(20) NOT NULL CHECK (status IN ('pending','verified','cancelled','missing')),
verified_by   UUID REFERENCES users(id) ON DELETE SET NULL,
seat_number   INT,
created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
UNIQUE(route_id, seat_number)
);

-- ============================================================
-- SAVED LOCATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS saved_locations (
id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
name       VARCHAR(100) NOT NULL,
address    TEXT NOT NULL,
latitude   DECIMAL(10,8) NOT NULL,
longitude  DECIMAL(11,8) NOT NULL,
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

CREATE INDEX IF NOT EXISTS idx_drivers_available ON drivers(is_available, status);
CREATE INDEX IF NOT EXISTS idx_driver_locations_coords ON driver_locations(current_latitude, current_longitude);

CREATE INDEX IF NOT EXISTS idx_ride_requests_status ON ride_requests(status);
CREATE INDEX IF NOT EXISTS idx_ride_requests_created_at ON ride_requests(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_candidates_request ON ride_request_candidates(request_id, status);
CREATE INDEX IF NOT EXISTS idx_candidates_driver ON ride_request_candidates(driver_id);

CREATE INDEX IF NOT EXISTS idx_rides_driver ON rides(driver_id);
CREATE INDEX IF NOT EXISTS idx_rides_status ON rides(status);

CREATE INDEX IF NOT EXISTS idx_shared_rides_base_ride ON shared_rides(base_ride_id);
CREATE INDEX IF NOT EXISTS idx_shared_rides_status ON shared_rides(status);

CREATE INDEX IF NOT EXISTS idx_driver_ratings_driver ON driver_ratings(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_ratings_student ON driver_ratings(student_id);

CREATE INDEX IF NOT EXISTS idx_bus_routes_created_at ON bus_routes(created_at DESC);


CREATE INDEX IF NOT EXISTS idx_bus_bookings_user ON bus_bookings(user_id);

CREATE INDEX IF NOT EXISTS idx_saved_locations_user ON saved_locations(user_id);

-- ============================================================
-- TRIGGERS
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = NOW();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_drivers_updated_at
BEFORE UPDATE ON drivers FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_rides_updated_at
BEFORE UPDATE ON rides FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_requests_updated_at
BEFORE UPDATE ON ride_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_bus_bookings_updated_at
BEFORE UPDATE ON bus_bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ride_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE campus_entry_logs ENABLE ROW LEVEL SECURITY;

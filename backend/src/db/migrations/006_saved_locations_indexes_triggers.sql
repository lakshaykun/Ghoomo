-- Migration 006: Saved locations, indexes, triggers, and row level security
CREATE TABLE IF NOT EXISTS saved_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  address TEXT NOT NULL,
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP INDEX IF EXISTS idx_drivers_location;

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

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_drivers_updated_at ON drivers;
CREATE TRIGGER trg_drivers_updated_at
BEFORE UPDATE ON drivers FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_rides_updated_at ON rides;
CREATE TRIGGER trg_rides_updated_at
BEFORE UPDATE ON rides FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_requests_updated_at ON ride_requests;
CREATE TRIGGER trg_requests_updated_at
BEFORE UPDATE ON ride_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_bus_bookings_updated_at ON bus_bookings;
CREATE TRIGGER trg_bus_bookings_updated_at
BEFORE UPDATE ON bus_bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ride_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE campus_entry_logs ENABLE ROW LEVEL SECURITY;
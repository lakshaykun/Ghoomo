-- Ensure bus route schema matches runtime expectations across environments.

ALTER TABLE bus_routes
  ADD COLUMN IF NOT EXISTS total_seats INT NOT NULL DEFAULT 40,
  ADD COLUMN IF NOT EXISTS fare_per_seat DECIMAL(10,2) NOT NULL DEFAULT 0;

ALTER TABLE bus_bookings
  ADD COLUMN IF NOT EXISTS fare_amount DECIMAL(10,2) NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS bus_route_live_locations (
  route_id UUID PRIMARY KEY REFERENCES bus_routes(id) ON DELETE CASCADE,
  driver_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  speed_kmph DECIMAL(8,2),
  heading_deg DECIMAL(7,2),
  delay_minutes INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bus_route_live_locations_updated_at
  ON bus_route_live_locations(updated_at DESC);

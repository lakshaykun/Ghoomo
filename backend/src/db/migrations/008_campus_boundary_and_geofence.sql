CREATE TABLE IF NOT EXISTS campus_boundary (
  id SERIAL PRIMARY KEY,
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  sort_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE driver_locations
  ADD COLUMN IF NOT EXISTS is_inside_campus BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE driver_locations
SET is_inside_campus = COALESCE(is_inside_campus, FALSE);

CREATE INDEX IF NOT EXISTS idx_campus_boundary_sort_order ON campus_boundary(sort_order);
CREATE INDEX IF NOT EXISTS idx_driver_locations_inside_campus ON driver_locations(is_inside_campus);
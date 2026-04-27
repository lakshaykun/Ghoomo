-- Migration: Create popular_places table
CREATE TABLE IF NOT EXISTS popular_places (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  address     TEXT NOT NULL,
  latitude    DOUBLE PRECISION NOT NULL,
  longitude   DOUBLE PRECISION NOT NULL,
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW()
);

-- Prevent exact-duplicate names (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS popular_places_name_unique
  ON popular_places (lower(trim(name)));

-- Seed a few default campus places so admins see something right away
INSERT INTO popular_places (name, address, latitude, longitude, sort_order) VALUES
  ('Main Gate',      'College Main Entrance, IIT Ropar, Punjab',   30.9712921, 76.4731677, 1),
  ('Chenab Hostel',  'Chenab Hostel, IIT Ropar, Punjab',  30.9687464, 76.4656461, 2),
  ('Bela Chowk',    'Bela Chowk, Rupnagar, Punjab',   30.9660806, 76.5230859, 3),
  ('Ropar Railway Station', 'Ropar Railway Station, Rupnagar, Punjab',   30.9730347, 76.5331137, 4),
  ('New Ropar Bus Stand', 'New Ropar Bus Stand, Rupnagar, Punjab',   30.9817495, 76.5229907, 5)
ON CONFLICT DO NOTHING;

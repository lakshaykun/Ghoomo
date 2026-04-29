ALTER TABLE ride_requests
  ADD COLUMN IF NOT EXISTS estimated_fare DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS estimated_distance_km DECIMAL(10,3);

CREATE TABLE IF NOT EXISTS global_places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(normalized_name, latitude, longitude)
);

CREATE TABLE IF NOT EXISTS user_favourites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  place_id UUID NOT NULL REFERENCES global_places(id) ON DELETE CASCADE,
  label VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, place_id)
);

CREATE INDEX IF NOT EXISTS idx_global_places_normalized_name ON global_places(normalized_name);
CREATE INDEX IF NOT EXISTS idx_user_favourites_user ON user_favourites(user_id);

CREATE OR REPLACE FUNCTION normalize_place_name(input_name TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN lower(trim(COALESCE(input_name, '')));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION set_global_place_normalized_name()
RETURNS TRIGGER AS $$
BEGIN
  NEW.normalized_name := normalize_place_name(NEW.name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_global_places_normalized_name ON global_places;
CREATE TRIGGER trg_global_places_normalized_name
BEFORE INSERT OR UPDATE OF name
ON global_places
FOR EACH ROW
EXECUTE FUNCTION set_global_place_normalized_name();

CREATE OR REPLACE FUNCTION update_global_places_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_global_places_updated_at ON global_places;
CREATE TRIGGER trg_global_places_updated_at
BEFORE UPDATE ON global_places
FOR EACH ROW
EXECUTE FUNCTION update_global_places_updated_at();

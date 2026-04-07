-- Migration 004: Shared ride and rating tables
CREATE TABLE IF NOT EXISTS shared_rides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base_ride_id UUID REFERENCES rides(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL CHECK (status IN ('open', 'full', 'completed', 'cancelled')),
  max_participants INT DEFAULT 2,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shared_ride_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shared_ride_id UUID NOT NULL REFERENCES shared_rides(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  pickup_location TEXT NOT NULL,
  drop_location TEXT NOT NULL,

  pickup_latitude DECIMAL(10,8),
  pickup_longitude DECIMAL(11,8),
  drop_latitude DECIMAL(10,8),
  drop_longitude DECIMAL(11,8),

  status VARCHAR(20) NOT NULL CHECK (status IN ('joined', 'picked', 'dropped', 'cancelled')),
  fare_split DECIMAL(10,2),

  UNIQUE(shared_ride_id, user_id)
);

CREATE TABLE IF NOT EXISTS driver_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL UNIQUE REFERENCES rides(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  rating DECIMAL(2,1) NOT NULL CHECK (rating BETWEEN 1.0 AND 5.0),
  review_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(student_id, driver_id, ride_id)
);

CREATE TABLE IF NOT EXISTS campus_entry_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  entry_time TIMESTAMPTZ,
  exit_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
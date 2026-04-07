-- Migration 003: Ride request and ride tables
CREATE TABLE IF NOT EXISTS ride_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  pickup_location TEXT NOT NULL,
  drop_location TEXT NOT NULL,

  pickup_latitude DECIMAL(10,8) NOT NULL CHECK (pickup_latitude BETWEEN -90 AND 90),
  pickup_longitude DECIMAL(11,8) NOT NULL CHECK (pickup_longitude BETWEEN -180 AND 180),
  drop_latitude DECIMAL(10,8) NOT NULL,
  drop_longitude DECIMAL(11,8) NOT NULL,

  request_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,

  is_shared BOOLEAN NOT NULL DEFAULT FALSE,
  locked BOOLEAN DEFAULT FALSE,

  status VARCHAR(20) NOT NULL DEFAULT 'searching'
    CHECK (status IN ('searching', 'matched', 'cancelled', 'expired')),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ride_request_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES ride_requests(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,

  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'notified', 'accepted', 'rejected', 'timeout')),

  distance_km DECIMAL(6,2),
  retry_count INT DEFAULT 0,

  offered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ,

  UNIQUE(request_id, driver_id)
);

CREATE TABLE IF NOT EXISTS rides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID UNIQUE REFERENCES ride_requests(id) ON DELETE SET NULL,

  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE RESTRICT,

  pickup_location TEXT NOT NULL,
  drop_location TEXT NOT NULL,

  pickup_latitude DECIMAL(10,8) NOT NULL,
  pickup_longitude DECIMAL(11,8) NOT NULL,
  drop_latitude DECIMAL(10,8) NOT NULL,
  drop_longitude DECIMAL(11,8) NOT NULL,

  fare DECIMAL(10,2),
  distance DECIMAL(10,3),

  status VARCHAR(20) NOT NULL DEFAULT 'assigned'
    CHECK (status IN ('assigned', 'arriving', 'started', 'completed', 'cancelled')),

  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,

  is_shared BOOLEAN NOT NULL DEFAULT FALSE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
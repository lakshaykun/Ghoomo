-- Migration 005: Bus system tables
CREATE TABLE IF NOT EXISTS bus_drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

  license_number VARCHAR(100) NOT NULL UNIQUE,

  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('approved', 'pending', 'suspended', 'rejected')),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bus_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  departure_time TIME NOT NULL,
  arrival_time TIME NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bus_stops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bus_route_stops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID NOT NULL REFERENCES bus_routes(id) ON DELETE CASCADE,
  stop_id UUID NOT NULL REFERENCES bus_stops(id) ON DELETE CASCADE,
  stop_order INT NOT NULL CHECK (stop_order > 0),
  stop_type VARCHAR(10) NOT NULL CHECK (stop_type IN ('pickup', 'dropoff', 'both')),
  arrival_time TIME NOT NULL,

  UNIQUE(route_id, stop_order),
  UNIQUE(route_id, stop_id)
);

CREATE TABLE IF NOT EXISTS bus_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID REFERENCES bus_routes(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'verified', 'cancelled', 'missing')),
  verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
  seat_number INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(route_id, seat_number)
);
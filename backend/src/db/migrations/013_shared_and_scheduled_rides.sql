-- Migration 013: Shared and Scheduled Rides Overhaul

-- 1. Update ride_requests table
ALTER TABLE ride_requests ADD COLUMN IF NOT EXISTS ride_type VARCHAR(20) NOT NULL DEFAULT 'solo' CHECK (ride_type IN ('solo', 'shared'));
ALTER TABLE ride_requests ADD COLUMN IF NOT EXISTS is_scheduled BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE ride_requests ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;
ALTER TABLE ride_requests ADD COLUMN IF NOT EXISTS acceptance_deadline TIMESTAMPTZ;
ALTER TABLE ride_requests ADD COLUMN IF NOT EXISTS min_vehicle_capacity_allowed INT;
ALTER TABLE ride_requests ADD COLUMN IF NOT EXISTS join_allowed_until TIMESTAMPTZ;
ALTER TABLE ride_requests ADD COLUMN IF NOT EXISTS vehicle_type VARCHAR(20) NOT NULL DEFAULT 'auto';
ALTER TABLE ride_requests ADD COLUMN IF NOT EXISTS estimated_fare DECIMAL(10,2);
ALTER TABLE ride_requests ADD COLUMN IF NOT EXISTS estimated_distance_km DECIMAL(10,3);

-- Migrate is_shared data if it exists
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ride_requests' AND column_name='is_shared') THEN
        UPDATE ride_requests SET ride_type = CASE WHEN is_shared THEN 'shared' ELSE 'solo' END;
        ALTER TABLE ride_requests DROP COLUMN is_shared;
    END IF;
END $$;

-- 2. Update rides table
ALTER TABLE rides ADD COLUMN IF NOT EXISTS ride_type VARCHAR(20) NOT NULL DEFAULT 'solo' CHECK (ride_type IN ('solo', 'shared'));
ALTER TABLE rides ADD COLUMN IF NOT EXISTS is_scheduled BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS acceptance_deadline TIMESTAMPTZ;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS vehicle_seats_snapshot INT;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS min_vehicle_capacity_allowed INT;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS join_allowed_until TIMESTAMPTZ;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS otp VARCHAR(10);
ALTER TABLE rides ADD COLUMN IF NOT EXISTS vehicle_type VARCHAR(20) NOT NULL DEFAULT 'auto';

-- Allow NULL driver_id for rides in OPEN/SCHEDULED state
ALTER TABLE rides ALTER COLUMN driver_id DROP NOT NULL;

-- Migrate existing statuses to new capitalized versions before applying constraint
UPDATE rides SET status = 'ACCEPTED' WHERE status IN ('assigned', 'arriving');
UPDATE rides SET status = 'ONGOING' WHERE status = 'started';
UPDATE rides SET status = 'COMPLETED' WHERE status = 'completed';
UPDATE rides SET status = 'CANCELLED' WHERE status = 'cancelled';

-- Update rides status constraint
ALTER TABLE rides DROP CONSTRAINT IF EXISTS rides_status_check;
ALTER TABLE rides ADD CONSTRAINT rides_status_check CHECK (status IN ('CREATED', 'SCHEDULED', 'OPEN', 'FULL', 'ACCEPTED', 'ONGOING', 'COMPLETED', 'CANCELLED', 'EXPIRED'));

-- Migrate is_shared data for rides
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rides' AND column_name='is_shared') THEN
        UPDATE rides SET ride_type = CASE WHEN is_shared THEN 'shared' ELSE 'solo' END;
        ALTER TABLE rides DROP COLUMN is_shared;
    END IF;
END $$;

-- 3. Create ride_participants table
CREATE TABLE IF NOT EXISTS ride_participants (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id         UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  pickup_location TEXT NOT NULL,
  drop_location   TEXT NOT NULL,

  pickup_latitude   DECIMAL(10,8),
  pickup_longitude  DECIMAL(11,8),
  drop_latitude     DECIMAL(10,8),
  drop_longitude    DECIMAL(11,8),

  passengers_count INT NOT NULL DEFAULT 1,
  is_creator       BOOLEAN NOT NULL DEFAULT FALSE,

  status          VARCHAR(20) NOT NULL CHECK (status IN ('joined','picked','dropped','cancelled')),
  fare_split      DECIMAL(10,2),

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(ride_id, user_id)
);

-- 4. Add Indexes
CREATE INDEX IF NOT EXISTS idx_ride_participants_ride ON ride_participants(ride_id);
CREATE INDEX IF NOT EXISTS idx_ride_participants_status ON ride_participants(status);

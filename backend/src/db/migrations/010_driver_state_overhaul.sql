
-- ============================================================
-- Driver State Overhaul Migration
-- ============================================================

-- 1. Add new columns to drivers table
ALTER TABLE drivers
ADD COLUMN IF NOT EXISTS availability_status VARCHAR(20) DEFAULT 'offline'
CHECK (availability_status IN ('offline', 'idle', 'on_ride')),
ADD COLUMN IF NOT EXISTS active_ride_id UUID REFERENCES rides(id) ON DELETE SET NULL;

-- 2. Create index for optimized matchmaking
CREATE INDEX IF NOT EXISTS idx_drivers_matchmaking 
ON drivers(availability_status, is_available, status);

-- 3. Create trigger function to enforce is_available logic
CREATE OR REPLACE FUNCTION fn_sync_driver_availability()
RETURNS TRIGGER AS $$
BEGIN
    -- Force is_available based on availability_status
    IF NEW.availability_status = 'idle' THEN
        NEW.is_available := TRUE;
    ELSE
        NEW.is_available := FALSE;
    END IF;

    -- Safety check: if on_ride, active_ride_id must be present (optional but good)
    -- IF NEW.availability_status = 'on_ride' AND NEW.active_ride_id IS NULL THEN
    --    RAISE EXCEPTION 'active_ride_id cannot be null when driver is on_ride';
    -- END IF;

    -- Safety check: if offline or idle, active_ride_id must be null
    IF NEW.availability_status IN ('offline', 'idle') THEN
        NEW.active_ride_id := NULL;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create trigger
DROP TRIGGER IF EXISTS trg_sync_driver_availability ON drivers;
CREATE TRIGGER trg_sync_driver_availability
BEFORE INSERT OR UPDATE ON drivers
FOR EACH ROW EXECUTE FUNCTION fn_sync_driver_availability();

-- 5. Initialize existing data (Approved and currently available drivers become idle)
UPDATE drivers 
SET availability_status = 'idle' 
WHERE is_available = TRUE AND status = 'approved';

UPDATE drivers 
SET availability_status = 'offline' 
WHERE is_available = FALSE;

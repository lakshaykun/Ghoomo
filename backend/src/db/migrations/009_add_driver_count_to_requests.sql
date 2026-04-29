ALTER TABLE ride_requests ADD COLUMN IF NOT EXISTS notified_driver_count INT DEFAULT 0;
ALTER TABLE ride_requests ADD COLUMN IF NOT EXISTS rejected_driver_count INT DEFAULT 0;

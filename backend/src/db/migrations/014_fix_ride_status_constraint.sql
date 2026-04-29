-- Align rides.status constraint with statuses used by app + backend runtime.
-- Also handles older typo'd constraint names seen in some environments.

-- Normalize legacy lowercase statuses before applying strict CHECK.
UPDATE rides SET status = 'ACCEPTED' WHERE status IN ('assigned', 'arriving');
UPDATE rides SET status = 'ON_TRIP' WHERE status IN ('started', 'ONGOING');
UPDATE rides SET status = 'COMPLETED' WHERE status = 'completed';
UPDATE rides SET status = 'CANCELLED' WHERE status = 'cancelled';
UPDATE rides SET status = 'SEARCHING' WHERE status = 'searching';

ALTER TABLE rides DROP CONSTRAINT IF EXISTS rides_status_check;
ALTER TABLE rides DROP CONSTRAINT IF EXISTS ride_status_cheack;
ALTER TABLE rides DROP CONSTRAINT IF EXISTS ride_status_check;

ALTER TABLE rides
ADD CONSTRAINT rides_status_check
CHECK (
  status IN (
    'CREATED',
    'SCHEDULED',
    'OPEN',
    'FULL',
    'ACCEPTED',
    'SEARCHING',
    'DRIVER_ARRIVED',
    'OTP_VERIFIED',
    'ON_TRIP',
    'COMPLETED',
    'CANCELLED',
    'EXPIRED'
  )
);

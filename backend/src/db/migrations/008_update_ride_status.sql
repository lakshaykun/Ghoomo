ALTER TABLE rides DROP CONSTRAINT IF EXISTS rides_status_check;
ALTER TABLE rides ADD CONSTRAINT rides_status_check CHECK (status IN ('CREATED', 'SCHEDULED', 'OPEN', 'FULL', 'ACCEPTED', 'ONGOING', 'COMPLETED', 'CANCELLED', 'EXPIRED', 'SEARCHING', 'DRIVER_ARRIVED', 'OTP_VERIFIED', 'ON_TRIP', 'assigned', 'arriving', 'started', 'completed', 'cancelled'));

ALTER TABLE rides ADD COLUMN IF NOT EXISTS otp VARCHAR(10);

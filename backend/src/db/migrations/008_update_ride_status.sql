ALTER TABLE rides DROP CONSTRAINT IF EXISTS rides_status_check;
ALTER TABLE rides ADD CONSTRAINT rides_status_check CHECK (status IN ('SEARCHING', 'ACCEPTED', 'DRIVER_ARRIVED', 'OTP_VERIFIED', 'ON_TRIP', 'COMPLETED', 'CANCELLED', 'assigned', 'arriving', 'started', 'completed', 'cancelled'));

ALTER TABLE rides ADD COLUMN IF NOT EXISTS otp VARCHAR(10);

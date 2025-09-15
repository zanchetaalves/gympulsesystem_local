-- Add confirmed column to payments table
ALTER TABLE payments ADD COLUMN IF NOT EXISTS confirmed BOOLEAN DEFAULT false;

-- Update existing payments to be confirmed (since they have 'paid' status)
UPDATE payments SET confirmed = true WHERE status = 'paid';

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_payments_confirmed ON payments(confirmed);

-- Success message
SELECT 'Confirmed column added to payments table successfully!' as message; 
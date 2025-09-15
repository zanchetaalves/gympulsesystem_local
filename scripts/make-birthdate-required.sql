-- Migration: Make birth_date required in clients table

-- First, update any NULL birth_date records to a default date
-- (You might want to handle this differently based on your business logic)
UPDATE clients 
SET birth_date = '1900-01-01' 
WHERE birth_date IS NULL;

-- Now make the column NOT NULL
ALTER TABLE clients 
ALTER COLUMN birth_date SET NOT NULL;

-- Verify the change
SELECT column_name, is_nullable, data_type 
FROM information_schema.columns 
WHERE table_name = 'clients' AND column_name = 'birth_date';

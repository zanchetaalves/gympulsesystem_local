-- Migration script to make client fields nullable
-- This script updates the clients table to allow NULL values for optional fields

-- Make CPF nullable and remove unique constraint temporarily
ALTER TABLE clients 
DROP CONSTRAINT IF EXISTS clients_cpf_key;

ALTER TABLE clients 
ALTER COLUMN cpf DROP NOT NULL;

-- Make address nullable
ALTER TABLE clients 
ALTER COLUMN address DROP NOT NULL;

-- Make birth_date nullable
ALTER TABLE clients 
ALTER COLUMN birth_date DROP NOT NULL;

-- Add unique constraint back to CPF but only for non-null values
CREATE UNIQUE INDEX IF NOT EXISTS clients_cpf_unique 
ON clients(cpf) 
WHERE cpf IS NOT NULL;

-- Update existing records with empty strings to NULL
UPDATE clients SET cpf = NULL WHERE cpf = '';
UPDATE clients SET email = NULL WHERE email = '';
UPDATE clients SET address = NULL WHERE address = '';
UPDATE clients SET photo_url = NULL WHERE photo_url = '';

-- Add comments to document the changes
COMMENT ON COLUMN clients.cpf IS 'CPF do cliente (opcional)';
COMMENT ON COLUMN clients.email IS 'Email do cliente (opcional)';
COMMENT ON COLUMN clients.address IS 'Endereço do cliente (opcional)';
COMMENT ON COLUMN clients.birth_date IS 'Data de nascimento do cliente (opcional)';
COMMENT ON COLUMN clients.photo_url IS 'URL da foto do cliente (opcional)';

SELECT 'Client table migration completed successfully!' as message;



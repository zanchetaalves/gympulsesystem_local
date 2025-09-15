-- Plan types table
CREATE TABLE IF NOT EXISTS plan_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_plan_types_name ON plan_types(name);
CREATE INDEX IF NOT EXISTS idx_plan_types_active ON plan_types(active);

-- Insert default plan types
INSERT INTO plan_types (name, description) VALUES
('Mensal', 'Plano com duração de 1 mês'),
('Trimestral', 'Plano com duração de 3 meses'),
('Semestral', 'Plano com duração de 6 meses'),
('Anual', 'Plano com duração de 12 meses')
ON CONFLICT (name) DO NOTHING;

-- Update existing plans table to reference plan_types
-- First add the foreign key column
ALTER TABLE plans ADD COLUMN IF NOT EXISTS plan_type_id UUID REFERENCES plan_types(id);

-- Update existing records to link with plan types based on the current type field
UPDATE plans SET plan_type_id = (
  SELECT id FROM plan_types WHERE name = 
    CASE 
      WHEN plans.type = 'monthly' THEN 'Mensal'
      WHEN plans.type = 'quarterly' THEN 'Trimestral'
      WHEN plans.type = 'yearly' THEN 'Anual'
      ELSE 'Mensal'
    END
) WHERE plan_type_id IS NULL;

-- Success message
SELECT 'Plan types table created successfully!' as message; 
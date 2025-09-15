-- Appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth_users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled')),
  reminder_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_client_id ON appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_date_time ON appointments(appointment_date, appointment_time);

-- Insert some sample appointments
INSERT INTO appointments (title, description, appointment_date, appointment_time, duration_minutes, status, user_id) VALUES
('Avaliação Física', 'Avaliação inicial para novo cliente', CURRENT_DATE + INTERVAL '1 day', '09:00:00', 60, 'scheduled', (SELECT id FROM auth_users WHERE role = 'admin' LIMIT 1)),
('Treino Personalizado', 'Sessão de treino personalizado', CURRENT_DATE + INTERVAL '2 days', '14:30:00', 90, 'confirmed', (SELECT id FROM auth_users WHERE role = 'admin' LIMIT 1)),
('Consulta Nutricional', 'Consulta com nutricionista', CURRENT_DATE + INTERVAL '3 days', '10:00:00', 45, 'scheduled', (SELECT id FROM auth_users WHERE role = 'admin' LIMIT 1)),
('Renovação de Plano', 'Reunião para renovação de plano', CURRENT_DATE + INTERVAL '4 days', '16:00:00', 30, 'scheduled', (SELECT id FROM auth_users WHERE role = 'admin' LIMIT 1)),
('Aula de Grupo', 'Aula de pilates em grupo', CURRENT_DATE + INTERVAL '5 days', '08:00:00', 60, 'confirmed', (SELECT id FROM auth_users WHERE role = 'admin' LIMIT 1))
ON CONFLICT DO NOTHING;

-- Success message
SELECT 'Appointments table created successfully!' as message; 
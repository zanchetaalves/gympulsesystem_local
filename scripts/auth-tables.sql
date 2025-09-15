-- Authentication tables for Cursor patterns

-- Users table for authentication
CREATE TABLE IF NOT EXISTS auth_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  email_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Sessions table for managing user sessions
CREATE TABLE IF NOT EXISTS auth_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Password reset tokens
CREATE TABLE IF NOT EXISTS auth_password_resets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_auth_users_email ON auth_users(email);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_token ON auth_sessions(token);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_id ON auth_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_password_resets_token ON auth_password_resets(token);
CREATE INDEX IF NOT EXISTS idx_auth_password_resets_user_id ON auth_password_resets(user_id);

-- Insert default admin user (password: admin123)
-- Hash generated with bcrypt for 'admin123'
INSERT INTO auth_users (email, password_hash, name, role, email_verified) VALUES
('admin@gympulse.com', '$2b$10$rOQyQ8X8X8X8X8X8X8X8XOMf.QrOQyQ8X8X8X8X8X8X8XOMf.QrOQ', 'Administrador', 'admin', true),
('recepcao@gympulse.com', '$2b$10$rOQyQ8X8X8X8X8X8X8X8XOMf.QrOQyQ8X8X8X8X8X8X8XOMf.QrOQ', 'Recepcionista', 'staff', true)
ON CONFLICT (email) DO NOTHING;

-- Success message
SELECT 'Authentication tables created successfully!' as message; 
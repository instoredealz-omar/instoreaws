-- Create missing database tables for Instoredealz application

-- Create system_logs table
CREATE TABLE IF NOT EXISTS system_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create pin_attempts table
CREATE TABLE IF NOT EXISTS pin_attempts (
  id SERIAL PRIMARY KEY,
  deal_id INTEGER REFERENCES deals(id),
  user_id INTEGER REFERENCES users(id),
  ip_address TEXT,
  success BOOLEAN DEFAULT FALSE,
  attempt_time TIMESTAMP DEFAULT NOW()
);

-- Verify tables exist
SELECT 'Tables created successfully' as status;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('system_logs', 'pin_attempts', 'users', 'deals');
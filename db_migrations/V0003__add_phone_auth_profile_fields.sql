-- Add new profile fields for phone-based auth and privacy
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS phone VARCHAR(20) UNIQUE,
  ADD COLUMN IF NOT EXISTS birth_date DATE,
  ADD COLUMN IF NOT EXISTS city VARCHAR(100),
  ADD COLUMN IF NOT EXISTS email_visible BOOLEAN DEFAULT FALSE;

-- Create index for faster phone lookups
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_birth_date ON users(birth_date);
CREATE INDEX IF NOT EXISTS idx_users_city ON users(city);
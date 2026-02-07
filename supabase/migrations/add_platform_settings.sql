-- Create platform_settings table
CREATE TABLE IF NOT EXISTS platform_settings (
  id SERIAL PRIMARY KEY,
  config_key VARCHAR(255) NOT NULL UNIQUE,
  config_value JSONB NOT NULL,
  description TEXT,
  updated_by VARCHAR(255) REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for faster lookups by key
CREATE INDEX IF NOT EXISTS idx_platform_settings_key ON platform_settings(config_key);

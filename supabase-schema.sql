-- ============================================
-- BRAND ENGINE - Supabase Database Schema
-- ============================================
-- Run this SQL in your Supabase SQL Editor

-- Brands table
CREATE TABLE IF NOT EXISTS brands (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  colors JSONB NOT NULL DEFAULT '{}',
  fonts JSONB NOT NULL DEFAULT '{}',
  voice JSONB NOT NULL DEFAULT '{}',
  logo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by TEXT
);

-- Asset content table (stores content for each brand-asset combination)
CREATE TABLE IF NOT EXISTS asset_content (
  id TEXT PRIMARY KEY, -- format: brandId-assetType
  brand_id TEXT REFERENCES brands(id) ON DELETE CASCADE,
  asset_type TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by TEXT
);

-- Presence table (tracks who is online and what they're doing)
CREATE TABLE IF NOT EXISTS presence (
  user_id TEXT PRIMARY KEY,
  user_name TEXT NOT NULL,
  user_color TEXT NOT NULL,
  active_brand_id TEXT,
  active_asset TEXT,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE presence ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated and anonymous users to read/write
-- (For a shared workspace without authentication)
CREATE POLICY "Allow all access to brands" ON brands
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all access to asset_content" ON asset_content
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all access to presence" ON presence
  FOR ALL USING (true) WITH CHECK (true);

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE brands;
ALTER PUBLICATION supabase_realtime ADD TABLE asset_content;
ALTER PUBLICATION supabase_realtime ADD TABLE presence;

-- Function to clean up stale presence entries (older than 2 minutes)
CREATE OR REPLACE FUNCTION cleanup_stale_presence()
RETURNS void AS $$
BEGIN
  DELETE FROM presence WHERE last_seen < NOW() - INTERVAL '2 minutes';
END;
$$ LANGUAGE plpgsql;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_asset_content_brand_id ON asset_content(brand_id);
CREATE INDEX IF NOT EXISTS idx_presence_last_seen ON presence(last_seen);

-- Insert demo brand if table is empty
INSERT INTO brands (id, name, colors, fonts, voice)
SELECT '1', 'Demo Brand',
  '{"primary": "#2563eb", "secondary": "#1e40af", "accent": "#f59e0b", "background": "#ffffff", "text": "#1f2937"}',
  '{"heading": "''Space Grotesk'', sans-serif", "body": "''Inter'', sans-serif"}',
  '{"tone": "professional", "formality": "sie", "tagline": "Innovation trifft Zuverlässigkeit", "dos": "nachhaltig, zukunftsorientiert", "donts": "billig, irgendwie"}'
WHERE NOT EXISTS (SELECT 1 FROM brands LIMIT 1);

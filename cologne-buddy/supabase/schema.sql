-- Cologne Buddy Database Schema
-- Run this in your Supabase SQL Editor at https://supabase.com/dashboard

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Fragrances table
CREATE TABLE IF NOT EXISTS public.fragrances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  brand TEXT NOT NULL DEFAULT 'Unknown',
  concentration TEXT NOT NULL DEFAULT 'Unknown',
  image_url TEXT,
  barcode TEXT,
  description TEXT DEFAULT '',
  notes JSONB NOT NULL DEFAULT '{"top": [], "middle": [], "base": []}',
  seasons TEXT[] NOT NULL DEFAULT '{}',
  occasions TEXT[] NOT NULL DEFAULT '{}',
  preset_tags TEXT[] NOT NULL DEFAULT '{}',
  custom_tags TEXT[] NOT NULL DEFAULT '{}',
  review_sources JSONB NOT NULL DEFAULT '[]',
  personal_notes TEXT NOT NULL DEFAULT '',
  rating INTEGER NOT NULL DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  quantity_level INTEGER NOT NULL DEFAULT 100 CHECK (quantity_level >= 0 AND quantity_level <= 100),
  is_inspired_by BOOLEAN NOT NULL DEFAULT FALSE,
  inspired_by_original TEXT,
  is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS fragrances_user_id_idx ON public.fragrances(user_id);
CREATE INDEX IF NOT EXISTS fragrances_created_at_idx ON public.fragrances(created_at DESC);
CREATE INDEX IF NOT EXISTS fragrances_is_favorite_idx ON public.fragrances(user_id, is_favorite);

-- Row Level Security (RLS)
ALTER TABLE public.fragrances ENABLE ROW LEVEL SECURITY;

-- Users can only see and modify their own fragrances
CREATE POLICY "Users can view their own fragrances"
  ON public.fragrances FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own fragrances"
  ON public.fragrances FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own fragrances"
  ON public.fragrances FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own fragrances"
  ON public.fragrances FOR DELETE
  USING (auth.uid() = user_id);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER fragrances_updated_at
  BEFORE UPDATE ON public.fragrances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Storage bucket for fragrance images
-- Run this after creating the table:
INSERT INTO storage.buckets (id, name, public)
VALUES ('fragrance-images', 'fragrance-images', true)
ON CONFLICT DO NOTHING;

-- Storage policy: users can upload their own images
CREATE POLICY "Users can upload fragrance images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'fragrance-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can view fragrance images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'fragrance-images');

CREATE POLICY "Users can delete their own fragrance images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'fragrance-images' AND auth.uid()::text = (storage.foldername(name))[1]);

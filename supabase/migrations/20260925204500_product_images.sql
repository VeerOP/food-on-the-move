-- MIGRATION: PRODUCT IMAGES STORAGE & INVENTORY COLUMN

-- 1. Add images jsonb column to product_inventory
ALTER TABLE public.product_inventory 
ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;

-- 2. Create public storage bucket for product images if it does not exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage RLS Policies for product-images
DO $$
BEGIN
  -- Public can read images
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Public can view product images' AND tablename = 'objects' AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "Public can view product images" ON storage.objects
      FOR SELECT USING (bucket_id = 'product-images');
  END IF;

  -- Authenticated users (admin) can upload images
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can upload product images' AND tablename = 'objects' AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "Authenticated users can upload product images" ON storage.objects
      FOR INSERT WITH CHECK (bucket_id = 'product-images');
  END IF;

  -- Authenticated users (admin) can update images
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can update product images' AND tablename = 'objects' AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "Authenticated users can update product images" ON storage.objects
      FOR UPDATE USING (bucket_id = 'product-images');
  END IF;

  -- Authenticated users (admin) can delete images
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can delete product images' AND tablename = 'objects' AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "Authenticated users can delete product images" ON storage.objects
      FOR DELETE USING (bucket_id = 'product-images');
  END IF;
END $$;

-- ==========================================================
-- FOOD ON THE MOVE — COMPLETE DATABASE CONFIGURATION
-- ==========================================================
-- Paste this entire script into your Supabase Dashboard -> SQL Editor and click "Run".
-- This will set up all required tables, triggers, indexes, and policies.

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Clean existing policy before creating
DROP POLICY IF EXISTS "Users manage own profile" ON public.profiles;
CREATE POLICY "Users manage own profile" ON public.profiles 
  FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Trigger for auto-profile creation on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;


-- 2. Cart Items Table
CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_slug TEXT NOT NULL,
  product_name TEXT NOT NULL,
  product_image TEXT,
  price_inr NUMERIC(10,2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  variant TEXT NOT NULL DEFAULT 'single',
  pack_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_slug, variant)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cart_items TO authenticated;
GRANT ALL ON public.cart_items TO service_role;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- Clean existing policy before creating
DROP POLICY IF EXISTS "Users manage own cart" ON public.cart_items;
CREATE POLICY "Users manage own cart" ON public.cart_items 
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- 3. Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending_payment',
  subtotal_inr NUMERIC(10,2) NOT NULL,
  delivery_fee_inr NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_inr NUMERIC(10,2) NOT NULL,
  delivery_address TEXT NOT NULL,
  landmark TEXT,
  pincode TEXT,
  delivery_lat NUMERIC(10,7) NOT NULL,
  delivery_lng NUMERIC(10,7) NOT NULL,
  delivery_distance_km NUMERIC(6,3) NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  payment_method TEXT NOT NULL DEFAULT 'upi',
  upi_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Clean existing policies before creating
DROP POLICY IF EXISTS "Users view own orders" ON public.orders;
CREATE POLICY "Users view own orders" ON public.orders 
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own orders" ON public.orders;
CREATE POLICY "Users insert own orders" ON public.orders 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own orders" ON public.orders;
CREATE POLICY "Users update own orders" ON public.orders 
  FOR UPDATE USING (auth.uid() = user_id);


-- 4. Order Items Table
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_slug TEXT NOT NULL,
  product_name TEXT NOT NULL,
  product_image TEXT,
  price_inr NUMERIC(10,2) NOT NULL,
  quantity INTEGER NOT NULL,
  line_total_inr NUMERIC(10,2) NOT NULL,
  variant TEXT NOT NULL DEFAULT 'single',
  pack_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Clean existing policies before creating
DROP POLICY IF EXISTS "Users view own order items" ON public.order_items;
CREATE POLICY "Users view own order items" ON public.order_items 
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own order items" ON public.order_items;
CREATE POLICY "Users insert own order items" ON public.order_items 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);


-- 5. User Roles and Permissions (Admin Setup)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'customer');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Clean existing policy before creating
DROP POLICY IF EXISTS "Users view own roles" ON public.user_roles;
CREATE POLICY "Users view own roles" ON public.user_roles 
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Function to check role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Admin access policies on orders, order items, and profiles
DROP POLICY IF EXISTS "Admins view all orders" ON public.orders;
CREATE POLICY "Admins view all orders" ON public.orders 
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins update all orders" ON public.orders;
CREATE POLICY "Admins update all orders" ON public.orders 
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins view all order items" ON public.order_items;
CREATE POLICY "Admins view all order items" ON public.order_items 
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins view all profiles" ON public.profiles;
CREATE POLICY "Admins view all profiles" ON public.profiles 
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));


-- Trigger to automatically update orders.updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_set_updated_at ON public.orders;
CREATE TRIGGER orders_set_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- Auto-promote admin role trigger on user signup
CREATE OR REPLACE FUNCTION public.assign_admin_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email = 'veernagda45@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_assign_admin ON auth.users;
CREATE TRIGGER on_auth_user_created_assign_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.assign_admin_role();

-- Promote admin user if they already exist
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role FROM auth.users WHERE email = 'veernagda45@gmail.com'
ON CONFLICT DO NOTHING;


-- 6. Product Reviews Table (Organic User Reviews)
CREATE TABLE IF NOT EXISTS public.product_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_slug TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL,
  rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.product_reviews TO anon, authenticated;
GRANT ALL ON public.product_reviews TO service_role;
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view reviews" ON public.product_reviews;
CREATE POLICY "Public can view reviews" ON public.product_reviews 
  FOR SELECT TO PUBLIC USING (true);

DROP POLICY IF EXISTS "Anyone can submit organic reviews" ON public.product_reviews;
CREATE POLICY "Anyone can submit organic reviews" ON public.product_reviews 
  FOR INSERT TO PUBLIC WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_product_reviews_slug ON public.product_reviews(product_slug, created_at DESC);


-- 7. Product Inventory & Storage Bucket Configuration
CREATE TABLE IF NOT EXISTS public.product_inventory (
  product_slug TEXT PRIMARY KEY,
  initial_stock INTEGER NOT NULL DEFAULT 0,
  sold_stock INTEGER NOT NULL DEFAULT 0,
  price_inr NUMERIC(10,2),
  images JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.product_inventory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read product inventory" ON public.product_inventory;
CREATE POLICY "Public read product inventory" ON public.product_inventory
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow update product inventory" ON public.product_inventory;
CREATE POLICY "Allow update product inventory" ON public.product_inventory
  FOR ALL USING (true);

-- Product Images Storage Bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Public can view product images' AND tablename = 'objects' AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "Public can view product images" ON storage.objects
      FOR SELECT USING (bucket_id = 'product-images');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can upload product images' AND tablename = 'objects' AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "Authenticated users can upload product images" ON storage.objects
      FOR INSERT WITH CHECK (bucket_id = 'product-images');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can update product images' AND tablename = 'objects' AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "Authenticated users can update product images" ON storage.objects
      FOR UPDATE USING (bucket_id = 'product-images');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can delete product images' AND tablename = 'objects' AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "Authenticated users can delete product images" ON storage.objects
      FOR DELETE USING (bucket_id = 'product-images');
  END IF;
END $$;


-- 8. Coupons & Discounts Configuration
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS coupon_code TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS discount_inr NUMERIC(10,2) DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  discount_percent NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 100),
  is_free_delivery BOOLEAN NOT NULL DEFAULT false,
  total_coupons INTEGER NOT NULL DEFAULT 100 CHECK (total_coupons >= 0),
  available_coupons INTEGER NOT NULL DEFAULT 100 CHECK (available_coupons >= 0),
  used_count INTEGER NOT NULL DEFAULT 0 CHECK (used_count >= 0),
  min_order_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read coupons" ON public.coupons;
CREATE POLICY "Public read coupons" ON public.coupons
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow manage coupons" ON public.coupons;
CREATE POLICY "Allow manage coupons" ON public.coupons
  FOR ALL USING (true);

-- Seed Initial Custom Coupons (25% & 35% with and without free delivery)
INSERT INTO public.coupons (code, discount_percent, is_free_delivery, total_coupons, available_coupons, used_count, description)
VALUES 
  ('SAVE25', 25, false, 100, 100, 0, '25% OFF on your entire order (Standard delivery)'),
  ('SAVE25FREE', 25, true, 100, 100, 0, '25% OFF + FREE Delivery across India'),
  ('SAVE35', 35, false, 100, 100, 0, '35% OFF on your entire order (Standard delivery)'),
  ('SAVE35FREE', 35, true, 100, 100, 0, '35% OFF + FREE Delivery across India'),
  ('FOMO25', 25, false, 100, 100, 0, '25% OFF on Food On The Move treats'),
  ('FOMO25FREE', 25, true, 100, 100, 0, '25% OFF + FREE Delivery on your order'),
  ('FOMO35', 35, false, 100, 100, 0, '35% OFF on Food On The Move treats'),
  ('FOMO35FREE', 35, true, 100, 100, 0, '35% OFF + FREE Delivery on your order'),
  ('FOMO20', 20, false, 500, 500, 0, 'Special 20% discount on order'),
  ('DELIVERYONUS', 0, true, 1000, 1000, 0, 'Free ₹0 delivery fee coupon')
ON CONFLICT (code) DO NOTHING;

-- Atomic coupon redemption stored procedure (prevents race conditions across concurrent customer payments)
CREATE OR REPLACE FUNCTION public.redeem_coupon(p_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_coupon public.coupons%ROWTYPE;
BEGIN
  SELECT * INTO v_coupon
  FROM public.coupons
  WHERE UPPER(code) = UPPER(TRIM(p_code))
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Coupon not found');
  END IF;

  IF NOT v_coupon.is_active THEN
    RETURN jsonb_build_object('success', false, 'error', 'Coupon is inactive');
  END IF;

  IF v_coupon.available_coupons <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Coupon quota is depleted');
  END IF;

  UPDATE public.coupons
  SET available_coupons = available_coupons - 1,
      used_count = used_count + 1,
      updated_at = now()
  WHERE id = v_coupon.id;

  RETURN jsonb_build_object(
    'success', true,
    'available_coupons', v_coupon.available_coupons - 1,
    'used_count', v_coupon.used_count + 1
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.redeem_coupon(TEXT) TO anon, authenticated, service_role;


-- 9. Realtime Synchronization Publication
-- Ensures real-time updates are broadcast to all browser tabs, devices, and logins
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.coupons;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.product_inventory;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;



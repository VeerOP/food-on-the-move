
ALTER TABLE public.cart_items
  ADD COLUMN IF NOT EXISTS variant text NOT NULL DEFAULT 'single',
  ADD COLUMN IF NOT EXISTS pack_items jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS variant text NOT NULL DEFAULT 'single',
  ADD COLUMN IF NOT EXISTS pack_items jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS landmark text,
  ADD COLUMN IF NOT EXISTS pincode text;

-- Drop the old unique-by-slug behavior implicit in code by ensuring different variants coexist.
-- (No unique constraint existed previously; nothing to alter.)

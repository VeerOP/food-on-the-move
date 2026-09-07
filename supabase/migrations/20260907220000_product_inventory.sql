-- PRODUCT INVENTORY TABLE & REALTIME DEDUCTION TRIGGER

CREATE TABLE IF NOT EXISTS public.product_inventory (
  product_slug TEXT PRIMARY KEY,
  initial_stock INTEGER NOT NULL DEFAULT 0,
  sold_stock INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.product_inventory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read product inventory" ON public.product_inventory;
CREATE POLICY "Public read product inventory" ON public.product_inventory
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow update product inventory" ON public.product_inventory;
CREATE POLICY "Allow update product inventory" ON public.product_inventory
  FOR ALL USING (true);

-- Populate initial stock values
INSERT INTO public.product_inventory (product_slug, initial_stock, sold_stock)
VALUES
  ('oats-sticks', 5, 0),
  ('chocochips-sticks', 3, 0),
  ('almond-sticks', 4, 0),
  ('double-chocolate-cookies', 1, 0),
  ('bajra-jaggery-cookies', 6, 0),
  ('nachni-jaggery-cookies', 4, 0),
  ('jowaar-jaggery-cookies', 2, 0),
  ('multigrain-jaggery-cookies', 2, 0),
  ('kunafa', 0, 0),
  ('millet-baklava', 0, 0),
  ('vanilla-chocolate-cookies', 0, 0),
  ('coffee-walnut-cookies', 0, 0)
ON CONFLICT (product_slug) DO UPDATE
SET initial_stock = EXCLUDED.initial_stock;

-- Automatically deduct inventory when order status transitions to 'paid'
CREATE OR REPLACE FUNCTION public.deduct_inventory_on_order()
RETURNS TRIGGER AS $$
DECLARE
  item RECORD;
BEGIN
  IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid') THEN
    FOR item IN 
      SELECT product_slug, quantity 
      FROM public.order_items 
      WHERE order_id = NEW.id
    LOOP
      UPDATE public.product_inventory
      SET sold_stock = sold_stock + item.quantity,
          updated_at = now()
      WHERE product_slug = item.product_slug;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_deduct_inventory ON public.orders;
CREATE TRIGGER trigger_deduct_inventory
AFTER UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.deduct_inventory_on_order();

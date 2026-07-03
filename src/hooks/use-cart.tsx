import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { CATALOG, VARIANT_META, Variant, variantPrice } from "@/lib/catalog";
import { toast } from "sonner";

export type CartItem = {
  id: string;
  product_slug: string;
  product_name: string;
  product_image: string | null;
  price_inr: number;
  quantity: number;
  variant: Variant;
  pack_items: string[]; // slugs of mixed pack contents (for po3/po4)
};

export type AddOptions = {
  variant?: Variant;
  packItems?: string[];
  qty?: number;
};

type CartCtx = {
  items: CartItem[];
  loading: boolean;
  count: number;
  subtotal: number;
  addToCart: (slug: string, opts?: AddOptions) => Promise<void>;
  updateQty: (id: string, qty: number) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refresh: () => Promise<void>;
};

const Ctx = createContext<CartCtx>({
  items: [],
  loading: false,
  count: 0,
  subtotal: 0,
  addToCart: async () => {},
  updateQty: async () => {},
  removeItem: async () => {},
  clearCart: async () => {},
  refresh: async () => {},
});

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setItems([]);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("cart_items")
      .select("id, product_slug, product_name, product_image, price_inr, quantity, variant, pack_items")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });
    if (error) {
      toast.error("Failed to load cart");
    } else {
      setItems(
        (data ?? []).map((i: any) => ({
          ...i,
          price_inr: Number(i.price_inr),
          variant: (i.variant ?? "single") as Variant,
          pack_items: Array.isArray(i.pack_items) ? i.pack_items : [],
        })) as CartItem[]
      );
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addToCart = async (slug: string, opts: AddOptions = {}) => {
    if (!user) {
      toast.error("Please sign in to add items to your cart");
      return;
    }
    const variant: Variant = opts.variant ?? "single";
    const qty = opts.qty ?? 1;
    const packItems = opts.packItems ?? [];
    const product = CATALOG[slug];
    if (!product) return;

    // Validate mixed pack size
    if (variant !== "single") {
      const expected = VARIANT_META[variant].count;
      if (packItems.length !== expected) {
        toast.error(`Select exactly ${expected} items for ${VARIANT_META[variant].label}`);
        return;
      }
    }

    const price = variantPrice(variant, slug);

    // Merge same-variant single items; keep mixed packs as separate lines
    if (variant === "single") {
      const existing = items.find((i) => i.product_slug === slug && i.variant === "single");
      if (existing) {
        await updateQty(existing.id, existing.quantity + qty);
        return;
      }
    }

    const { error } = await supabase.from("cart_items").insert({
      user_id: user.id,
      product_slug: slug,
      product_name: product.name,
      product_image: product.image,
      price_inr: price,
      quantity: qty,
      variant,
      pack_items: packItems,
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`${product.name} · ${VARIANT_META[variant].label} added`);
      await refresh();
    }
  };

  const updateQty = async (id: string, qty: number) => {
    if (!user) return;
    if (qty <= 0) {
      await removeItem(id);
      return;
    }
    const { error } = await supabase
      .from("cart_items")
      .update({ quantity: qty, updated_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .eq("id", id);
    if (error) toast.error(error.message);
    else await refresh();
  };

  const removeItem = async (id: string) => {
    if (!user) return;
    const { error } = await supabase
      .from("cart_items")
      .delete()
      .eq("user_id", user.id)
      .eq("id", id);
    if (error) toast.error(error.message);
    else await refresh();
  };

  const clearCart = async () => {
    if (!user) return;
    const { error } = await supabase
      .from("cart_items")
      .delete()
      .eq("user_id", user.id);
    if (error) toast.error(error.message);
    else setItems([]);
  };

  const count = items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = items.reduce((s, i) => s + i.quantity * i.price_inr, 0);

  return (
    <Ctx.Provider
      value={{ items, loading, count, subtotal, addToCart, updateQty, removeItem, clearCart, refresh }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useCart = () => useContext(Ctx);

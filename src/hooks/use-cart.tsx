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
  couponCode: string;
  discount: number;
  addToCart: (slug: string, opts?: AddOptions) => Promise<void>;
  updateQty: (id: string, qty: number) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refresh: () => Promise<void>;
  applyCoupon: (code: string) => boolean;
  removeCoupon: () => void;
};

const Ctx = createContext<CartCtx>({
  items: [],
  loading: false,
  count: 0,
  subtotal: 0,
  couponCode: "",
  discount: 0,
  addToCart: async () => {},
  updateQty: async () => {},
  removeItem: async () => {},
  clearCart: async () => {},
  refresh: async () => {},
  applyCoupon: () => false,
  removeCoupon: () => {},
});

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [couponCode, setCouponCode] = useState<string>("");

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

  // Synchronizer for free FOMO Steel Bottle gift
  useEffect(() => {
    if (!user || loading) return;

    const syncFreeGift = async () => {
      const fomoItem = items.find((i) => i.product_slug === "fomo-steel-bottle");
      const baseSubtotal = items
        .filter((i) => i.product_slug !== "fomo-steel-bottle")
        .reduce((sum, item) => sum + item.quantity * item.price_inr, 0);

      // Reset user rejection if they drop below threshold
      if (baseSubtotal < 1000) {
        localStorage.removeItem("rejected_free_gift");
      }

      const rejected = localStorage.getItem("rejected_free_gift") === "true";
      const shouldHaveGift = baseSubtotal >= 1000 && !couponCode && !rejected;

      if (shouldHaveGift && !fomoItem) {
        const product = CATALOG["fomo-steel-bottle"];
        if (!product) return;

        // Optimistically insert a temp item to avoid duplicate database operations
        setItems((prev) => [
          ...prev,
          {
            id: "temp-fomo",
            product_slug: "fomo-steel-bottle",
            product_name: product.name,
            product_image: product.image,
            price_inr: 0,
            quantity: 1,
            variant: "single",
            pack_items: [],
          },
        ]);

        await supabase.from("cart_items").insert({
          user_id: user.id,
          product_slug: "fomo-steel-bottle",
          product_name: product.name,
          product_image: product.image,
          price_inr: 0,
          quantity: 1,
          variant: "single",
          pack_items: [],
        });
        await refresh();
      } else if (!shouldHaveGift && fomoItem) {
        // Optimistically remove
        setItems((prev) => prev.filter((i) => i.product_slug !== "fomo-steel-bottle"));

        await supabase
          .from("cart_items")
          .delete()
          .eq("user_id", user.id)
          .eq("product_slug", "fomo-steel-bottle");
        await refresh();
      } else if (fomoItem && fomoItem.quantity !== 1) {
        await supabase
          .from("cart_items")
          .update({ quantity: 1 })
          .eq("user_id", user.id)
          .eq("id", fomoItem.id);
        await refresh();
      }
    };

    syncFreeGift();
  }, [items, user, loading, refresh]);

  const addToCart = async (slug: string, opts: AddOptions = {}) => {
    if (!user) {
      toast.error("Please sign in to add items to your cart");
      return;
    }
    const variant: Variant = opts.variant ?? "single";
    const product = CATALOG[slug];
    if (!product) return;

    // Apply MOQ constraint
    let qty = opts.qty ?? 1;
    if (product.moq && qty < product.moq) {
      qty = product.moq;
    }

    // Validate mixed pack size
    let packItems = opts.packItems ?? [];
    if (variant !== "single") {
      const expected = VARIANT_META[variant].count;
      if (packItems.length === 0) {
        packItems = Array(expected).fill(slug);
      }
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
      toast.success(`${product.name} added to cart`);
      await refresh();
    }
  };

  const updateQty = async (id: string, qty: number) => {
    if (!user) return;
    if (qty <= 0) {
      await removeItem(id);
      return;
    }

    const item = items.find((i) => i.id === id);
    if (!item) return;
    const product = CATALOG[item.product_slug];

    // Enforce MOQ check
    if (product?.moq && qty < product.moq) {
      toast.error(`Minimum order quantity for ${product.name} is ${product.moq}. Click the delete icon to remove.`);
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
    const item = items.find((i) => i.id === id);
    if (item && item.product_slug === "fomo-steel-bottle") {
      localStorage.setItem("rejected_free_gift", "true");
    }
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
  const discount = couponCode.toUpperCase() === "FOMO20" ? Math.round(subtotal * 0.20) : 0;

  const applyCoupon = (code: string) => {
    if (code.toUpperCase() === "FOMO20") {
      setCouponCode("FOMO20");
      toast.success("Coupon FOMO20 applied! 20% discount added.");
      return true;
    }
    toast.error("Invalid coupon code");
    return false;
  };

  const removeCoupon = () => {
    setCouponCode("");
    toast.success("Coupon removed");
  };

  return (
    <Ctx.Provider
      value={{
        items,
        loading,
        count,
        subtotal,
        couponCode,
        discount,
        addToCart,
        updateQty,
        removeItem,
        clearCart,
        refresh,
        applyCoupon,
        removeCoupon,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useCart = () => useContext(Ctx);


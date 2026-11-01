import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { CATALOG, VARIANT_META, Variant, variantPrice, getProductMainImage } from "@/lib/catalog";
import { getAvailableStock, isSoldOut } from "@/lib/inventory";
import { isMumbaiAddress } from "@/lib/delivery";
import { toast } from "sonner";
import { AddedToCartModal, AddedItemInfo } from "@/components/AddedToCartModal";
import { Coupon, validateCoupon, getCouponByCode, fetchCoupons, isFreeBottleActive, subscribeCoupons } from "@/lib/coupons";

export const FREE_BOTTLE_OFFER_ACTIVE = true;
export const FREE_BOTTLE_THRESHOLD = 1200;

export type CartItem = {
  id: string;
  product_slug: string;
  product_name: string;
  product_image: string | null;
  price_inr: number;
  quantity: number;
  variant: Variant;
  pack_items: string[];
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
  activeCoupon: Coupon | null;
  isFreeDeliveryCoupon: boolean;
  isFreeBottleOfferActive: boolean;
  netSubtotal: number;
  isFreeBottleEligible: boolean;
  bottleIneligibilityReason: "disabled" | "coupon_disallowed" | "below_threshold" | null;
  addToCart: (slug: string, opts?: AddOptions) => Promise<void>;
  updateQty: (id: string, qty: number) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refresh: () => Promise<void>;
  applyCoupon: (code: string, context?: { pincode?: string; address?: string }) => boolean;
  removeCoupon: () => void;
  openAddedModal: (info: AddedItemInfo) => void;
  closeAddedModal: () => void;
  getItemQuantity: (slug: string, variant?: Variant) => number;
  getItem: (slug: string, variant?: Variant) => CartItem | undefined;
  incrementQty: (slug: string, variant?: Variant) => Promise<void>;
  decrementQty: (slug: string, variant?: Variant) => Promise<void>;
};

const CART_STORAGE_KEY = "fomo_cart_items";
const COUPON_STORAGE_KEY = "fomo_coupon_code";

function loadLocalCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((i: Record<string, unknown>) => ({
        id: String(i.id || ""),
        product_slug: String(i.product_slug || ""),
        product_name: String(i.product_name || ""),
        product_image: typeof i.product_image === "string" ? i.product_image : null,
        price_inr: Number(i.price_inr) || 0,
        quantity: Number(i.quantity) || 1,
        variant: (i.variant ?? "single") as Variant,
        pack_items: Array.isArray(i.pack_items) ? (i.pack_items as string[]) : [],
      }));
    }
  } catch (e) {
    console.warn("Failed to parse local cart:", e);
  }
  return [];
}

function saveLocalCart(items: CartItem[]) {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.warn("Failed to save local cart:", e);
  }
}

const Ctx = createContext<CartCtx>({
  items: [],
  loading: false,
  count: 0,
  subtotal: 0,
  couponCode: "",
  discount: 0,
  activeCoupon: null,
  isFreeDeliveryCoupon: false,
  isFreeBottleOfferActive: true,
  netSubtotal: 0,
  isFreeBottleEligible: false,
  bottleIneligibilityReason: null,
  addToCart: async () => {},
  updateQty: async () => {},
  removeItem: async () => {},
  clearCart: async () => {},
  refresh: async () => {},
  applyCoupon: () => false,
  removeCoupon: () => {},
  openAddedModal: () => {},
  closeAddedModal: () => {},
  getItemQuantity: () => 0,
  getItem: () => undefined,
  incrementQty: async () => {},
  decrementQty: async () => {},
});

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  // Hydrate immediately from localStorage on initial render to prevent empty cart flash on reload
  const [items, setItems] = useState<CartItem[]>(() => loadLocalCart());
  const [loading, setLoading] = useState(false);
  const [couponCode, setCouponCode] = useState<string>(() => {
    const saved = localStorage.getItem(COUPON_STORAGE_KEY) || "";
    if (saved.toUpperCase() === "DELIVERYONUS") {
      // Do not auto-apply DELIVERYONUS; clear stale stored value
      localStorage.removeItem(COUPON_STORAGE_KEY);
      return "";
    }
    return saved;
  });
  const [addedItem, setAddedItem] = useState<AddedItemInfo | null>(null);
  const [isAddedModalOpen, setIsAddedModalOpen] = useState(false);
  const [isFreeBottleOfferActive, setIsFreeBottleOfferActive] = useState<boolean>(() => isFreeBottleActive());
  const hasMergedUserCart = useRef<string | null>(null);

  useEffect(() => {
    const updateBottleStatus = () => {
      setIsFreeBottleOfferActive(isFreeBottleActive());
    };

    const unsub = subscribeCoupons(() => {
      updateBottleStatus();
    });

    window.addEventListener("fomo_free_bottle_changed", updateBottleStatus);
    window.addEventListener("storage", updateBottleStatus);

    return () => {
      unsub();
      window.removeEventListener("fomo_free_bottle_changed", updateBottleStatus);
      window.removeEventListener("storage", updateBottleStatus);
    };
  }, []);

  // Sync state to localStorage whenever items change
  const updateItems = useCallback((newItems: CartItem[] | ((prev: CartItem[]) => CartItem[])) => {
    setItems((prev) => {
      const resolved = typeof newItems === "function" ? newItems(prev) : newItems;
      saveLocalCart(resolved);
      return resolved;
    });
  }, []);

  const refresh = useCallback(async (isInitial = false) => {
    if (!user) {
      // Guest mode: load and stay with local storage
      const local = loadLocalCart();
      setItems(local);
      return;
    }

    if (isInitial) setLoading(true);

    try {
      // If user just logged in and we had guest items in localStorage, migrate them to Supabase
      if (hasMergedUserCart.current !== user.id) {
        hasMergedUserCart.current = user.id;
        const local = loadLocalCart();
        if (local.length > 0) {
          for (const item of local) {
            if (item.variant === "free") continue; // will be handled by gift synchronizer
            const { error: upsertErr } = await supabase.from("cart_items").upsert(
              {
                user_id: user.id,
                product_slug: item.product_slug,
                product_name: item.product_name,
                product_image: item.product_image,
                price_inr: item.price_inr,
                quantity: item.quantity,
                variant: item.variant,
                pack_items: item.pack_items,
              },
              { onConflict: "user_id,product_slug,variant" }
            );
            if (upsertErr) console.warn("Could not merge local item into Supabase:", upsertErr);
          }
        }
      }

      const { data, error } = await supabase
        .from("cart_items")
        .select("id, product_slug, product_name, product_image, price_inr, quantity, variant, pack_items")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (error) {
        console.warn("Failed to load cart from Supabase, falling back to local:", error);
      } else if (data) {
        const mapped: CartItem[] = data.map((i: Record<string, unknown>) => ({
          id: String(i.id || ""),
          product_slug: String(i.product_slug || ""),
          product_name: String(i.product_name || ""),
          product_image: typeof i.product_image === "string" ? i.product_image : null,
          price_inr: Number(i.price_inr) || 0,
          quantity: Number(i.quantity) || 1,
          variant: (i.variant ?? "single") as Variant,
          pack_items: Array.isArray(i.pack_items) ? (i.pack_items as string[]) : [],
        }));
        setItems(mapped);
        saveLocalCart(mapped);
      }
    } catch (e) {
      console.warn("Error refreshing cart:", e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh(true);
  }, [refresh]);

  // Synchronizer for free FOMO Steel Bottle gift (works for both guest & signed in users)
  useEffect(() => {
    if (loading) return;

    const syncFreeGift = async () => {
      // Inactive free bottle offer: clean up any free bottle items from cart
      if (!isFreeBottleOfferActive) {
        const freeItems = items.filter(
          (i) => i.product_slug === "fomo-steel-bottle" && (i.variant === "free" || i.price_inr === 0)
        );
        if (freeItems.length > 0) {
          if (user) {
            for (const it of freeItems) {
              await supabase.from("cart_items").delete().eq("id", it.id);
            }
          }
          updateItems((prev) =>
            prev.filter(
              (i) => !(i.product_slug === "fomo-steel-bottle" && (i.variant === "free" || i.price_inr === 0))
            )
          );
        }
        return;
      }

      // Legacy cleanup: delete any stale "single" variant steel bottle with price 0
      const legacyItem = items.find((i) => i.product_slug === "fomo-steel-bottle" && i.variant === "single" && i.price_inr === 0);
      if (legacyItem) {
        if (user) {
          await supabase.from("cart_items").delete().eq("id", legacyItem.id);
        }
        updateItems((prev) => prev.filter((i) => i.id !== legacyItem.id));
        return;
      }

      const fomoItem = items.find((i) => i.product_slug === "fomo-steel-bottle" && i.variant === "free");
      const baseSubtotal = items
        .filter((i) => i.variant !== "free")
        .reduce((sum, item) => sum + item.quantity * item.price_inr, 0);

      // Determine coupon effect on Free Bottle eligibility
      const activeCpn = couponCode ? getCouponByCode(couponCode) : null;
      let calculatedDiscount = 0;
      if (activeCpn && activeCpn.discount_percent > 0) {
        calculatedDiscount = Math.round(baseSubtotal * (activeCpn.discount_percent / 100));
      } else if (couponCode.toUpperCase() === "FOMO20") {
        calculatedDiscount = Math.round(baseSubtotal * 0.20);
      }
      const netSubtotal = Math.max(0, baseSubtotal - calculatedDiscount);

      // Eligibility calculation:
      // 1. Globally enabled
      // 2. If no coupon: baseSubtotal >= 1200
      // 3. If FREEBOTTLE coupon: baseSubtotal >= 1200
      // 4. If other coupon: coupon must allow free bottle (allow_free_bottle !== false)
      //    AND the value AFTER applying the coupon must also be >= 1200
      let isEligible = false;
      if (isFreeBottleOfferActive) {
        if (!couponCode) {
          isEligible = baseSubtotal >= FREE_BOTTLE_THRESHOLD;
        } else if (couponCode.toUpperCase() === "FREEBOTTLE") {
          isEligible = baseSubtotal >= FREE_BOTTLE_THRESHOLD;
        } else {
          const allowsBottle = activeCpn ? activeCpn.allow_free_bottle !== false : true;
          isEligible = allowsBottle && netSubtotal >= FREE_BOTTLE_THRESHOLD;
        }
      }

      // Reset user rejection if they drop below threshold
      if (netSubtotal < FREE_BOTTLE_THRESHOLD) {
        localStorage.removeItem("rejected_free_gift");
      }

      const rejected = localStorage.getItem("rejected_free_gift") === "true";
      const shouldHaveGift = isEligible && !rejected;

      if (shouldHaveGift && !fomoItem) {
        const product = CATALOG["fomo-steel-bottle"];
        if (!product) return;

        const mainImg = getProductMainImage("fomo-steel-bottle") || product.image;

        const freeItem: CartItem = {
          id: user ? `temp-fomo-${Date.now()}` : `guest-fomo-${Date.now()}`,
          product_slug: "fomo-steel-bottle",
          product_name: product.name,
          product_image: mainImg,
          price_inr: 0,
          quantity: 1,
          variant: "free",
          pack_items: [],
        };

        if (user) {
          const { data } = await supabase.from("cart_items").insert({
            user_id: user.id,
            product_slug: "fomo-steel-bottle",
            product_name: product.name,
            product_image: mainImg,
            price_inr: 0,
            quantity: 1,
            variant: "free",
            pack_items: [],
          }).select("id").single();
          if (data?.id) freeItem.id = data.id;
        }

        updateItems((prev) => [...prev.filter((i) => i.variant !== "free"), freeItem]);
        toast.success("🎁 Free Food On The Move Bottle added to your cart!");
      } else if (!shouldHaveGift && fomoItem) {
        if (user) {
          await supabase
            .from("cart_items")
            .delete()
            .eq("user_id", user.id)
            .eq("product_slug", "fomo-steel-bottle")
            .eq("variant", "free");
        }
        updateItems((prev) => prev.filter((i) => i.variant !== "free"));
        if (activeCpn && activeCpn.allow_free_bottle === false) {
          toast.info(`Note: Coupon ${couponCode} cannot be combined with the Free Bottle offer.`);
        } else if (couponCode && netSubtotal < FREE_BOTTLE_THRESHOLD && baseSubtotal >= FREE_BOTTLE_THRESHOLD) {
          toast.info(`Cart total after ${couponCode} discount is ₹${netSubtotal.toFixed(0)} (below ₹1,200). Free Bottle removed.`);
        }
      } else if (fomoItem && fomoItem.quantity !== 1) {
        if (user) {
          await supabase
            .from("cart_items")
            .update({ quantity: 1 })
            .eq("user_id", user.id)
            .eq("id", fomoItem.id);
        }
        updateItems((prev) =>
          prev.map((i) => (i.id === fomoItem.id ? { ...i, quantity: 1 } : i))
        );
      }
    };

    syncFreeGift();
  }, [items, user, loading, couponCode, updateItems, isFreeBottleOfferActive]);

  const showPopup = (product: { name: string; image: string | null; slug: string }, price: number, qty: number) => {
    setAddedItem({
      slug: product.slug,
      name: product.name,
      image: product.image,
      price: price * qty,
      qty,
    });
    setIsAddedModalOpen(true);
  };

  const addToCart = async (slug: string, opts: AddOptions = {}) => {
    const variant: Variant = opts.variant ?? "single";
    const product = CATALOG[slug];
    if (!product) return;

    if (isSoldOut(slug)) {
      toast.error(`Sorry, ${product.name} is currently sold out.`);
      return;
    }

    const available = getAvailableStock(slug);

    // Apply MOQ constraint
    let qty = opts.qty ?? 1;
    if (product.moq && qty < product.moq) {
      qty = product.moq;
    }

    const price = variantPrice(variant, slug);

    // Merge same-variant single items
    const existing = items.find((i) => i.product_slug === slug && i.variant === variant && i.price_inr === price);
    const currentQtyInCart = existing ? existing.quantity : 0;

    if (currentQtyInCart + qty > available) {
      toast.error(`Sorry, only ${available} ${available === 1 ? "unit is" : "units are"} available for ${product.name}.`);
      return;
    }

    const mainImg = getProductMainImage(slug) || product.image;

    if (existing) {
      await updateQty(existing.id, existing.quantity + qty);
      showPopup({ ...product, image: mainImg }, price, qty);
      return;
    }

    if (user) {
      const { data, error } = await supabase.from("cart_items").insert({
        user_id: user.id,
        product_slug: slug,
        product_name: product.name,
        product_image: mainImg,
        price_inr: price,
        quantity: qty,
        variant,
        pack_items: [],
      }).select("id").single();

      if (error) {
        toast.error(error.message);
        return;
      }

      const newItem: CartItem = {
        id: data?.id ?? `cart-${Date.now()}`,
        product_slug: slug,
        product_name: product.name,
        product_image: mainImg,
        price_inr: price,
        quantity: qty,
        variant,
        pack_items: [],
      };

      updateItems((prev) => [...prev, newItem]);
      showPopup({ ...product, image: mainImg }, price, qty);
    } else {
      // Guest mode: save immediately to local storage
      const newItem: CartItem = {
        id: `guest-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        product_slug: slug,
        product_name: product.name,
        product_image: mainImg,
        price_inr: price,
        quantity: qty,
        variant,
        pack_items: [],
      };

      updateItems((prev) => [...prev, newItem]);
      showPopup({ ...product, image: mainImg }, price, qty);
    }
  };

  const updateQty = async (id: string, qty: number) => {
    if (qty <= 0) {
      await removeItem(id);
      return;
    }

    const item = items.find((i) => i.id === id);
    if (!item) return;
    const product = CATALOG[item.product_slug];

    const available = getAvailableStock(item.product_slug);
    if (qty > item.quantity && qty > available) {
      toast.error(`Sorry, only ${available} ${available === 1 ? "unit is" : "units are"} available for ${product?.name ?? "this product"}.`);
      return;
    }

    // Enforce MOQ check
    if (product?.moq && qty < product.moq) {
      toast.error(`Minimum order quantity for ${product.name} is ${product.moq}. Click the delete icon to remove.`);
      return;
    }

    updateItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, quantity: qty } : it))
    );

    if (user) {
      const { error } = await supabase
        .from("cart_items")
        .update({ quantity: qty, updated_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .eq("id", id);
      if (error) toast.error(error.message);
    }
  };

  const removeItem = async (id: string) => {
    const item = items.find((i) => i.id === id);
    if (item && item.variant === "free") {
      localStorage.setItem("rejected_free_gift", "true");
    }

    updateItems((prev) => prev.filter((it) => it.id !== id));

    if (user) {
      const { error } = await supabase
        .from("cart_items")
        .delete()
        .eq("user_id", user.id)
        .eq("id", id);
      if (error) toast.error(error.message);
    }
  };

  // clearCart is ONLY called after verified payment completion in Pay.tsx
  const clearCart = async () => {
    updateItems([]);
    setCouponCode("");
    localStorage.removeItem(COUPON_STORAGE_KEY);
    if (user) {
      const { error } = await supabase
        .from("cart_items")
        .delete()
        .eq("user_id", user.id);
      if (error) console.warn("Failed to clear Supabase cart:", error.message);
    }
  };

  const count = items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = items.reduce((s, i) => s + i.quantity * i.price_inr, 0);

  const activeCoupon = couponCode ? getCouponByCode(couponCode) ?? null : null;

  const discount = activeCoupon && activeCoupon.discount_percent > 0
    ? Math.round(subtotal * (activeCoupon.discount_percent / 100))
    : couponCode.toUpperCase() === "FOMO20"
    ? Math.round(subtotal * 0.20)
    : 0;

  const netSubtotal = Math.max(0, subtotal - discount);

  const isFreeDeliveryCoupon =
    Boolean(activeCoupon?.is_free_delivery) ||
    (couponCode.toUpperCase() === "DELIVERYONUS" && subtotal < 2000);

  const isFreeBottleEligible = isFreeBottleOfferActive && (
    !couponCode
      ? subtotal >= FREE_BOTTLE_THRESHOLD
      : couponCode.toUpperCase() === "FREEBOTTLE"
      ? subtotal >= FREE_BOTTLE_THRESHOLD
      : (activeCoupon?.allow_free_bottle !== false && netSubtotal >= FREE_BOTTLE_THRESHOLD)
  );

  const bottleIneligibilityReason = !isFreeBottleOfferActive
    ? "disabled"
    : couponCode && activeCoupon && activeCoupon.allow_free_bottle === false
    ? "coupon_disallowed"
    : (couponCode ? netSubtotal : subtotal) < FREE_BOTTLE_THRESHOLD
    ? "below_threshold"
    : null;

  const applyCoupon = (code: string, context?: { pincode?: string; address?: string }) => {
    const norm = (code || "").trim().toUpperCase();
    if (norm === "FREEBOTTLE" && !isFreeBottleOfferActive) {
      toast.error("The Free Bottle offer is currently disabled by admin.");
      return false;
    }

    const res = validateCoupon(code, subtotal, context);
    if (!res.valid) {
      toast.error(res.error || "Invalid coupon code");
      return false;
    }
    setCouponCode(norm);
    if (norm !== "DELIVERYONUS") {
      localStorage.setItem(COUPON_STORAGE_KEY, norm);
    } else {
      localStorage.removeItem(COUPON_STORAGE_KEY);
    }

    const applied = res.coupon;
    const parts: string[] = [];
    if (applied && applied.discount_percent > 0) {
      parts.push(`${applied.discount_percent}% discount`);
    }
    if (res.isFreeDelivery) {
      parts.push("Free ₹0 Delivery");
    }

    const desc = parts.length > 0 ? parts.join(" + ") : "Discount applied";
    toast.success(`Coupon ${norm} applied! ${desc}`);
    return true;
  };

  const removeCoupon = () => {
    setCouponCode("");
    localStorage.removeItem(COUPON_STORAGE_KEY);
    toast.success("Coupon removed");
  };

  const openAddedModal = (info: AddedItemInfo) => {
    setAddedItem(info);
    setIsAddedModalOpen(true);
  };

  const closeAddedModal = () => {
    setIsAddedModalOpen(false);
  };

  const getItem = (slug: string, variant: Variant = "single") => {
    return items.find((i) => i.product_slug === slug && i.variant === variant);
  };

  const getItemQuantity = (slug: string, variant: Variant = "single") => {
    const item = getItem(slug, variant);
    return item ? item.quantity : 0;
  };

  const incrementQty = async (slug: string, variant: Variant = "single") => {
    const item = getItem(slug, variant);
    if (item) {
      await updateQty(item.id, item.quantity + 1);
    } else {
      await addToCart(slug, { qty: 1, variant });
    }
  };

  const decrementQty = async (slug: string, variant: Variant = "single") => {
    const item = getItem(slug, variant);
    if (!item) return;
    const product = CATALOG[slug];
    const moq = product?.moq ?? 1;
    if (item.quantity <= moq || item.quantity <= 1) {
      await removeItem(item.id);
    } else {
      await updateQty(item.id, item.quantity - 1);
    }
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
        activeCoupon,
        isFreeDeliveryCoupon,
        isFreeBottleOfferActive,
        netSubtotal,
        isFreeBottleEligible,
        bottleIneligibilityReason,
        addToCart,
        updateQty,
        removeItem,
        clearCart,
        refresh,
        applyCoupon,
        removeCoupon,
        openAddedModal,
        closeAddedModal,
        getItemQuantity,
        getItem,
        incrementQty,
        decrementQty,
      }}
    >
      {children}
      <AddedToCartModal
        isOpen={isAddedModalOpen}
        onClose={closeAddedModal}
        item={addedItem}
        cartCount={count}
        cartSubtotal={subtotal}
      />
    </Ctx.Provider>
  );
}

export const useCart = () => useContext(Ctx);

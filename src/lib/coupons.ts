import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Coupon = {
  id: string;
  code: string;
  discount_percent: number; // e.g. 25, 35
  is_free_delivery: boolean; // true = free shipping, false = standard
  total_coupons: number; // e.g. 100
  available_coupons: number; // available quota
  used_count: number; // number of times redeemed
  min_order_amount: number; // e.g. 0
  is_active: boolean;
  description: string;
  created_at?: string;
  updated_at?: string;
};

export const INITIAL_COUPONS: Coupon[] = [
  {
    id: "coupon-save-25",
    code: "SAVE25",
    discount_percent: 25,
    is_free_delivery: false,
    total_coupons: 100,
    available_coupons: 100,
    used_count: 0,
    min_order_amount: 0,
    is_active: true,
    description: "25% OFF on your entire order (Standard delivery)",
  },
  {
    id: "coupon-save-25-free",
    code: "SAVE25FREE",
    discount_percent: 25,
    is_free_delivery: true,
    total_coupons: 100,
    available_coupons: 100,
    used_count: 0,
    min_order_amount: 0,
    is_active: true,
    description: "25% OFF + FREE Delivery across India",
  },
  {
    id: "coupon-save-35",
    code: "SAVE35",
    discount_percent: 35,
    is_free_delivery: false,
    total_coupons: 100,
    available_coupons: 100,
    used_count: 0,
    min_order_amount: 0,
    is_active: true,
    description: "35% OFF on your entire order (Standard delivery)",
  },
  {
    id: "coupon-save-35-free",
    code: "SAVE35FREE",
    discount_percent: 35,
    is_free_delivery: true,
    total_coupons: 100,
    available_coupons: 100,
    used_count: 0,
    min_order_amount: 0,
    is_active: true,
    description: "35% OFF + FREE Delivery across India",
  },
  {
    id: "coupon-fomo-25",
    code: "FOMO25",
    discount_percent: 25,
    is_free_delivery: false,
    total_coupons: 100,
    available_coupons: 100,
    used_count: 0,
    min_order_amount: 0,
    is_active: true,
    description: "25% OFF on Food On The Move treats",
  },
  {
    id: "coupon-fomo-25-free",
    code: "FOMO25FREE",
    discount_percent: 25,
    is_free_delivery: true,
    total_coupons: 100,
    available_coupons: 100,
    used_count: 0,
    min_order_amount: 0,
    is_active: true,
    description: "25% OFF + FREE Delivery on your order",
  },
  {
    id: "coupon-fomo-35",
    code: "FOMO35",
    discount_percent: 35,
    is_free_delivery: false,
    total_coupons: 100,
    available_coupons: 100,
    used_count: 0,
    min_order_amount: 0,
    is_active: true,
    description: "35% OFF on Food On The Move treats",
  },
  {
    id: "coupon-fomo-35-free",
    code: "FOMO35FREE",
    discount_percent: 35,
    is_free_delivery: true,
    total_coupons: 100,
    available_coupons: 100,
    used_count: 0,
    min_order_amount: 0,
    is_active: true,
    description: "35% OFF + FREE Delivery on your order",
  },
  {
    id: "coupon-fomo-20",
    code: "FOMO20",
    discount_percent: 20,
    is_free_delivery: false,
    total_coupons: 500,
    available_coupons: 500,
    used_count: 0,
    min_order_amount: 0,
    is_active: true,
    description: "Special 20% discount on order",
  },
  {
    id: "coupon-delivery-on-us",
    code: "DELIVERYONUS",
    discount_percent: 0,
    is_free_delivery: true,
    total_coupons: 1000,
    available_coupons: 1000,
    used_count: 0,
    min_order_amount: 0,
    is_active: true,
    description: "Free ₹0 delivery fee coupon",
  },
  {
    id: "coupon-free-bottle",
    code: "FREEBOTTLE",
    discount_percent: 0,
    is_free_delivery: true,
    total_coupons: 1000,
    available_coupons: 1000,
    used_count: 0,
    min_order_amount: 1200,
    is_active: true,
    description: "FREE Food On The Move Stainless Steel Bottle (Worth ₹300) + Free Delivery on orders ₹1,200+",
  },
];

const LOCAL_STORAGE_KEY = "fomo_coupons_cache_v1";

// In-memory cache
let cachedCoupons: Coupon[] = loadLocalCoupons();
let isSupabaseOnline = false;

function loadLocalCoupons(): Coupon[] {
  if (typeof window === "undefined") return INITIAL_COUPONS;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Merge with initial defaults to ensure default 25% and 35% are always present
        const map = new Map<string, Coupon>();
        INITIAL_COUPONS.forEach((c) => map.set(c.code.toUpperCase(), c));
        parsed.forEach((c: Coupon) => {
          if (c && c.code) map.set(c.code.toUpperCase(), c);
        });
        return Array.from(map.values());
      }
    }
  } catch (e) {
    console.warn("Failed to load local coupons:", e);
  }
  return INITIAL_COUPONS;
}

function saveLocalCoupons(coupons: Coupon[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(coupons));
  } catch (e) {
    console.warn("Failed to save local coupons:", e);
  }
}

const listeners = new Set<(coupons: Coupon[]) => void>();

export function subscribeCoupons(fn: (coupons: Coupon[]) => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

function notifyListeners() {
  listeners.forEach((fn) => fn(cachedCoupons));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("fomo_free_bottle_changed"));
  }
}

// Fetch coupons from Supabase table, with automatic fallback and seed synchronization
export async function fetchCoupons(): Promise<Coupon[]> {
  try {
    const { data, error } = await supabase
      .from("coupons" as any)
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && Array.isArray(data)) {
      isSupabaseOnline = true;
      if (data.length === 0) {
        // If Supabase table exists but is empty, seed it with initial coupons
        try {
          const toInsert = INITIAL_COUPONS.map((c) => ({
            code: c.code.toUpperCase(),
            discount_percent: c.discount_percent,
            is_free_delivery: c.is_free_delivery,
            total_coupons: c.total_coupons,
            available_coupons: c.available_coupons,
            used_count: c.used_count,
            min_order_amount: c.min_order_amount,
            is_active: c.is_active,
            description: c.description,
          }));
          await supabase.from("coupons" as any).insert(toInsert);
        } catch (seedErr) {
          console.warn("Could not auto-seed coupons into Supabase:", seedErr);
        }
        cachedCoupons = INITIAL_COUPONS;
      } else {
        const mapped: Coupon[] = data.map((row: any) => ({
          id: String(row.id),
          code: String(row.code || "").toUpperCase(),
          discount_percent: Number(row.discount_percent || 0),
          is_free_delivery: Boolean(row.is_free_delivery),
          total_coupons: Number(row.total_coupons || 0),
          available_coupons: Number(row.available_coupons ?? row.total_coupons ?? 0),
          used_count: Number(row.used_count || 0),
          min_order_amount: Number(row.min_order_amount || 0),
          is_active: row.is_active !== false,
          description: row.description || "",
          created_at: row.created_at,
          updated_at: row.updated_at,
        }));
        cachedCoupons = mapped;
        const bottle = mapped.find((c) => c.code?.toUpperCase() === "FREEBOTTLE");
        if (bottle && typeof window !== "undefined") {
          localStorage.setItem("fomo_free_bottle_enabled", String(bottle.is_active));
        }
      }
      saveLocalCoupons(cachedCoupons);
      notifyListeners();
      return cachedCoupons;
    }
  } catch (err) {
    console.warn("Supabase fetchCoupons warning (using local fallback):", err);
  }

  // Fallback to local storage
  cachedCoupons = loadLocalCoupons();
  notifyListeners();
  return cachedCoupons;
}

// Initial fetch & realtime subscription
if (typeof window !== "undefined") {
  fetchCoupons();

  supabase
    .channel("coupons_realtime_channel")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "coupons" },
      () => {
        void fetchCoupons();
      }
    )
    .subscribe();
}

export function getAllCoupons(): Coupon[] {
  return cachedCoupons;
}

export function getCouponByCode(code: string): Coupon | undefined {
  const norm = (code || "").trim().toUpperCase();
  return cachedCoupons.find((c) => c.code.toUpperCase() === norm);
}

export type CouponValidationResult = {
  valid: boolean;
  error?: string;
  coupon?: Coupon;
  discount: number;
  isFreeDelivery: boolean;
};

export function validateCoupon(
  code: string,
  subtotal: number,
  context?: { pincode?: string; address?: string }
): CouponValidationResult {
  const norm = (code || "").trim().toUpperCase();
  if (!norm) {
    return { valid: false, error: "Please enter a coupon code.", discount: 0, isFreeDelivery: false };
  }

  const coupon = getCouponByCode(norm);
  if (!coupon) {
    return { valid: false, error: `Invalid coupon code: "${norm}"`, discount: 0, isFreeDelivery: false };
  }

  if (!coupon.is_active) {
    return { valid: false, error: `Coupon ${norm} is no longer active.`, discount: 0, isFreeDelivery: false };
  }

  if (coupon.available_coupons <= 0) {
    return {
      valid: false,
      error: `Sorry, coupon ${norm} has reached its maximum usage quota. No coupons remaining.`,
      discount: 0,
      isFreeDelivery: false,
    };
  }

  if (coupon.min_order_amount > 0 && subtotal < coupon.min_order_amount) {
    return {
      valid: false,
      error: `Coupon ${norm} requires a minimum order amount of ₹${coupon.min_order_amount.toFixed(2)}.`,
      discount: 0,
      isFreeDelivery: false,
    };
  }

  // Location-specific validation for DELIVERYONUS legacy coupon
  if (norm === "DELIVERYONUS") {
    // subtotal thresholds
    if (subtotal >= 2000) {
      return {
        valid: false,
        error: "DELIVERYONUS is only applicable for orders under ₹2,000. Your order already qualifies for free delivery!",
        discount: 0,
        isFreeDelivery: false,
      };
    }
  }

  const discount = Math.round(subtotal * (coupon.discount_percent / 100));

  return {
    valid: true,
    coupon,
    discount,
    isFreeDelivery: coupon.is_free_delivery,
  };
}

/**
 * Decrement coupon availability & increment usage count when an order is paid.
 * Uses atomic PostgreSQL stored procedure first to prevent race conditions across concurrent customer payments.
 */
export async function redeemCoupon(code: string): Promise<{ success: boolean; availableLeft?: number; error?: string }> {
  const norm = (code || "").trim().toUpperCase();
  if (!norm) return { success: false, error: "No coupon code provided" };

  // 1. Try atomic PostgreSQL RPC function first (concurrency safe)
  try {
    const { data: rpcData, error: rpcErr } = await supabase.rpc("redeem_coupon" as any, { p_code: norm });
    if (!rpcErr && rpcData && typeof rpcData === "object") {
      const typed = rpcData as { success: boolean; available_coupons?: number; used_count?: number; error?: string };
      if (typed.success && typeof typed.available_coupons === "number") {
        const nextAvailable = typed.available_coupons;
        const nextUsed = typed.used_count ?? 1;
        cachedCoupons = cachedCoupons.map((c) =>
          c.code.toUpperCase() === norm
            ? { ...c, available_coupons: nextAvailable, used_count: nextUsed, updated_at: new Date().toISOString() }
            : c
        );
        saveLocalCoupons(cachedCoupons);
        notifyListeners();
        return { success: true, availableLeft: nextAvailable };
      } else if (typed.error) {
        return { success: false, error: typed.error };
      }
    }
  } catch (rpcEx) {
    // If RPC function is not yet installed in Supabase, fall back to table update
  }

  const coupon = getCouponByCode(norm);
  if (!coupon) return { success: false, error: "Coupon not found" };

  const newAvailable = Math.max(0, coupon.available_coupons - 1);
  const newUsed = coupon.used_count + 1;

  // 2. Direct table update fallback
  try {
    const { error } = await supabase
      .from("coupons" as any)
      .update({
        available_coupons: newAvailable,
        used_count: newUsed,
        updated_at: new Date().toISOString(),
      })
      .ilike("code", norm);

    if (error) {
      console.warn("Supabase coupon update error:", error);
    }
  } catch (err) {
    console.warn("Supabase coupon update failed:", err);
  }

  // 3. Update local state & storage immediately
  cachedCoupons = cachedCoupons.map((c) =>
    c.code.toUpperCase() === norm
      ? { ...c, available_coupons: newAvailable, used_count: newUsed, updated_at: new Date().toISOString() }
      : c
  );
  saveLocalCoupons(cachedCoupons);
  notifyListeners();

  return { success: true, availableLeft: newAvailable };
}

/**
 * Add a new coupon (Admin)
 */
export async function addCoupon(
  data: Omit<Coupon, "id" | "used_count" | "created_at" | "updated_at">
): Promise<{ success: boolean; coupon?: Coupon; error?: string }> {
  const norm = data.code.trim().toUpperCase();
  if (!norm) return { success: false, error: "Coupon code is required" };

  if (getCouponByCode(norm)) {
    return { success: false, error: `Coupon code "${norm}" already exists` };
  }

  const id = `coupon-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const newCoupon: Coupon = {
    id,
    code: norm,
    discount_percent: Math.min(100, Math.max(0, Number(data.discount_percent) || 0)),
    is_free_delivery: Boolean(data.is_free_delivery),
    total_coupons: Math.max(0, Number(data.total_coupons) || 0),
    available_coupons: Math.max(0, Number(data.available_coupons ?? data.total_coupons ?? 0)),
    used_count: 0,
    min_order_amount: Math.max(0, Number(data.min_order_amount) || 0),
    is_active: data.is_active !== false,
    description: data.description?.trim() || "",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Try Supabase insert
  try {
    const { data: inserted, error } = await supabase
      .from("coupons" as any)
      .insert({
        code: newCoupon.code,
        discount_percent: newCoupon.discount_percent,
        is_free_delivery: newCoupon.is_free_delivery,
        total_coupons: newCoupon.total_coupons,
        available_coupons: newCoupon.available_coupons,
        used_count: 0,
        min_order_amount: newCoupon.min_order_amount,
        is_active: newCoupon.is_active,
        description: newCoupon.description,
      })
      .select("id")
      .single();

    if (!error && inserted?.id) {
      newCoupon.id = String(inserted.id);
    }
  } catch (err) {
    console.warn("Supabase coupon insert failed (saved locally):", err);
  }

  cachedCoupons = [newCoupon, ...cachedCoupons];
  saveLocalCoupons(cachedCoupons);
  notifyListeners();

  return { success: true, coupon: newCoupon };
}

/**
 * Update an existing coupon (Admin)
 */
export async function updateCoupon(
  id: string,
  updates: Partial<Omit<Coupon, "id">>
): Promise<{ success: boolean; error?: string }> {
  const current = cachedCoupons.find((c) => c.id === id);
  if (!current) return { success: false, error: "Coupon not found" };

  if (updates.code) {
    const norm = updates.code.trim().toUpperCase();
    const conflict = cachedCoupons.find((c) => c.id !== id && c.code.toUpperCase() === norm);
    if (conflict) {
      return { success: false, error: `Coupon code "${norm}" is already taken by another coupon` };
    }
    updates.code = norm;
  }

  const updated: Coupon = {
    ...current,
    ...updates,
    updated_at: new Date().toISOString(),
  };

  // Try Supabase update
  try {
    const { error } = await supabase
      .from("coupons" as any)
      .update({
        code: updated.code,
        discount_percent: updated.discount_percent,
        is_free_delivery: updated.is_free_delivery,
        total_coupons: updated.total_coupons,
        available_coupons: updated.available_coupons,
        used_count: updated.used_count,
        min_order_amount: updated.min_order_amount,
        is_active: updated.is_active,
        description: updated.description,
        updated_at: updated.updated_at,
      })
      .eq("id", id);

    if (error) {
      console.warn("Supabase coupon update error:", error);
    }
  } catch (err) {
    console.warn("Supabase coupon update failed:", err);
  }

  cachedCoupons = cachedCoupons.map((c) => (c.id === id ? updated : c));
  if (updated.code.toUpperCase() === "FREEBOTTLE" && typeof window !== "undefined") {
    localStorage.setItem("fomo_free_bottle_enabled", String(updated.is_active));
  }
  saveLocalCoupons(cachedCoupons);
  notifyListeners();

  return { success: true };
}

/**
 * Manually modify available coupons count (Admin)
 */
export async function updateAvailableCount(
  id: string,
  newAvailable: number
): Promise<{ success: boolean; error?: string }> {
  const target = Math.max(0, Math.round(newAvailable));
  return updateCoupon(id, { available_coupons: target });
}

/**
 * Delete a coupon (Admin)
 */
export async function deleteCoupon(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from("coupons" as any).delete().eq("id", id);
    if (error) {
      console.warn("Supabase delete coupon error:", error);
    }
  } catch (err) {
    console.warn("Supabase delete coupon failed:", err);
  }

  cachedCoupons = cachedCoupons.filter((c) => c.id !== id);
  saveLocalCoupons(cachedCoupons);
  notifyListeners();

  return { success: true };
}

/**
 * Check if the Free Bottle Offer / Coupon is currently active
 */
export function isFreeBottleActive(): boolean {
  const bottleCoupon = getCouponByCode("FREEBOTTLE");
  if (bottleCoupon) {
    return Boolean(bottleCoupon.is_active);
  }
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("fomo_free_bottle_enabled");
    if (saved !== null) {
      return saved === "true";
    }
  }
  return true;
}

/**
 * Enable or Disable the Free Bottle Offer & Coupon
 */
export async function setFreeBottleOfferActive(active: boolean): Promise<boolean> {
  if (typeof window !== "undefined") {
    localStorage.setItem("fomo_free_bottle_enabled", String(active));
  }
  const bottleCoupon = getCouponByCode("FREEBOTTLE");
  if (bottleCoupon) {
    const res = await updateCoupon(bottleCoupon.id, { is_active: active });
    return res.success;
  }
  notifyListeners();
  return true;
}

/**
 * React Hook for component consumption
 */
export function useCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>(() => cachedCoupons);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const listener = (fresh: Coupon[]) => setCoupons([...fresh]);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    const fresh = await fetchCoupons();
    setCoupons([...fresh]);
    setLoading(false);
  }, []);

  const freeBottleCoupon = coupons.find((c) => c.code.toUpperCase() === "FREEBOTTLE");
  const isFreeBottle = freeBottleCoupon ? freeBottleCoupon.is_active : isFreeBottleActive();

  const toggleFreeBottleOffer = useCallback(async (active: boolean) => {
    return setFreeBottleOfferActive(active);
  }, []);

  return {
    coupons,
    loading,
    refresh,
    addCoupon,
    updateCoupon,
    updateAvailableCount,
    deleteCoupon,
    getCouponByCode,
    validateCoupon,
    redeemCoupon,
    isSupabaseOnline,
    isFreeBottleActive: isFreeBottle,
    toggleFreeBottleOffer,
  };
}

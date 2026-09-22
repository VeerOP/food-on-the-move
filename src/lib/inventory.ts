import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CATALOG, registerDynamicPriceGetter } from "@/lib/catalog";

export const INITIAL_STOCK: Record<string, number> = {
  "oats-sticks": 5,
  "chocochips-sticks": 3,
  "almond-sticks": 4,
  "double-chocolate-cookies": 1,
  "bajra-jaggery-cookies": 6,
  "nachni-jaggery-cookies": 4,
  "jowaar-jaggery-cookies": 2,
  "multigrain-jaggery-cookies": 2,
  "kunafa": 0,
  "millet-baklava": 0,
  "vanilla-chocolate-cookies": 0,
  "coffee-walnut-cookies": 0,
};

type InventoryState = Record<
  string,
  { initial: number; sold: number; available: number; price_inr?: number | null }
>;

// Global cache for immediate synchronous lookups
let cachedInventory: InventoryState = Object.entries(INITIAL_STOCK).reduce((acc, [slug, initial]) => {
  acc[slug] = {
    initial,
    sold: 0,
    available: initial,
    price_inr: null,
  };
  return acc;
}, {} as InventoryState);

const listeners = new Set<(inv: InventoryState) => void>();

function notifyListeners() {
  listeners.forEach((fn) => fn(cachedInventory));
}

// Register dynamic price provider with catalog.ts
registerDynamicPriceGetter((slug: string) => {
  const custom = cachedInventory[slug]?.price_inr;
  return custom !== undefined && custom !== null && custom > 0
    ? custom
    : (CATALOG[slug]?.price ?? 0);
});

export async function fetchInventory() {
  try {
    const { data, error } = await supabase
      .from("product_inventory" as any)
      .select("product_slug, initial_stock, sold_stock, price_inr");

    if (!error && data && Array.isArray(data)) {
      const next: InventoryState = { ...cachedInventory };
      data.forEach((row: any) => {
        const initial = Number(row.initial_stock ?? INITIAL_STOCK[row.product_slug] ?? 0);
        const sold = Number(row.sold_stock ?? 0);
        const price_inr = row.price_inr != null ? Number(row.price_inr) : null;
        next[row.product_slug] = {
          initial,
          sold,
          available: Math.max(0, initial - sold),
          price_inr,
        };
      });
      cachedInventory = next;
      notifyListeners();
    }
  } catch (err) {
    console.warn("Inventory fetch warning:", err);
  }
}

// Initial fetch & subscribe to real-time updates
if (typeof window !== "undefined") {
  fetchInventory();

  supabase
    .channel("inventory_realtime_channel")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "product_inventory" },
      () => {
        fetchInventory();
      }
    )
    .subscribe();
}

export function getAvailableStock(slug: string): number {
  if (slug in cachedInventory) {
    return cachedInventory[slug].available;
  }
  const cat = CATALOG[slug];
  if (cat && typeof cat.stock === "number") {
    return cat.stock;
  }
  if (cat?.isSoldOut) {
    return 0;
  }
  return Infinity;
}

export function isSoldOut(slug: string): boolean {
  if (slug in cachedInventory) {
    return cachedInventory[slug].available <= 0;
  }
  const cat = CATALOG[slug];
  if (cat && typeof cat.stock === "number") {
    return cat.stock <= 0;
  }
  return !!cat?.isSoldOut;
}

export function getProductMRP(slug: string): number {
  if (slug in cachedInventory && typeof cachedInventory[slug].price_inr === "number" && cachedInventory[slug].price_inr! > 0) {
    return cachedInventory[slug].price_inr!;
  }
  return CATALOG[slug]?.price ?? 0;
}

export function useInventory() {
  const [inventory, setInventory] = useState<InventoryState>(cachedInventory);

  useEffect(() => {
    setInventory(cachedInventory);
    listeners.add(setInventory);
    fetchInventory();
    return () => {
      listeners.delete(setInventory);
    };
  }, []);

  const checkIsSoldOut = (slug: string): boolean => {
    if (slug in inventory) {
      return inventory[slug].available <= 0;
    }
    return isSoldOut(slug);
  };

  const getStock = (slug: string): number => {
    if (slug in inventory) {
      return inventory[slug].available;
    }
    return getAvailableStock(slug);
  };

  const getMRP = (slug: string): number => {
    if (slug in inventory && typeof inventory[slug].price_inr === "number" && inventory[slug].price_inr! > 0) {
      return inventory[slug].price_inr!;
    }
    return getProductMRP(slug);
  };

  return {
    inventory,
    isSoldOut: checkIsSoldOut,
    getStock,
    getMRP,
    updateMRP: updateProductMRP,
    refreshInventory: fetchInventory,
  };
}

export async function updateProductStock(
  slug: string,
  newAvailableStock: number,
  options?: { resetSold?: boolean }
): Promise<{ success: boolean; error?: string }> {
  try {
    const current = cachedInventory[slug];
    const currentSold = options?.resetSold ? 0 : (current?.sold ?? 0);
    const newInitial = currentSold + Math.max(0, newAvailableStock);
    const currentPrice = current?.price_inr ?? null;

    const upsertPayload: any = {
      product_slug: slug,
      initial_stock: newInitial,
      sold_stock: currentSold,
      updated_at: new Date().toISOString(),
    };
    if (currentPrice !== null && currentPrice !== undefined) {
      upsertPayload.price_inr = currentPrice;
    }

    const { error } = await supabase
      .from("product_inventory" as any)
      .upsert(upsertPayload, { onConflict: "product_slug" });

    if (error) {
      return { success: false, error: error.message };
    }

    cachedInventory = {
      ...cachedInventory,
      [slug]: {
        initial: newInitial,
        sold: currentSold,
        available: Math.max(0, newAvailableStock),
        price_inr: currentPrice,
      },
    };
    notifyListeners();
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to update stock" };
  }
}

export async function updateProductMRP(
  slug: string,
  newMRP: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const validMRP = Math.max(0, Number(newMRP));
    const current = cachedInventory[slug];
    const initial = current?.initial ?? (CATALOG[slug]?.stock ?? 50);
    const sold = current?.sold ?? 0;

    const { error } = await supabase
      .from("product_inventory" as any)
      .upsert(
        {
          product_slug: slug,
          initial_stock: initial,
          sold_stock: sold,
          price_inr: validMRP,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "product_slug" }
      );

    if (error) {
      return { success: false, error: error.message };
    }

    cachedInventory = {
      ...cachedInventory,
      [slug]: {
        initial,
        sold,
        available: Math.max(0, initial - sold),
        price_inr: validMRP,
      },
    };
    notifyListeners();
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to update MRP" };
  }
}

export async function setProductStockDirect(
  slug: string,
  initialStock: number,
  soldStock: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const validInitial = Math.max(0, initialStock);
    const validSold = Math.max(0, soldStock);
    const current = cachedInventory[slug];
    const currentPrice = current?.price_inr ?? null;

    const upsertPayload: any = {
      product_slug: slug,
      initial_stock: validInitial,
      sold_stock: validSold,
      updated_at: new Date().toISOString(),
    };
    if (currentPrice !== null && currentPrice !== undefined) {
      upsertPayload.price_inr = currentPrice;
    }

    const { error } = await supabase
      .from("product_inventory" as any)
      .upsert(upsertPayload, { onConflict: "product_slug" });

    if (error) {
      return { success: false, error: error.message };
    }

    const available = Math.max(0, validInitial - validSold);
    cachedInventory = {
      ...cachedInventory,
      [slug]: {
        initial: validInitial,
        sold: validSold,
        available,
        price_inr: currentPrice,
      },
    };
    notifyListeners();
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to update stock" };
  }
}


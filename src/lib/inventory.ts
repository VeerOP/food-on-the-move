import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CATALOG } from "@/lib/catalog";

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

type InventoryState = Record<string, { initial: number; sold: number; available: number }>;

// Global cache for immediate synchronous lookups
let cachedInventory: InventoryState = Object.entries(INITIAL_STOCK).reduce((acc, [slug, initial]) => {
  acc[slug] = {
    initial,
    sold: 0,
    available: initial,
  };
  return acc;
}, {} as InventoryState);

const listeners = new Set<(inv: InventoryState) => void>();

function notifyListeners() {
  listeners.forEach((fn) => fn(cachedInventory));
}

export async function fetchInventory() {
  try {
    const { data, error } = await supabase
      .from("product_inventory" as any)
      .select("product_slug, initial_stock, sold_stock");

    if (!error && data && Array.isArray(data)) {
      const next: InventoryState = { ...cachedInventory };
      data.forEach((row: any) => {
        const initial = Number(row.initial_stock ?? INITIAL_STOCK[row.product_slug] ?? 0);
        const sold = Number(row.sold_stock ?? 0);
        next[row.product_slug] = {
          initial,
          sold,
          available: Math.max(0, initial - sold),
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

  return {
    inventory,
    isSoldOut: checkIsSoldOut,
    getStock,
    refreshInventory: fetchInventory,
  };
}

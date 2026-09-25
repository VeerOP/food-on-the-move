import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  CATALOG,
  DEFAULT_PRODUCT_IMAGES,
  registerDynamicPriceGetter,
  registerDynamicImagesGetter,
} from "@/lib/catalog";

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

export type ProductInventoryEntry = {
  initial: number;
  sold: number;
  available: number;
  price_inr?: number | null;
  images?: string[] | null;
};

type InventoryState = Record<string, ProductInventoryEntry>;

// Global cache for immediate synchronous lookups
let cachedInventory: InventoryState = Object.entries(INITIAL_STOCK).reduce((acc, [slug, initial]) => {
  acc[slug] = {
    initial,
    sold: 0,
    available: initial,
    price_inr: null,
    images: null,
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

// Register dynamic images provider with catalog.ts
registerDynamicImagesGetter((slug: string) => {
  const custom = cachedInventory[slug]?.images;
  if (Array.isArray(custom) && custom.length > 0) {
    return custom;
  }
  return undefined;
});

export async function fetchInventory() {
  try {
    const { data, error } = await supabase
      .from("product_inventory" as any)
      .select("product_slug, initial_stock, sold_stock, price_inr, images");

    if (!error && data && Array.isArray(data)) {
      const next: InventoryState = { ...cachedInventory };
      data.forEach((row: any) => {
        const initial = Number(row.initial_stock ?? INITIAL_STOCK[row.product_slug] ?? 0);
        const sold = Number(row.sold_stock ?? 0);
        const price_inr = row.price_inr != null ? Number(row.price_inr) : null;
        let images: string[] | null = null;
        if (Array.isArray(row.images)) {
          images = row.images.filter((img: any) => typeof img === "string" && img.trim().length > 0);
        }
        next[row.product_slug] = {
          initial,
          sold,
          available: Math.max(0, initial - sold),
          price_inr,
          images,
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

export function getProductImages(slug: string): string[] {
  const custom = cachedInventory[slug]?.images;
  if (Array.isArray(custom) && custom.length > 0) {
    return custom;
  }
  return DEFAULT_PRODUCT_IMAGES[slug] || (CATALOG[slug]?.image ? [CATALOG[slug].image] : []);
}

export function getProductMainImage(slug: string): string {
  const imgs = getProductImages(slug);
  return imgs[0] || CATALOG[slug]?.image || "";
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

  const getImages = (slug: string): string[] => {
    const custom = inventory[slug]?.images;
    if (Array.isArray(custom) && custom.length > 0) {
      return custom;
    }
    return DEFAULT_PRODUCT_IMAGES[slug] || (CATALOG[slug]?.image ? [CATALOG[slug].image] : []);
  };

  const getMainImage = (slug: string): string => {
    const imgs = getImages(slug);
    return imgs[0] || CATALOG[slug]?.image || "";
  };

  return {
    inventory,
    isSoldOut: checkIsSoldOut,
    getStock,
    getMRP,
    getImages,
    getMainImage,
    updateMRP: updateProductMRP,
    updateImages: updateProductImages,
    refreshInventory: fetchInventory,
  };
}

export async function uploadProductImage(
  slug: string,
  file: File
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const fileExt = file.name.split(".").pop() || "jpg";
    const cleanExt = fileExt.toLowerCase().replace(/[^a-z0-9]/g, "");
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const filePath = `${slug}/${timestamp}-${random}.${cleanExt}`;

    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      return { success: false, error: uploadError.message };
    }

    const { data: publicUrlData } = supabase.storage
      .from("product-images")
      .getPublicUrl(filePath);

    return { success: true, url: publicUrlData.publicUrl };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to upload image" };
  }
}

export async function deleteProductImageFromStorage(imageUrl: string): Promise<void> {
  try {
    const bucketMarker = "/product-images/";
    const idx = imageUrl.indexOf(bucketMarker);
    if (idx !== -1) {
      const filePath = decodeURIComponent(imageUrl.substring(idx + bucketMarker.length));
      await supabase.storage.from("product-images").remove([filePath]);
    }
  } catch (err) {
    console.warn("Storage deletion warning:", err);
  }
}

export async function updateProductImages(
  slug: string,
  images: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const current = cachedInventory[slug];
    const initial = current?.initial ?? (CATALOG[slug]?.stock ?? 50);
    const sold = current?.sold ?? 0;
    const currentPrice = current?.price_inr ?? null;

    const upsertPayload: any = {
      product_slug: slug,
      initial_stock: initial,
      sold_stock: sold,
      images,
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
        initial,
        sold,
        available: Math.max(0, initial - sold),
        price_inr: currentPrice,
        images,
      },
    };
    notifyListeners();
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to update pictures" };
  }
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
    const currentImages = current?.images ?? null;

    const upsertPayload: any = {
      product_slug: slug,
      initial_stock: newInitial,
      sold_stock: currentSold,
      updated_at: new Date().toISOString(),
    };
    if (currentPrice !== null && currentPrice !== undefined) {
      upsertPayload.price_inr = currentPrice;
    }
    if (currentImages !== null && currentImages !== undefined) {
      upsertPayload.images = currentImages;
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
        images: currentImages,
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
    const currentImages = current?.images ?? null;

    const upsertPayload: any = {
      product_slug: slug,
      initial_stock: initial,
      sold_stock: sold,
      price_inr: validMRP,
      updated_at: new Date().toISOString(),
    };
    if (currentImages !== null && currentImages !== undefined) {
      upsertPayload.images = currentImages;
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
        initial,
        sold,
        available: Math.max(0, initial - sold),
        price_inr: validMRP,
        images: currentImages,
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
    const currentImages = current?.images ?? null;

    const upsertPayload: any = {
      product_slug: slug,
      initial_stock: validInitial,
      sold_stock: validSold,
      updated_at: new Date().toISOString(),
    };
    if (currentPrice !== null && currentPrice !== undefined) {
      upsertPayload.price_inr = currentPrice;
    }
    if (currentImages !== null && currentImages !== undefined) {
      upsertPayload.images = currentImages;
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
        images: currentImages,
      },
    };
    notifyListeners();
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to update stock" };
  }
}

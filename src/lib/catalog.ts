import productCorn from "@/assets/product-corn-main.png";
import productJowar from "@/assets/product-jowar-main.png";
import productQuinoa from "@/assets/product-quinoa-main.png";
import productMultigrain from "@/assets/product-multigrain-main.png";

export type CatalogProduct = {
  slug: string;
  name: string;
  tagline: string;
  image: string;
  price: number; // INR - single unit
};

export const CATALOG: Record<string, CatalogProduct> = {
  "woh-corn-thi": {
    slug: "woh-corn-thi",
    name: "Woh Corn Thi",
    tagline: "Roasted Corn Puffs",
    image: productCorn,
    price: 99,
  },
  "yeh-jowaari-hai-deewani": {
    slug: "yeh-jowaari-hai-deewani",
    name: "Yeh Jowaari Hai Deewani",
    tagline: "Roasted Jowar Puffs",
    image: productJowar,
    price: 109,
  },
  "quinoa-se-quinoa-tak": {
    slug: "quinoa-se-quinoa-tak",
    name: "Quinoa se Quinoa Tak",
    tagline: "Roasted Quinoa Puffs",
    image: productQuinoa,
    price: 129,
  },
  "hum-saath-saath-hai": {
    slug: "hum-saath-saath-hai",
    name: "Hum Saath Saath Hai",
    tagline: "Roasted Multigrain Puffs",
    image: productMultigrain,
    price: 119,
  },
};

export const getProduct = (slug: string) => CATALOG[slug];

// ---------- Variants ----------
export type Variant = "single" | "po3" | "po4";

export const VARIANT_META: Record<Variant, { label: string; short: string; count: number; price: number }> = {
  single: { label: "Single", short: "×1", count: 1, price: 0 /* uses product.price */ },
  po3:    { label: "Pack of 3", short: "PO3", count: 3, price: 299 },
  po4:    { label: "Pack of 4", short: "PO4", count: 4, price: 379 },
};

export function variantPrice(variant: Variant, productSlug: string): number {
  if (variant === "single") return CATALOG[productSlug]?.price ?? 0;
  return VARIANT_META[variant].price;
}

export function variantLabel(variant: Variant): string {
  return VARIANT_META[variant].label;
}

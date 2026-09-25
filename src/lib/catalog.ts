import productCorn from "@/assets/product-corn-main.webp";
import productJowar from "@/assets/product-jowar-main.webp";
import productQuinoa from "@/assets/product-quinoa-main.webp";
import productMultigrain from "@/assets/product-multigrain-main.webp";
import fomoBottle from "@/assets/steel-bottle-new.webp";
import hamperClassic from "@/assets/hamper-classic.webp";
import hamperFitness from "@/assets/hamper-fitness.webp";
import hamperParty from "@/assets/hamper-party.webp";

import coffeeWalnutCookies from "@/assets/coffee-walnut-cookies.webp";
import jowaarJaggeryCookies from "@/assets/jowaar-jaggery-cookies.webp";
import multigrainJaggeryCookies from "@/assets/multigrain-jaggery-cookies.webp";
import bajraJaggeryCookies from "@/assets/bajra-jaggery-cookies.webp";
import vanillaChocolateCookies from "@/assets/vanilla-chocolate-cookies.webp";
import chocochipsSticks from "@/assets/chocochips-sticks.webp";
import almondSticks from "@/assets/almond-sticks.webp";
import kunafa from "@/assets/kunafa.webp";
import milletBaklava from "@/assets/millet-baklava.webp";
import doubleChocolateCookies from "@/assets/double-chocolate-cookies.webp";
import nachniJaggeryCookies from "@/assets/nachni-jaggery-cookies.webp";
import oatsSticks from "@/assets/oats-sticks.webp";

import productCornBack from "@/assets/product-woh-corn-thi-back.webp";
import productJowarBack from "@/assets/product-yeh-jowaari-back.webp";
import productQuinoaBack from "@/assets/product-quinoa-se-quinoa-back.webp";
import productMultigrainBack from "@/assets/product-hum-saath-back.webp";

export type ProductCategory = "puffs" | "sweets" | "sticks" | "cookies" | "accessories" | "hampers";

export type CatalogProduct = {
  slug: string;
  name: string;
  tagline: string;
  image: string;
  price: number; // INR - MRP
  category: ProductCategory;
  moq?: number;  // Minimum order quantity if applicable
  isHamper?: boolean;
  isSoldOut?: boolean;
  stock?: number;
};

export const CATALOG: Record<string, CatalogProduct> = {
  "woh-corn-thi": {
    slug: "woh-corn-thi",
    name: "Woh Corn Thi",
    tagline: "Roasted Corn Puffs",
    image: productCorn,
    price: 60,
    category: "puffs",
  },
  "yeh-jowaari-hai-deewani": {
    slug: "yeh-jowaari-hai-deewani",
    name: "Yeh Jowaari Hai Deewani",
    tagline: "Roasted Jowar Puffs",
    image: productJowar,
    price: 60,
    category: "puffs",
  },
  "quinoa-se-quinoa-tak": {
    slug: "quinoa-se-quinoa-tak",
    name: "Quinoa se Quinoa Tak",
    tagline: "Roasted Quinoa Puffs",
    image: productQuinoa,
    price: 60,
    category: "puffs",
  },
  "hum-saath-saath-hai": {
    slug: "hum-saath-saath-hai",
    name: "Hum Saath Saath Hai",
    tagline: "Roasted Multigrain Puffs",
    image: productMultigrain,
    price: 60,
    category: "puffs",
  },
  "double-chocolate-cookies": {
    slug: "double-chocolate-cookies",
    name: "Double Chocolate Cookies",
    tagline: "Rich Chocolatey Delight",
    image: doubleChocolateCookies,
    price: 310,
    category: "cookies",
    stock: 1,
  },
  "millet-baklava": {
    slug: "millet-baklava",
    name: "Millet Baklava",
    tagline: "Traditional • Delicious • Premium",
    image: milletBaklava,
    price: 245,
    category: "sweets",
    isSoldOut: true,
    stock: 0,
  },
  "kunafa": {
    slug: "kunafa",
    name: "Kunafa",
    tagline: "Traditional • Delicious • Premium",
    image: kunafa,
    price: 245,
    category: "sweets",
    isSoldOut: true,
    stock: 0,
  },
  "almond-sticks": {
    slug: "almond-sticks",
    name: "Almond Sticks",
    tagline: "Crunchy & Delicious",
    image: almondSticks,
    price: 310,
    category: "sticks",
    stock: 4,
  },
  "chocochips-sticks": {
    slug: "chocochips-sticks",
    name: "ChocoChips Sticks",
    tagline: "Crunchy & Delicious",
    image: chocochipsSticks,
    price: 310,
    category: "sticks",
    stock: 3,
  },
  "vanilla-chocolate-cookies": {
    slug: "vanilla-chocolate-cookies",
    name: "Vanilla Chocolate Cookies",
    tagline: "Crunchy, Buttery & Delightful",
    image: vanillaChocolateCookies,
    price: 310,
    category: "cookies",
    isSoldOut: true,
    stock: 0,
  },
  "coffee-walnut-cookies": {
    slug: "coffee-walnut-cookies",
    name: "Coffee Walnut Cookies",
    tagline: "Rich Coffee & Crunchy Walnut",
    image: coffeeWalnutCookies,
    price: 310,
    category: "cookies",
    isSoldOut: true,
    stock: 0,
  },
  "jowaar-jaggery-cookies": {
    slug: "jowaar-jaggery-cookies",
    name: "Jowaar Jaggery Cookies",
    tagline: "Wholesome Jowaar with Pure Jaggery",
    image: jowaarJaggeryCookies,
    price: 310,
    category: "cookies",
    stock: 2,
  },
  "multigrain-jaggery-cookies": {
    slug: "multigrain-jaggery-cookies",
    name: "Multigrain Jaggery Cookies",
    tagline: "Goodness of Multigrains & Jaggery",
    image: multigrainJaggeryCookies,
    price: 310,
    category: "cookies",
    stock: 2,
  },
  "bajra-jaggery-cookies": {
    slug: "bajra-jaggery-cookies",
    name: "Bajra Jaggery Cookies",
    tagline: "Nutritious Bajra & Pure Jaggery",
    image: bajraJaggeryCookies,
    price: 310,
    category: "cookies",
    stock: 6,
  },
  "nachni-jaggery-cookies": {
    slug: "nachni-jaggery-cookies",
    name: "Nachni Jaggery Cookies",
    tagline: "Goodness of Millets & Pure Jaggery",
    image: nachniJaggeryCookies,
    price: 310,
    category: "cookies",
    stock: 4,
  },
  "oats-sticks": {
    slug: "oats-sticks",
    name: "Oats Sticks",
    tagline: "Crunchy & Delicious",
    image: oatsSticks,
    price: 310,
    category: "sticks",
    stock: 5,
  },
  "fomo-steel-bottle": {
    slug: "fomo-steel-bottle",
    name: "FOMO Steel Bottle",
    tagline: "Premium Stainless Steel Bottle",
    image: fomoBottle,
    price: 300,
    category: "accessories",
    isSoldOut: true,
  },
  "hamper-classic": {
    slug: "hamper-classic",
    name: "Classic Gift Box",
    tagline: "Perfect for Gifting",
    image: hamperClassic,
    price: 600,
    moq: 5,
    isHamper: true,
    category: "hampers",
    isSoldOut: true,
  },
  "hamper-fitness": {
    slug: "hamper-fitness",
    name: "Fitness Gift Box",
    tagline: "Healthy & Tasty Gifting",
    image: hamperFitness,
    price: 900,
    moq: 5,
    isHamper: true,
    category: "hampers",
    isSoldOut: true,
  },
  "hamper-party": {
    slug: "hamper-party",
    name: "Bollywood Party Hamper",
    tagline: "Ultimate Celebration Hamper",
    image: hamperParty,
    price: 1200,
    moq: 3,
    isHamper: true,
    category: "hampers",
    isSoldOut: true,
  },
};

export const getProduct = (slug: string) => CATALOG[slug];

// ---------- Variants ----------
export type Variant = "single" | "po3" | "po5" | "free";

export const VARIANT_META: Record<Variant, { label: string; short: string; count: number; price: number }> = {
  single: { label: "Single", short: "×1", count: 1, price: 0 /* uses product.price */ },
  po3:    { label: "Pack of 3", short: "PO3", count: 3, price: 150 },
  po5:    { label: "Pack of 5", short: "PO5", count: 5, price: 250 },
  free:   { label: "Free Gift", short: "Free", count: 1, price: 0 },
};

let dynamicPriceGetter: ((slug: string) => number) | null = null;

export function registerDynamicPriceGetter(getter: (slug: string) => number) {
  dynamicPriceGetter = getter;
}

export function getProductPrice(slug: string): number {
  if (dynamicPriceGetter) {
    const dynamic = dynamicPriceGetter(slug);
    if (typeof dynamic === "number" && dynamic > 0) return dynamic;
  }
  return CATALOG[slug]?.price ?? 0;
}

export function variantPrice(variant: Variant, productSlug: string): number {
  if (variant === "free") return 0;
  const basePrice = getProductPrice(productSlug);
  if (variant === "single") return basePrice;
  
  const discountRatio = 150 / 180; // ~16.67% discount
  if (variant === "po3") {
    return Math.round((3 * basePrice * discountRatio) / 5) * 5;
  }
  if (variant === "po5") {
    return Math.round((5 * basePrice * discountRatio) / 5) * 5;
  }
  return basePrice;
}

export function variantLabel(variant: Variant): string {
  if (CATALOG[variant]?.isHamper) return "Hamper";
  return VARIANT_META[variant]?.label ?? "Hamper";
}

export const DEFAULT_PRODUCT_IMAGES: Record<string, string[]> = {
  "woh-corn-thi": [productCorn, productCornBack],
  "yeh-jowaari-hai-deewani": [productJowar, productJowarBack],
  "quinoa-se-quinoa-tak": [productQuinoa, productQuinoaBack],
  "hum-saath-saath-hai": [productMultigrain, productMultigrainBack],
  "double-chocolate-cookies": [doubleChocolateCookies],
  "millet-baklava": [milletBaklava],
  "kunafa": [kunafa],
  "almond-sticks": [almondSticks],
  "chocochips-sticks": [chocochipsSticks],
  "vanilla-chocolate-cookies": [vanillaChocolateCookies],
  "coffee-walnut-cookies": [coffeeWalnutCookies],
  "jowaar-jaggery-cookies": [jowaarJaggeryCookies],
  "multigrain-jaggery-cookies": [multigrainJaggeryCookies],
  "bajra-jaggery-cookies": [bajraJaggeryCookies],
  "nachni-jaggery-cookies": [nachniJaggeryCookies],
  "oats-sticks": [oatsSticks],
  "fomo-steel-bottle": [fomoBottle],
  "hamper-classic": [hamperClassic],
  "hamper-fitness": [hamperFitness],
  "hamper-party": [hamperParty],
};

let dynamicImagesGetter: ((slug: string) => string[] | undefined) | null = null;

export function registerDynamicImagesGetter(getter: (slug: string) => string[] | undefined) {
  dynamicImagesGetter = getter;
}

export function getProductImages(slug: string): string[] {
  if (dynamicImagesGetter) {
    const dynamic = dynamicImagesGetter(slug);
    if (Array.isArray(dynamic) && dynamic.length > 0) return dynamic;
  }
  return DEFAULT_PRODUCT_IMAGES[slug] || (CATALOG[slug]?.image ? [CATALOG[slug].image] : []);
}

export function getProductMainImage(slug: string): string {
  const list = getProductImages(slug);
  return list[0] || CATALOG[slug]?.image || "";
}


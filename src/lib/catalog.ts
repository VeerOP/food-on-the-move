import productCorn from "@/assets/product-corn-main.png";
import productJowar from "@/assets/product-jowar-main.png";
import productQuinoa from "@/assets/product-quinoa-main.png";
import productMultigrain from "@/assets/product-multigrain-main.png";
import fomoBottle from "@/assets/steel-bottle-new.jpeg";
import hamperClassic from "@/assets/hamper-classic.png";
import hamperFitness from "@/assets/hamper-fitness.png";
import hamperParty from "@/assets/hamper-party.png";

import coffeeWalnutCookies from "@/assets/coffee-walnut-cookies.jpeg";
import jowaarJaggeryCookies from "@/assets/jowaar-jaggery-cookies.jpeg";
import multigrainJaggeryCookies from "@/assets/multigrain-jaggery-cookies.jpeg";
import bajraJaggeryCookies from "@/assets/bajra-jaggery-cookies.jpeg";
import vanillaChocolateCookies from "@/assets/vanilla-chocolate-cookies.jpeg";
import chocochipsSticks from "@/assets/chocochips-sticks.jpeg";
import almondSticks from "@/assets/almond-sticks.jpeg";
import kunafa from "@/assets/kunafa.jpeg";
import milletBaklava from "@/assets/millet-baklava.jpeg";
import doubleChocolateCookies from "@/assets/double-chocolate-cookies.jpeg";

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
    isSoldOut: true,
  },
  "millet-baklava": {
    slug: "millet-baklava",
    name: "Millet Baklava",
    tagline: "Traditional • Delicious • Premium",
    image: milletBaklava,
    price: 245,
    category: "sweets",
    isSoldOut: true,
  },
  "kunafa": {
    slug: "kunafa",
    name: "Kunafa",
    tagline: "Traditional • Delicious • Premium",
    image: kunafa,
    price: 245,
    category: "sweets",
    isSoldOut: true,
  },
  "almond-sticks": {
    slug: "almond-sticks",
    name: "Almond Sticks",
    tagline: "Crunchy & Delicious",
    image: almondSticks,
    price: 310,
    category: "sticks",
    isSoldOut: true,
  },
  "chocochips-sticks": {
    slug: "chocochips-sticks",
    name: "ChocoChips Sticks",
    tagline: "Crunchy & Delicious",
    image: chocochipsSticks,
    price: 310,
    category: "sticks",
    isSoldOut: true,
  },
  "vanilla-chocolate-cookies": {
    slug: "vanilla-chocolate-cookies",
    name: "Vanilla Chocolate Cookies",
    tagline: "Crunchy, Buttery & Delightful",
    image: vanillaChocolateCookies,
    price: 310,
    category: "cookies",
    isSoldOut: true,
  },
  "coffee-walnut-cookies": {
    slug: "coffee-walnut-cookies",
    name: "Coffee Walnut Cookies",
    tagline: "Rich Coffee & Crunchy Walnut",
    image: coffeeWalnutCookies,
    price: 310,
    category: "cookies",
    isSoldOut: true,
  },
  "jowaar-jaggery-cookies": {
    slug: "jowaar-jaggery-cookies",
    name: "Jowaar Jaggery Cookies",
    tagline: "Wholesome Jowaar with Pure Jaggery",
    image: jowaarJaggeryCookies,
    price: 310,
    category: "cookies",
    isSoldOut: true,
  },
  "multigrain-jaggery-cookies": {
    slug: "multigrain-jaggery-cookies",
    name: "Multigrain Jaggery Cookies",
    tagline: "Goodness of Multigrains & Jaggery",
    image: multigrainJaggeryCookies,
    price: 310,
    category: "cookies",
    isSoldOut: true,
  },
  "bajra-jaggery-cookies": {
    slug: "bajra-jaggery-cookies",
    name: "Bajra Jaggery Cookies",
    tagline: "Nutritious Bajra & Pure Jaggery",
    image: bajraJaggeryCookies,
    price: 310,
    category: "cookies",
    isSoldOut: true,
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

export function variantPrice(variant: Variant, productSlug: string): number {
  if (variant === "free") return 0;
  const basePrice = CATALOG[productSlug]?.price ?? 0;
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


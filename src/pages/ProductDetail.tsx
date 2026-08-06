import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Leaf, Zap, Heart, Award, CheckCircle, ChevronLeft, ChevronRight, ShoppingCart, Zap as ZapIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useCart } from "@/hooks/use-cart";
import { CATALOG, VARIANT_META, Variant, variantPrice } from "@/lib/catalog";
import { BundleBuilder } from "@/components/BundleBuilder";
import { cn } from "@/lib/utils";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import productCorn from "@/assets/product-corn-main.png";
import productCornBack from "@/assets/product-woh-corn-thi-back.jpg";
import productJowar from "@/assets/product-jowar-main.png";
import productJowarBack from "@/assets/product-yeh-jowaari-back.jpg";
import productQuinoa from "@/assets/product-quinoa-main.png";
import productQuinoaBack from "@/assets/product-quinoa-se-quinoa-back.jpg";
import productMultigrain from "@/assets/product-multigrain-main.png";
import productMultigrainBack from "@/assets/product-hum-saath-back.jpg";
import lifestyleQuinoa from "@/assets/lifestyle-quinoa.png";
import lifestyleJowar from "@/assets/lifestyle-jowar.png";
import lifestyleCorn from "@/assets/lifestyle-corn.png";
import lifestyleMultigrain from "@/assets/lifestyle-multigrain.png";

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
import fomoBottle from "@/assets/steel-bottle-new.jpeg";

const productsData: Record<string, any> = {
  "woh-corn-thi": {
    id: 1,
    name: "Woh Corn Thi",
    tagline: "Roasted Corn Puffs",
    description: "Crispy, golden, and bursting with Tomato and cheese flavour. Our corn puffs are the perfect blend of crunch and taste that will keep you coming back for more.",
    images: [productCorn, productCornBack],
    color: "from-blue-500/30 to-indigo-500/30",
    accentColor: "text-blue-400",
    features: [
      { icon: Leaf, text: "Non-Fried" },
      { icon: Zap, text: "Any Time Snacking" },
      { icon: Heart, text: "Zero Trans Fat" },
      { icon: Award, text: "Premium Quality" },
    ],
    mainIngredients: ["Corn Grits", "Rice Grits", "Rice Bran Oil", "Cheese Powder", "Tomato Powder", "Spices"],
    fullIngredients: "Corn Grits, Rice Grits, Edible Vegetable Oil (Rice Bran), Sugar, Maltodextrin, Iodised Salt, Starch Powder, Dehydrated Vegetable Powder (Onion, Garlic), Cheese Powder, Whey Powder, Flavour Enhancers (INS631, INS 627), Red Chilli Powder, Natural Colouring Substance (INS 160c), Acidity Regulator (330, 334, 262), Hydrolysed Vegetable Protein (Soya Based), Black Pepper Powder, Anticaking Agent (INS 551), Antioxidant (INS319), Tomato Powder, Spices & Condiments (Chili, Ginger, Nutmeg, Black Pepper, Clove, Cinnamon, Garlic, Onion), Citric Acid. Natural and Nature Identical Flavoring Substances (Cheese).",
    nutritionFacts: [
      { nutrient: "Energy", per100g: "439.3 Kcal", dailyValue: "22.0%" },
      { nutrient: "Protein", per100g: "6.45 g", dailyValue: "-" },
      { nutrient: "Carbohydrates", per100g: "76.81 g", dailyValue: "-" },
      { nutrient: "Total Sugars", per100g: "2.06 g", dailyValue: "-" },
      { nutrient: "Added Sugars", per100g: "ND < 0.1 g", dailyValue: "0.0%" },
      { nutrient: "Fat", per100g: "11.81 g", dailyValue: "17.6%" },
      { nutrient: "Saturated Fats", per100g: "5.42 g", dailyValue: "24.6%" },
      { nutrient: "Unsaturated Fats", per100g: "6.39 g", dailyValue: "-" },
      { nutrient: "Trans Fat", per100g: "ND < 0.5 g", dailyValue: "0.0%" },
      { nutrient: "Cholesterol", per100g: "ND < 0.2 mg", dailyValue: "-" },
      { nutrient: "Sodium", per100g: "726.9 mg", dailyValue: "36.3%" },
    ],
    benefits: [
      "Non-fried snack",
      "Any time snacking",
      "Zero Trans Fat",
      "Perfect for on-the-go",
    ],
    lifestyleImage: lifestyleCorn,
    lifestyleCaption: "Movie Night Essential",
  },
  "yeh-jowaari-hai-deewani": {
    id: 2,
    name: "Yeh Jowaari Hai Deewani",
    tagline: "Roasted Jowar Puffs",
    description: "Wholesome, gluten-free, and rich in fibre — for clean, sustained energy. Made from premium jowar (sorghum), these puffs are perfect for health-conscious snackers.",
    images: [productJowar, productJowarBack],
    color: "from-gray-500/30 to-zinc-500/30",
    accentColor: "text-gray-400",
    features: [
      { icon: Leaf, text: "Millet Power & Gluten-Free" },
      { icon: Zap, text: "Protein Rich" },
      { icon: Heart, text: "Zero Trans Fat" },
      { icon: Award, text: "Non-Fried" },
    ],
    mainIngredients: ["Jowar Flour", "Rice Grits", "Rice Bran Oil", "Mango Powder", "Tomato Powder", "Spices"],
    fullIngredients: "Jowar Flour, Rice Grits, Edible Vegetable Oil (Rice Bran), Sugar, Iodised Salt, Red Chilli Powder, Maltodextrin, Spices & Condiments, Mango Powder, Acidity Regulators (INS 330, INS 296), Coriander Powder, Flavour Enhancer (INS 627, INS631), Tomato Powder, Onion Powder and Anti Caking Agent (INS 551). Contains Added Flavour (Natural and Nature Identical Flavouring Substances - Paprika Oleoresin).",
    nutritionFacts: [
      { nutrient: "Energy", per100g: "441.1 Kcal", dailyValue: "22.1%" },
      { nutrient: "Protein", per100g: "7.12 g", dailyValue: "-" },
      { nutrient: "Carbohydrates", per100g: "72.83 g", dailyValue: "-" },
      { nutrient: "Total Sugars", per100g: "1.79 g", dailyValue: "-" },
      { nutrient: "Added Sugars", per100g: "ND < 0.1 g", dailyValue: "0.0%" },
      { nutrient: "Fat", per100g: "13.48 g", dailyValue: "20.1%" },
      { nutrient: "Saturated Fats", per100g: "6.28 g", dailyValue: "28.5%" },
      { nutrient: "Unsaturated Fats", per100g: "7.20 g", dailyValue: "-" },
      { nutrient: "Trans Fat", per100g: "ND < 0.5 g", dailyValue: "0.0%" },
      { nutrient: "Cholesterol", per100g: "ND < 2.0 mg", dailyValue: "-" },
      { nutrient: "Sodium", per100g: "730.1 mg", dailyValue: "36.5%" },
    ],
    benefits: [
      "Millet power",
      "Gluten free",
      "Non-fried",
      "Protein rich",
      "Zero Trans Fat",
      "Any time snacking",
    ],
    lifestyleImage: lifestyleJowar,
    lifestyleCaption: "Perfect Chai Partner",
  },
  "quinoa-se-quinoa-tak": {
    id: 3,
    name: "Quinoa se Quinoa Tak",
    tagline: "Roasted Quinoa Puffs",
    description: "Protein-packed, light, and crunchy — perfect for mindful snackers. Quinoa is a complete protein containing all nine essential amino acids.",
    images: [productQuinoa, productQuinoaBack],
    color: "from-gray-600/30 to-stone-500/30",
    accentColor: "text-stone-400",
    features: [
      { icon: Leaf, text: "Complete Protein" },
      { icon: Zap, text: "All 9 Amino Acids" },
      { icon: Heart, text: "Low Glycemic" },
      { icon: Award, text: "Superfood" },
    ],
    mainIngredients: ["Quinoa", "Jowar Flour", "Oats", "Rice Bran Oil", "Gram Grits", "Milk Solids"],
    fullIngredients: "Corn Grits, Rice Grits, Jowar Flour, Edible Vegetable Oil (Rice Bran), Quinoa, Oats, Gram Grits, Potato Flakes, Edible Vegetable Oil (Rice Bran Oil), Sugar, Iodised Salt, Milk Solids, Onion Powder, Parsley Leaves, Flavour Enhancer (INS 631, INS 627), Maltodextrin, Garlic Powder, Acidity Regulator (INS 330), Anticaking Agent (INS 341(iii), INS 551). Natural & Nature Identical Flavouring Substances (Cream, Onion). Allergen: Contains Milk.",
    nutritionFacts: [
      { nutrient: "Energy", per100g: "450.0 Kcal", dailyValue: "22.5%" },
      { nutrient: "Protein", per100g: "8.59 g", dailyValue: "-" },
      { nutrient: "Carbohydrates", per100g: "71.49 g", dailyValue: "-" },
      { nutrient: "Total Sugars", per100g: "1.55 g", dailyValue: "-" },
      { nutrient: "Added Sugars", per100g: "ND < 0.1 g", dailyValue: "0.0%" },
      { nutrient: "Fat", per100g: "14.41 g", dailyValue: "21.5%" },
      { nutrient: "Saturated Fats", per100g: "6.70 g", dailyValue: "30.5%" },
      { nutrient: "Unsaturated Fats", per100g: "7.71 g", dailyValue: "-" },
      { nutrient: "Trans Fat", per100g: "ND < 0.5 g", dailyValue: "0.0%" },
      { nutrient: "Cholesterol", per100g: "ND < 2.0 mg", dailyValue: "-" },
      { nutrient: "Sodium", per100g: "836.0 mg", dailyValue: "41.8%" },
      { nutrient: "Dietary Fibre", per100g: "4.94 mg", dailyValue: "-" },
    ],
    benefits: [
      "Complete plant protein",
      "Supports muscle recovery",
      "Great for weight management",
      "Rich in minerals",
    ],
    lifestyleImage: lifestyleQuinoa,
    lifestyleCaption: "Blockbuster Puffs",
  },
  "hum-saath-saath-hai": {
    id: 4,
    name: "Hum Saath Saath Hai",
    tagline: "Roasted Multigrain Puffs",
    description: "A delicious medley of grains, bringing together health and taste. The perfect combination of corn, jowar, quinoa, and oats for maximum nutrition.",
    images: [productMultigrain, productMultigrainBack],
    color: "from-orange-500/30 to-amber-500/30",
    accentColor: "text-orange-400",
    features: [
      { icon: Leaf, text: "Millet Power" },
      { icon: Zap, text: "Protein Rich" },
      { icon: Heart, text: "Non-Fried" },
      { icon: Award, text: "Any Time Snacking" },
    ],
    mainIngredients: ["Corn Grits", "Jowar Flour", "Quinoa", "Oats", "Gram Grits", "Rice Bran Oil"],
    fullIngredients: "Corn Grits, Rice Grits, Jowar Flour, Edible Vegetable Oil (Rice Bran), Quinoa, Oats, Gram Grits, Potato Flakes, Edible Vegetable Oil (Rice Bran Oil), Sugar, Iodised Salt, Milk Solids, Onion Powder, Parsley Leaves, Flavour Enhancer (INS 631, INS 627), Maltodextrin, Garlic Powder, Acidity Regulator (INS 330), Anticaking Agent (INS 341(iii), INS 551). Natural & Nature Identical Flavouring Substances (Cream, Onion). Allergen: Contains Milk.",
    nutritionFacts: [
      { nutrient: "Energy", per100g: "450.0 Kcal", dailyValue: "22.5%" },
      { nutrient: "Protein", per100g: "8.59 g", dailyValue: "-" },
      { nutrient: "Carbohydrates", per100g: "71.49 g", dailyValue: "-" },
      { nutrient: "Total Sugars", per100g: "1.55 g", dailyValue: "-" },
      { nutrient: "Added Sugars", per100g: "ND < 0.1 g", dailyValue: "0.0%" },
      { nutrient: "Fat", per100g: "14.41 g", dailyValue: "21.5%" },
      { nutrient: "Saturated Fats", per100g: "6.70 g", dailyValue: "30.5%" },
      { nutrient: "Unsaturated Fats", per100g: "7.71 g", dailyValue: "-" },
      { nutrient: "Trans Fat", per100g: "ND < 0.5 g", dailyValue: "0.0%" },
      { nutrient: "Cholesterol", per100g: "ND < 2.0 mg", dailyValue: "-" },
      { nutrient: "Sodium", per100g: "836.0 mg", dailyValue: "41.8%" },
      { nutrient: "Dietary Fibre", per100g: "4.94 mg", dailyValue: "-" },
    ],
    benefits: [
      "Millet power",
      "Non-fried",
      "Protein rich",
      "Any time snacking",
    ],
    lifestyleImage: lifestyleMultigrain,
    lifestyleCaption: "Guilt-free Snacking",
  },
  "double-chocolate-cookies": {
    id: 5,
    name: "Double Chocolate Cookies",
    tagline: "Rich Chocolatey Delight",
    description: "Crunchy outside, soft inside & loaded with rich chocolate chips. Baked with love and premium ingredients for the ultimate chocolate lovers.",
    images: [doubleChocolateCookies],
    color: "from-amber-900/40 to-yellow-800/30",
    accentColor: "text-amber-400",
    features: [
      { icon: Leaf, text: "100% Vegetarian" },
      { icon: Heart, text: "No Maida" },
      { icon: Zap, text: "Trans Fat Free" },
      { icon: Award, text: "No Preservatives" },
    ],
    mainIngredients: ["Wheat Flour", "Sugar", "Butter", "Chocolate Chips", "Cocoa Butter", "Cocoa Powder"],
    fullIngredients: "Wheat Flour, Sugar, Butter, Chocolate Chips, Cocoa Butter, Emulsifier (INS 322i), Cocoa Powder, Milk Solids, Vanilla Extract, Raising Agents (E500ii, E503ii), Iodized Salt.",
    nutritionFacts: [
      { nutrient: "Net Weight", per100g: "250g Container", dailyValue: "-" },
      { nutrient: "Shelf Life", per100g: "6 Months", dailyValue: "-" },
      { nutrient: "Trans Fat", per100g: "0 g", dailyValue: "0.0%" },
    ],
    benefits: ["Rich cocoa flavor", "No Maida", "Zero Trans Fat", "No artificial preservatives"],
  },
  "millet-baklava": {
    id: 6,
    name: "Millet Baklava",
    tagline: "Traditional • Delicious • Premium",
    description: "Exquisite traditional Middle-Eastern dessert reimagined with wholesome millets, desi ghee, almonds, cashews, pistachios, pure jaggery, honey, and saffron.",
    images: [milletBaklava],
    color: "from-amber-600/40 to-yellow-600/30",
    accentColor: "text-amber-300",
    features: [
      { icon: Leaf, text: "Made with Millets" },
      { icon: Heart, text: "No Maida" },
      { icon: Zap, text: "No Preservatives" },
      { icon: Award, text: "100% Vegetarian" },
    ],
    mainIngredients: ["Millet Flour", "Desi Ghee", "Almonds", "Cashews", "Pistachios", "Jaggery", "Honey"],
    fullIngredients: "Millet Flour, Desi Ghee, Nuts (Almonds, Cashews, Pistachios), Jaggery, Honey, Cardamom, Saffron. Allergen info: Contains Nuts and Milk.",
    nutritionFacts: [
      { nutrient: "Net Weight", per100g: "200g Pack", dailyValue: "-" },
      { nutrient: "Shelf Life", per100g: "30 Days", dailyValue: "-" },
    ],
    benefits: ["Rich in nuts & ghee", "Millet goodness", "No refined flour (No Maida)", "100% Vegetarian"],
  },
  "kunafa": {
    id: 7,
    name: "Kunafa",
    tagline: "Traditional • Delicious • Premium",
    description: "Crispy golden traditional dessert made with millet flour, rich ghee, premium nuts (almonds, cashews, pistachios), jaggery, cardamom, and aromatic saffron.",
    images: [kunafa],
    color: "from-amber-500/40 to-orange-500/30",
    accentColor: "text-orange-300",
    features: [
      { icon: Leaf, text: "Made with Millets" },
      { icon: Heart, text: "No Maida" },
      { icon: Zap, text: "No Preservatives" },
      { icon: Award, text: "100% Vegetarian" },
    ],
    mainIngredients: ["Millet Flour", "Ghee", "Almonds", "Cashews", "Pistachios", "Jaggery", "Cardamom"],
    fullIngredients: "Millet Flour, Ghee, Nuts (Almonds, Cashews, Pistachios), Jaggery, Milk, Cardamom, Saffron. Allergen info: Contains Nuts and Milk.",
    nutritionFacts: [
      { nutrient: "Net Weight", per100g: "200g Pack", dailyValue: "-" },
      { nutrient: "Shelf Life", per100g: "15 Days", dailyValue: "-" },
    ],
    benefits: ["Authentic crispy texture", "Prepared with pure ghee", "Nutrient rich millet base"],
  },
  "almond-sticks": {
    id: 8,
    name: "Almond Sticks",
    tagline: "Crunchy & Delicious",
    description: "Mouth-watering crunchy snack sticks baked with real almonds, butter, and wholesome ingredients. Any time is snack time!",
    images: [almondSticks],
    color: "from-yellow-600/40 to-amber-700/30",
    accentColor: "text-yellow-400",
    features: [
      { icon: Leaf, text: "Made with Real Almonds" },
      { icon: Heart, text: "No Maida" },
      { icon: Zap, text: "No Preservatives" },
      { icon: Award, text: "100% Vegetarian" },
    ],
    mainIngredients: ["Wheat Flour", "Sugar", "Butter", "Almonds (12%)", "Milk Solids"],
    fullIngredients: "Wheat Flour, Sugar, Butter, Almonds (12%), Milk Solids, Raising Agents (E500ii, E503ii), Iodized Salt.",
    nutritionFacts: [
      { nutrient: "Net Weight", per100g: "200g Jar", dailyValue: "-" },
      { nutrient: "Shelf Life", per100g: "6 Months", dailyValue: "-" },
    ],
    benefits: ["12% Real Almonds", "Crunchy & satisfying", "No Preservatives"],
  },
  "chocochips-sticks": {
    id: 9,
    name: "ChocoChips Sticks",
    tagline: "Crunchy & Delicious",
    description: "Crispy snack sticks studded with 13% rich choco chips and cocoa powder. Pure indulgence in every bite.",
    images: [chocochipsSticks],
    color: "from-amber-800/40 to-stone-700/30",
    accentColor: "text-amber-300",
    features: [
      { icon: Leaf, text: "Made with Millets" },
      { icon: Heart, text: "No Maida" },
      { icon: Zap, text: "No Preservatives" },
      { icon: Award, text: "13% Choco Chips" },
    ],
    mainIngredients: ["Wheat Flour", "Sugar", "Butter", "Choco Chips (13%)", "Cocoa Powder"],
    fullIngredients: "Wheat Flour, Sugar, Butter, Choco Chips (13%), Cocoa Powder, Milk Solids, Raising Agents (E500ii, E503ii), Iodized Salt.",
    nutritionFacts: [
      { nutrient: "Net Weight", per100g: "200g Jar", dailyValue: "-" },
      { nutrient: "Shelf Life", per100g: "6 Months", dailyValue: "-" },
    ],
    benefits: ["13% real chocolate chips", "Made with millets", "No Maida"],
  },
  "vanilla-chocolate-cookies": {
    id: 10,
    name: "Vanilla Chocolate Cookies",
    tagline: "Crunchy, Buttery & Delightfully Chocolatey",
    description: "Deliciously baked cookies combining fragrant vanilla extract with rich chocolate chips.",
    images: [vanillaChocolateCookies],
    color: "from-amber-600/40 to-amber-800/30",
    accentColor: "text-amber-300",
    features: [
      { icon: Leaf, text: "100% Vegetarian" },
      { icon: Heart, text: "No Maida" },
      { icon: Zap, text: "Trans Fat Free" },
      { icon: Award, text: "No Preservatives" },
    ],
    mainIngredients: ["Wheat Flour", "Sugar", "Butter", "Chocolate Chips", "Vanilla Extract"],
    fullIngredients: "Wheat Flour, Sugar, Butter, Chocolate Chips, Vanilla Extract, Milk Solids, Raising Agents (E500ii, E503ii), Iodized Salt.",
    nutritionFacts: [
      { nutrient: "Net Weight", per100g: "250g Jar", dailyValue: "-" },
      { nutrient: "Shelf Life", per100g: "6 Months", dailyValue: "-" },
    ],
    benefits: ["Buttery & crunchy", "Real vanilla extract", "Trans fat free"],
  },
  "fomo-steel-bottle": {
    id: 11,
    name: "FOMO Steel Bottle",
    tagline: "Premium Stainless Steel Bottle",
    description: "Sleek, durable, double-walled food-grade stainless steel bottle with Food On The Move branding. Keep your drinks cool or hot wherever you travel.",
    images: [fomoBottle],
    color: "from-emerald-600/40 to-teal-700/30",
    accentColor: "text-emerald-400",
    features: [
      { icon: Leaf, text: "Food Grade Steel" },
      { icon: Heart, text: "BPA Free" },
      { icon: Zap, text: "Eco Friendly" },
      { icon: Award, text: "Ergonomic Strap" },
    ],
    mainIngredients: ["100% Premium Stainless Steel", "Eco-friendly Lid & Strap"],
    fullIngredients: "High grade 304 Stainless Steel body, non-toxic BPA free silicone lid ring, durable carrying strap.",
    nutritionFacts: [
      { nutrient: "Capacity", per100g: "750 ml", dailyValue: "-" },
      { nutrient: "Material", per100g: "Stainless Steel", dailyValue: "-" },
    ],
    benefits: ["Eco-friendly & reusable", "Durable stainless steel", "Travel friendly strap"],
  },
};

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const catalogEntry = slug ? CATALOG[slug] : null;
  const product = slug 
    ? (productsData[slug] || (catalogEntry ? {
        id: catalogEntry.slug,
        name: catalogEntry.name,
        tagline: catalogEntry.tagline,
        description: `Delicious ${catalogEntry.name} prepared with premium ingredients by Food On The Move.`,
        images: [catalogEntry.image],
        color: "from-amber-600/40 to-yellow-600/30",
        accentColor: "text-amber-400",
        features: [
          { icon: Leaf, text: "100% Vegetarian" },
          { icon: Heart, text: "No Preservatives" },
          { icon: Zap, text: "Premium Quality" },
          { icon: Award, text: "Made with Love" },
        ],
        mainIngredients: ["Wholesome Ingredients", "Pure Ghee / Oil", "Natural Flavors"],
        fullIngredients: "Made with high quality selected ingredients, natural spices & flavors.",
        nutritionFacts: [
          { nutrient: "Quality", per100g: "100% Premium", dailyValue: "-" },
          { nutrient: "Preservatives", per100g: "Zero Preservatives", dailyValue: "-" },
        ],
        benefits: ["100% Vegetarian", "No Preservatives", "Made with Love"],
        lifestyleImage: null,
        lifestyleCaption: "",
      } : null)) 
    : null;
  const { addToCart, clearCart } = useCart();
  const navigate = useNavigate();
  const [variant, setVariant] = useState<Variant>("single");
  const [builderOpen, setBuilderOpen] = useState(false);
  const [adding, setAdding] = useState(false);

  const currentPrice = catalogEntry ? variantPrice(variant, catalogEntry.slug) : 0;

  const handleAdd = async (packItems?: string[]) => {
    if (!catalogEntry) return;
    setAdding(true);
    await addToCart(catalogEntry.slug, { variant, packItems: packItems ?? [] });
    setAdding(false);
    setBuilderOpen(false);
  };

  const handleBuyNow = async (packItems?: string[]) => {
    if (!catalogEntry) return;
    setAdding(true);
    await clearCart();
    await addToCart(catalogEntry.slug, { variant, packItems: packItems ?? [] });
    setAdding(false);
    setBuilderOpen(false);
    navigate("/checkout");
  };

  const onPrimaryClick = (buyNow: boolean) => {
    if (variant === "single") {
      buyNow ? handleBuyNow() : handleAdd();
    } else {
      // open builder; on confirm we'll add or buy now depending on last intent
      setBuyNowIntent(buyNow);
      setBuilderOpen(true);
    }
  };

  const [buyNowIntent, setBuyNowIntent] = useState(false);


  const location = useLocation();

  const handleBackClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (location.state?.from) {
      navigate(location.state.from);
    } else if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate("/products");
    }
  };

  // Scroll to top when page loads
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [slug]);

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display text-4xl mb-4">Product Not Found</h1>
          <button onClick={handleBackClick} className="inline-flex items-center gap-2 text-primary hover:underline font-medium">
            <ArrowLeft className="w-4 h-4" /> Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 relative overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-br ${product.color} opacity-50`} />
        <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[150px]" />
        
        <div className="section-container relative">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <button 
              onClick={handleBackClick} 
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8 text-sm font-semibold cursor-pointer bg-transparent border-0 outline-none"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Products
            </button>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Product Image Carousel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, type: "spring" }}
              className="relative flex justify-center"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${product.color} rounded-full blur-[100px] opacity-60`} />
              <div className="relative z-10 w-full max-w-md">
                <Carousel className="w-full">
                  <CarouselContent>
                    {product.images.map((image, index) => (
                      <CarouselItem key={index}>
                        <motion.div
                          className="flex items-center justify-center p-4"
                          animate={{ y: [0, -10, 0] }}
                          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        >
                          <img
                            src={image}
                            alt={`${product.name} - View ${index + 1}`}
                            className="w-full max-w-sm drop-shadow-2xl"
                          />
                        </motion.div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="left-0 bg-card/80 border-border hover:bg-card text-foreground" />
                  <CarouselNext className="right-0 bg-card/80 border-border hover:bg-card text-foreground" />
                </Carousel>
                {/* Slide indicators */}
                <div className="flex justify-center gap-2 mt-4">
                  {product.images.map((_, index) => (
                    <div
                      key={index}
                      className="w-2 h-2 rounded-full bg-muted-foreground/30"
                    />
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Product Info */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <span className={`${product.accentColor} font-semibold uppercase tracking-wider text-sm`}>
                {product.tagline}
              </span>
              <h1 className="font-display text-5xl md:text-6xl lg:text-7xl mt-2 mb-6 text-foreground">
                {product.name}
              </h1>
              <p className="text-muted-foreground text-lg leading-relaxed mb-8">
                {product.description}
              </p>
              {/* Lifestyle Image - Added per update request */}
              {product.lifestyleImage && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="mb-8 relative rounded-2xl overflow-hidden border border-border/50 shadow-2xl"
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
                  <img 
                    src={product.lifestyleImage} 
                    alt={`${product.name} - ${product.lifestyleCaption}`}
                    className="w-full h-auto object-cover"
                  />
                  <div className="absolute bottom-4 left-6 z-20">
                    <span className="text-white/80 text-xs font-mono uppercase tracking-widest mb-1 block">Scene 01</span>
                    <p className="text-white font-display text-xl">{product.lifestyleCaption}</p>
                  </div>
                </motion.div>
              )}


              {/* Features */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                {product.features.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                    className="flex items-center gap-3 bg-card/50 border border-border/50 rounded-xl p-4"
                  >
                    <feature.icon className={`w-5 h-5 ${product.accentColor}`} />
                    <span className="text-foreground text-sm font-medium">{feature.text}</span>
                  </motion.div>
                ))}
              </div>

              {/* Variant Selector + Order Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.8 }}
                className="space-y-4"
              >
                {catalogEntry && (
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Choose pack</p>
                    <div className="grid grid-cols-3 gap-2">
                      {(Object.keys(VARIANT_META) as Variant[]).map((v) => {
                        const meta = VARIANT_META[v];
                        const price = variantPrice(v, catalogEntry.slug);
                        const active = variant === v;
                        return (
                          <button
                            key={v}
                            onClick={() => setVariant(v)}
                            className={cn(
                              "rounded-xl border-2 p-3 text-left transition-all",
                              active
                                ? "border-primary bg-primary/10 shadow-lg shadow-primary/20"
                                : "border-border/50 bg-card hover:border-primary/50"
                            )}
                          >
                            <p className="text-sm font-semibold">{meta.label}</p>
                            <p className="text-xs text-muted-foreground">
                              {v === "single" ? "1 pack" : `Mix ${meta.count}`}
                            </p>
                            <p className={cn("text-base font-bold mt-1", active ? "text-primary" : "text-foreground")}>
                              ₹{price}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                  {catalogEntry && (
                    <>
                      <Button
                        variant="hero"
                        size="lg"
                        className="w-full sm:w-auto"
                        onClick={() => onPrimaryClick(false)}
                        disabled={adding}
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Add to Cart — ₹{currentPrice}
                      </Button>
                      <Button
                        variant="glow"
                        size="lg"
                        className="w-full sm:w-auto"
                        onClick={() => onPrimaryClick(true)}
                        disabled={adding}
                      >
                        <ZapIcon className="w-4 h-4 mr-2" />
                        Buy Now
                      </Button>
                    </>
                  )}
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto"
                    asChild
                  >
                    <a href="https://www.jiomart.com/groceries/b/food-on-the-move/220251" target="_blank" rel="noopener noreferrer">
                      Buy on JioMart
                    </a>
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Bundle builder dialog for PO3 / PO4 */}
      {variant !== "single" && (
        <BundleBuilder
          open={builderOpen}
          onOpenChange={setBuilderOpen}
          variant={variant}
          submitting={adding}
          onConfirm={(slugs) => (buyNowIntent ? handleBuyNow(slugs) : handleAdd(slugs))}
        />
      )}


      {/* Details Section */}
      <section className="py-16">
        <div className="section-container">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Ingredients */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-card border border-border/50 rounded-3xl p-8"
            >
              <h2 className="font-display text-2xl mb-4 text-foreground">Key Ingredients</h2>
              <p className="text-muted-foreground text-sm mb-6">Made with quality ingredients</p>
              
              {/* Main Ingredients as Badges */}
              <div className="flex flex-wrap gap-2 mb-6">
                {product.mainIngredients.map((ingredient, index) => (
                  <motion.span
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium text-foreground`}
                  >
                    <Leaf className={`w-3.5 h-3.5 ${product.accentColor}`} />
                    {ingredient}
                  </motion.span>
                ))}
              </div>

              {/* Full Ingredients in Collapsible */}
              <details className="group">
                <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
                  <span>View full ingredients list</span>
                  <ChevronRight className="w-4 h-4 transition-transform group-open:rotate-90" />
                </summary>
                <p className="mt-3 text-xs text-muted-foreground leading-relaxed border-t border-border/30 pt-3">
                  {product.fullIngredients}
                </p>
              </details>
            </motion.div>

            {/* Nutrition Facts */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-card border border-border/50 rounded-3xl p-8"
            >
              <h2 className="font-display text-2xl mb-4 text-foreground">Nutrition Highlights</h2>
              <p className="text-muted-foreground text-sm mb-6">Per 100g serving</p>
              
              {/* Key Nutrients as Cards */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {product.nutritionFacts.slice(0, 4).map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="bg-background/50 border border-border/30 rounded-xl p-3 text-center"
                  >
                    <span className={`text-lg font-bold ${product.accentColor}`}>{item.per100g}</span>
                    <p className="text-xs text-muted-foreground mt-1">{item.nutrient}</p>
                  </motion.div>
                ))}
              </div>

              {/* Full Nutrition Table in Collapsible */}
              <details className="group">
                <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
                  <span>View complete nutrition facts</span>
                  <ChevronRight className="w-4 h-4 transition-transform group-open:rotate-90" />
                </summary>
                <div className="mt-3 border-t border-border/30 pt-3 space-y-2">
                  <div className="flex justify-between items-center text-xs text-muted-foreground pb-2 mb-1">
                    <span>Nutrient</span>
                    <div className="flex gap-3">
                      <span className="w-16 text-right">Value</span>
                      <span className="w-12 text-right">% DV</span>
                    </div>
                  </div>
                  {product.nutritionFacts.map((item, index) => (
                    <div key={index} className="flex justify-between items-center text-xs border-b border-border/20 pb-1.5">
                      <span className="text-muted-foreground">{item.nutrient}</span>
                      <div className="flex gap-3">
                        <span className={`font-medium ${product.accentColor} w-16 text-right`}>{item.per100g}</span>
                        <span className="text-muted-foreground w-12 text-right">{item.dailyValue}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-muted-foreground text-xs mt-3">*Approximate values. Based on 2000kcal diet.</p>
              </details>
            </motion.div>

            {/* Benefits */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-card border border-border/50 rounded-3xl p-8"
            >
              <h2 className="font-display text-2xl mb-6 text-foreground">Benefits</h2>
              <ul className="space-y-3">
                {product.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-center gap-3 text-muted-foreground">
                    <Heart className={`w-4 h-4 ${product.accentColor}`} />
                    {benefit}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="section-container">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className={`bg-gradient-to-br ${product.color} rounded-3xl p-12 text-center relative overflow-hidden`}
          >
            <div className="absolute inset-0 bg-card/80 backdrop-blur-sm" />
            <div className="relative z-10">
              <h2 className="font-display text-4xl md:text-5xl mb-4 text-foreground">
                Ready to Taste the <span className="text-gradient">Difference</span>?
              </h2>
              <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
                Experience the bold flavors and wholesome goodness of {product.name}.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Link to="/#contact">
                  <Button size="lg" className="btn-primary">
                    Contact Us
                  </Button>
                </Link>
                <Link to="/#products">
                  <Button size="lg" variant="outline">
                    View All Products
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

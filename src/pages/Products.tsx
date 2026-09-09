import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CATALOG, ProductCategory } from "@/lib/catalog";
import { Sparkles, ArrowLeft } from "lucide-react";
import { ProductCardSnackible } from "@/components/ProductCardSnackible";

const CATEGORIES: { id: ProductCategory | "all"; label: string }[] = [
  { id: "all", label: "All Products" },
  { id: "puffs", label: "Roasted Puffs" },
  { id: "cookies", label: "Healthy Cookies" },
  { id: "sticks", label: "Crunchy Sticks" },
  { id: "sweets", label: "Sweets & Baklava" },
  { id: "accessories", label: "Accessories" },
  { id: "hampers", label: "Gift Hampers" },
];

export default function Products() {
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | "all">("all");

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  const allProductsList = Object.values(CATALOG);

  const filteredProducts = selectedCategory === "all" 
    ? allProductsList 
    : allProductsList.filter(p => p.category === selectedCategory);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      {/* Hero Header */}
      <section className="pt-32 pb-10 relative overflow-hidden bg-gradient-to-b from-primary/10 via-background to-background">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[140px] pointer-events-none" />

        <div className="section-container text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-5">
              <Link
                to="/#products"
                className="inline-flex items-center gap-2 text-xs sm:text-sm text-muted-foreground hover:text-foreground hover:text-primary transition-colors font-medium bg-card/70 border border-border/60 hover:border-primary/50 px-3.5 py-1.5 rounded-full shadow-sm"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Home Section
              </Link>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-semibold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" /> Complete Product Range
              </div>
            </div>
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl text-foreground font-black tracking-tight">
              EXPLORE OUR <span className="text-gradient">COLLECTION</span>
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto mt-3">
              From signature roasted puffs to rich wholesome cookies, crunchy sticks, baklava, and gift boxes.
            </p>
          </motion.div>

          {/* Category Filter Pills */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="flex items-center justify-center gap-2 flex-wrap mt-8"
          >
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-bold transition-all duration-200 flex items-center gap-2 cursor-pointer ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/25 scale-102"
                      : "bg-card border border-border/70 text-muted-foreground hover:text-foreground hover:border-foreground/30"
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Main Catalog Grid Section */}
      <section className="py-8 sm:py-12 flex-grow relative">
        <div className="section-container">
          <div className="flex justify-between items-center mb-6 pb-3 border-b border-border/40">
            <p className="text-muted-foreground text-xs sm:text-sm font-medium">
              Showing <span className="text-foreground font-bold">{filteredProducts.length}</span> products
            </p>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg">No products found in this category.</p>
            </div>
          ) : (
            <motion.div 
              layout
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6"
            >
              <AnimatePresence>
                {filteredProducts.map((product, idx) => (
                  <ProductCardSnackible
                    key={product.slug}
                    product={product}
                    isBestseller={idx < 4}
                    badgeText={idx === 0 ? "🔥 BESTSELLER" : "BESTSELLER"}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CATALOG, CatalogProduct, ProductCategory, variantPrice } from "@/lib/catalog";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Eye, Sparkles, Filter, ArrowLeft } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const CATEGORIES: { id: ProductCategory | "all"; label: string }[] = [
  { id: "all", label: "All Products" },
  { id: "puffs", label: "Puffs" },
  { id: "cookies", label: "Healthy Cookies" },
  { id: "sweets", label: "Sweets & Baklava" },
  { id: "sticks", label: "Sticks & Snacks" },
  { id: "accessories", label: "Accessories" },
  { id: "hampers", label: "Gift Hampers" },
];

export default function Products() {
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | "all">("all");
  const { addToCart } = useCart();
  const [addingSlug, setAddingSlug] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  const allProductsList = Object.values(CATALOG);

  const filteredProducts = selectedCategory === "all" 
    ? allProductsList 
    : allProductsList.filter(p => p.category === selectedCategory);

  const handleAddToCart = async (product: CatalogProduct, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setAddingSlug(product.slug);
    await addToCart(product.slug, { qty: 1, variant: "single" });
    setAddingSlug(null);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      {/* Hero Header */}
      <section className="pt-32 pb-12 relative overflow-hidden bg-gradient-to-b from-primary/10 via-background to-background">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[140px] pointer-events-none" />

        <div className="section-container text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Link to="/#products" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-6 font-medium">
              <ArrowLeft className="w-4 h-4" />
              Back to Home Section
            </Link>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider mb-4">
              <Sparkles className="w-3.5 h-3.5" /> Complete Product Range
            </div>
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl text-foreground font-bold">
              EXPLORE OUR <span className="text-gradient">FULL COLLECTION</span>
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto mt-4">
              From signature roasted puffs to rich cookies, artisanal baklava, kunafa, crunchy sticks, and accessories.
            </p>
          </motion.div>

          {/* Category Filter Pills */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex items-center justify-center gap-2 flex-wrap mt-10"
          >
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 scale-105"
                      : "bg-card border border-border/60 text-muted-foreground hover:text-foreground hover:border-primary/40"
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
      <section className="py-12 flex-grow relative">
        <div className="section-container">
          <div className="flex justify-between items-center mb-8 pb-4 border-b border-border/40">
            <p className="text-muted-foreground text-sm font-medium">
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
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              <AnimatePresence>
                {filteredProducts.map((product) => (
                  <motion.div
                    key={product.slug}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                    className="group relative bg-card border border-border/50 rounded-3xl overflow-hidden card-hover flex flex-col justify-between"
                  >
                     <Link to={`/product/${product.slug}`} state={{ from: "/products" }} className="block">
                      {/* Image container */}
                      <div className="relative h-64 p-6 bg-gradient-to-b from-primary/5 to-transparent flex items-center justify-center overflow-hidden">
                        {/* MRP Badge */}
                        <div className="absolute top-4 right-4 z-10 bg-primary/90 backdrop-blur-md text-primary-foreground font-extrabold text-xs px-3 py-1.5 rounded-full shadow-lg">
                          MRP ₹{product.price}
                        </div>

                        {/* Category Tag */}
                        <div className="absolute top-4 left-4 z-10 bg-background/80 backdrop-blur-md border border-border/50 text-foreground text-[10px] uppercase tracking-wider font-semibold px-2.5 py-1 rounded-lg">
                          {product.category}
                        </div>

                        {/* Sold Out Backdrop and Stamp Overlay */}
                        {product.isSoldOut && (
                          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] z-20 flex items-center justify-center pointer-events-none">
                            <span className="border-4 border-destructive text-destructive font-display text-2xl font-black uppercase tracking-widest px-4 py-2 rounded-xl rotate-[-12deg] shadow-2xl select-none bg-black/45">
                              Sold Out
                            </span>
                          </div>
                        )}

                        {/* Image */}
                        <img
                          src={product.image}
                          alt={product.name}
                          className="h-full w-auto object-contain drop-shadow-xl group-hover:scale-110 group-hover:rotate-2 transition-transform duration-500"
                        />
                      </div>

                      {/* Content */}
                      <div className="p-6">
                        <span className="text-primary text-xs font-semibold uppercase tracking-wider block mb-1">
                          {product.tagline}
                        </span>
                        <h3 className="font-display text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                          {product.name}
                        </h3>
                      </div>
                    </Link>

                    {/* Action buttons */}
                    <div className="p-6 pt-0 flex gap-2">
                      {product.isSoldOut ? (
                        <Button
                          disabled
                          className="flex-1 bg-muted text-muted-foreground text-xs font-bold rounded-xl py-2.5 flex items-center justify-center cursor-not-allowed border border-border/55"
                        >
                          Sold Out
                        </Button>
                      ) : (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                          <Button
                            disabled={addingSlug === product.slug}
                            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold rounded-xl py-2.5 shadow-md flex items-center justify-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                            {addingSlug === product.slug ? "Adding..." : "Add to Cart"}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="center"
                          className="w-56 mt-1 rounded-2xl border border-border/50 bg-background/95 backdrop-blur-md shadow-xl p-1.5"
                        >
                          <DropdownMenuItem
                            className="cursor-pointer py-2 px-3 rounded-xl hover:bg-primary/10 transition-colors focus:bg-primary/10"
                            onClick={async (e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setAddingSlug(product.slug);
                              await addToCart(product.slug, { qty: 1, variant: "single" });
                              setAddingSlug(null);
                            }}
                          >
                            <div className="flex justify-between w-full font-medium text-sm">
                              <span>Single Pack</span>
                              <span className="text-primary">₹{variantPrice("single", product.slug)}</span>
                            </div>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="cursor-pointer py-2 px-3 rounded-xl hover:bg-primary/10 transition-colors focus:bg-primary/10"
                            onClick={async (e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setAddingSlug(product.slug);
                              await addToCart(product.slug, { qty: 1, variant: "po3", packItems: [] });
                              setAddingSlug(null);
                            }}
                          >
                            <div className="flex justify-between w-full font-medium text-sm">
                              <span>Pack of 3</span>
                              <span className="text-primary">₹{variantPrice("po3", product.slug)}</span>
                            </div>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="cursor-pointer py-2 px-3 rounded-xl hover:bg-primary/10 transition-colors focus:bg-primary/10"
                            onClick={async (e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setAddingSlug(product.slug);
                              await addToCart(product.slug, { qty: 1, variant: "po5", packItems: [] });
                              setAddingSlug(null);
                            }}
                          >
                            <div className="flex justify-between w-full font-medium text-sm">
                              <span>Pack of 5</span>
                              <span className="text-primary">₹{variantPrice("po5", product.slug)}</span>
                            </div>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                    <Link to={`/product/${product.slug}`} state={{ from: "/products" }}>
                        <Button
                          variant="outline"
                          size="icon"
                          className="rounded-xl border-border/60 hover:bg-primary/10 hover:text-primary"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </motion.div>
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

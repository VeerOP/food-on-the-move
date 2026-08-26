import { useState } from "react";
import { motion } from "framer-motion";
import { Gift, ShoppingCart, Plus, Minus, ArrowLeft, Heart, Package, Sparkles } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { CATALOG, CatalogProduct } from "@/lib/catalog";

export default function HampersPage() {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  // Get only hampers from catalog
  const hampers = Object.values(CATALOG).filter((p) => p.isHamper);

  // Maintain local quantity state for each hamper, pre-filled to their MOQ
  const [quantities, setQuantities] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    hampers.forEach((h) => {
      initial[h.slug] = h.moq ?? 1;
    });
    return initial;
  });

  const handleIncrement = (slug: string) => {
    setQuantities((prev) => ({
      ...prev,
      [slug]: prev[slug] + 1,
    }));
  };

  const handleDecrement = (slug: string, moq: number) => {
    setQuantities((prev) => {
      const current = prev[slug];
      if (current <= moq) return prev; // Cannot go below MOQ
      return {
        ...prev,
        [slug]: current - 1,
      };
    });
  };

  const handleAdd = async (product: CatalogProduct) => {
    if (!user) {
      navigate("/auth");
      return;
    }
    const qty = quantities[product.slug];
    await addToCart(product.slug, { qty, variant: "single" });
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Ornaments */}
      <div className="absolute top-24 left-1/4 w-80 h-80 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-[120px] pointer-events-none" />

      <Navbar />

      <div className="pt-32 pb-24 section-container relative z-10">
        {/* Back Link */}
        <Link 
          to="/" 
          className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 mr-2 transform group-hover:-translate-x-1 transition-transform" />
          Back to products
        </Link>

        {/* Page Header */}
        <div className="max-w-3xl mb-16">
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge variant="default" className="mb-4 bg-primary text-primary-foreground font-semibold">
              <Sparkles className="w-3.5 h-3.5 mr-1" /> Festive & Event Gifting
            </Badge>
            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl mb-6">
              Curated <span className="text-gradient">Hampers</span>
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Beautifully styled, handpicked combinations of our signature roasted puffs. 
              Perfect for celebrations, corporate gifts, or stocking up your pantry. 
              Please note minimum order quantities (MOQ) for each hamper.
            </p>
          </motion.div>
        </div>

        {/* Promo Banner */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10 border border-primary/20 rounded-3xl p-6 md:p-8 mb-12 flex flex-col md:flex-row items-center justify-between gap-6"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/20 rounded-2xl text-primary">
              <Gift className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-display text-xl md:text-2xl text-foreground">Special Offer</h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                Orders above <span className="font-semibold text-foreground">₹1000</span> get <span className="text-primary font-semibold">FREE delivery</span> + a free <span className="text-primary font-semibold">FOMO Steel Water Bottle</span>!
              </p>
            </div>
          </div>
          <Button variant="outline" asChild className="rounded-2xl">
            <Link to="/cart">View Cart Details</Link>
          </Button>
        </motion.div>

        {/* Hampers Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {hampers.map((product, idx) => {
            const moq = product.moq ?? 1;
            const currentQty = quantities[product.slug] ?? moq;
            const itemPrice = product.price;
            const totalPrice = itemPrice * currentQty;

            return (
              <motion.div
                key={product.slug}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 * idx }}
                className="group bg-card border border-border/50 hover:border-primary/30 rounded-3xl p-6 flex flex-col justify-between shadow-xl transition-all duration-300 relative overflow-hidden hover:shadow-primary/5"
              >
                <div>
                  {/* Badge */}
                  <div className="absolute top-4 left-4 z-20">
                    <Badge variant="secondary" className="bg-secondary/90 text-secondary-foreground">
                      MOQ: {moq} units
                    </Badge>
                  </div>

                  {/* Image wrapper */}
                  <div className="relative h-64 mb-6 rounded-2xl bg-muted/30 overflow-hidden flex items-center justify-center">
                    {product.isSoldOut && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] z-20 flex items-center justify-center pointer-events-none">
                        <span className="border-4 border-destructive text-destructive font-display text-2xl font-black uppercase tracking-widest px-4 py-2 rounded-xl rotate-[-12deg] shadow-2xl select-none bg-black/45">
                          Sold Out
                        </span>
                      </div>
                    )}
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-full w-auto object-contain p-4 group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                  </div>

                  {/* Header details */}
                  <div className="mb-4">
                    <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                      {product.tagline}
                    </span>
                    <h3 className="font-display text-2xl mt-1 text-foreground">
                      {product.name}
                    </h3>
                  </div>

                  <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                    Each pack includes selected flavors packaged elegantly. Custom themes and branding are available upon request.
                  </p>
                </div>

                <div>
                  {/* Pricing / MOQ Selection Row */}
                  <div className="flex items-center justify-between border-t border-border/50 pt-4 mb-6">
                    <div>
                      <span className="text-xs text-muted-foreground block">Price per Hamper</span>
                      <span className="text-lg font-bold text-foreground">₹{itemPrice}</span>
                    </div>
                    
                    {/* Quantity selectors */}
                    {!product.isSoldOut && (
                      <div className="flex items-center gap-3">
                        <Button
                          size="icon"
                          variant="outline"
                          className="w-8 h-8 rounded-lg"
                          onClick={() => handleDecrement(product.slug, moq)}
                          disabled={currentQty <= moq}
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </Button>
                        <span className="w-8 text-center font-semibold text-foreground">{currentQty}</span>
                        <Button
                          size="icon"
                          variant="outline"
                          className="w-8 h-8 rounded-lg"
                          onClick={() => handleIncrement(product.slug)}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Call to action */}
                  <div className="flex flex-col gap-2">
                    {product.isSoldOut ? (
                      <Button
                        disabled
                        variant="outline"
                        className="w-full py-5 rounded-2xl font-semibold flex items-center justify-center bg-muted text-muted-foreground cursor-not-allowed border border-border/55"
                      >
                        Sold Out
                      </Button>
                    ) : (
                      <>
                        <div className="flex justify-between text-xs text-muted-foreground px-1 mb-1">
                          <span>Total Value:</span>
                          <span className="font-semibold text-foreground">₹{totalPrice}</span>
                        </div>
                        <Button
                          onClick={() => handleAdd(product)}
                          variant="hero"
                          className="w-full py-5 rounded-2xl font-semibold flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                        >
                          <ShoppingCart className="w-4 h-4" /> Add Hampers to Cart
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <Footer />
    </div>
  );
}

import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, ShoppingCart, Tag } from "lucide-react";
import { CatalogProduct } from "@/lib/catalog";
import { useInventory } from "@/lib/inventory";
import { useCart } from "@/hooks/use-cart";
import { CartCounter } from "@/components/CartCounter";
import { Button } from "@/components/ui/button";
import { useProductStats } from "@/lib/reviews";

interface ProductCardSnackibleProps {
  product: CatalogProduct;
  isBestseller?: boolean;
  badgeText?: string;
}

export function ProductCardSnackible({
  product,
  isBestseller = true,
  badgeText = "BESTSELLER",
}: ProductCardSnackibleProps) {
  const { addToCart, getItemQuantity } = useCart();
  const { isSoldOut } = useInventory();
  const [isAdding, setIsAdding] = useState(false);
  const stats = useProductStats(product.slug);

  const soldOut = isSoldOut(product.slug);
  const currentQtyInCart = getItemQuantity(product.slug, "single");

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (soldOut || isAdding) return;

    setIsAdding(true);
    try {
      await addToCart(product.slug, { qty: 1, variant: "single" });
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35 }}
      className="group relative bg-card border border-border/70 rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
    >
      {/* Clickable Card Link for details */}
      <Link to={`/product/${product.slug}`} className="block flex-1 flex flex-col">
        {/* Top Image Container */}
        <div className="relative aspect-square sm:aspect-[4/3] p-4 sm:p-5 bg-gradient-to-b from-primary/5 via-amber-500/5 to-transparent flex items-center justify-center overflow-hidden border-b border-border/40">
          {/* Top Left Bestseller Ribbon Badge */}
          {isBestseller && !soldOut && (
            <div className="absolute top-0 left-0 z-10 bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950 font-black text-[9px] sm:text-[11px] uppercase tracking-wider px-2 sm:px-2.5 py-1 rounded-br-xl shadow-md flex items-center gap-1">
              <Tag className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-amber-950" />
              <span>{badgeText}</span>
            </div>
          )}

          {/* Sold Out Overlay */}
          {soldOut && (
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] z-20 flex items-center justify-center pointer-events-none">
              <span className="border-2 border-destructive text-destructive font-display text-base sm:text-xl font-black uppercase tracking-widest px-3 py-1.5 rounded-lg rotate-[-10deg] shadow-xl bg-black/85">
                Sold Out
              </span>
            </div>
          )}

          {/* Product Image */}
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-contain drop-shadow-md group-hover:scale-108 transition-transform duration-500 ease-out"
          />
        </div>

        {/* Card Body */}
        <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between">
          <div>
            {/* Product Title */}
            <h3 className="font-display text-xs sm:text-sm font-extrabold text-foreground uppercase tracking-tight line-clamp-2 leading-snug group-hover:text-primary transition-colors text-left">
              {product.name}
            </h3>

            {/* Organic Rating Row */}
            <div className="flex items-center gap-1.5 mt-1.5 mb-2.5 min-h-[18px]">
              {stats.count > 0 ? (
                <>
                  <div className="flex items-center text-amber-400">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${
                          s <= Math.round(stats.average)
                            ? "fill-amber-400 text-amber-400"
                            : "fill-muted text-muted/50"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground ml-0.5">
                    ({stats.count})
                  </span>
                </>
              ) : (
                <span className="text-[10px] sm:text-xs font-medium text-muted-foreground/60 flex items-center gap-1">
                  <Star className="w-3 h-3 text-muted-foreground/40" /> No reviews yet
                </span>
              )}
            </div>
          </div>

          {/* Price Row */}
          <div className="mt-1 mb-3 flex items-baseline gap-2">
            <span className="text-base sm:text-lg font-extrabold text-foreground font-display">
              ₹ {product.price}
            </span>
          </div>
        </div>
      </Link>

      {/* Bottom Action: ADD TO CART or Yellow CartCounter Stepper */}
      <div className="p-3 sm:p-4 pt-0">
        {soldOut ? (
          <Button
            disabled
            className="w-full bg-muted text-muted-foreground text-xs font-bold rounded-xl py-2.5 sm:py-3 cursor-not-allowed border border-border/50 uppercase tracking-wider"
          >
            Sold Out
          </Button>
        ) : currentQtyInCart > 0 ? (
          <div className="w-full flex items-center justify-center">
            <CartCounter
              slug={product.slug}
              variant="single"
              size="md"
              className="w-full justify-between h-9 sm:h-10"
            />
          </div>
        ) : (
          <Button
            disabled={isAdding}
            onClick={handleAddToCart}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-xs sm:text-sm font-extrabold rounded-xl py-2.5 sm:py-3 shadow-md shadow-primary/20 hover:shadow-primary/30 flex items-center justify-center gap-1.5 uppercase tracking-wider transition-all duration-200 active:scale-98 cursor-pointer"
          >
            <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            {isAdding ? "Adding..." : "ADD TO CART"}
          </Button>
        )}
      </div>
    </motion.div>
  );
}

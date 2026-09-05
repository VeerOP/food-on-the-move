import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, X, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export type AddedItemInfo = {
  slug: string;
  name: string;
  image: string | null;
  price: number;
  qty: number;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  item: AddedItemInfo | null;
  cartCount: number;
  cartSubtotal: number;
  autoCloseMs?: number;
};

export function AddedToCartModal({
  isOpen,
  onClose,
  item,
  cartCount,
  cartSubtotal,
  autoCloseMs = 3500,
}: Props) {
  const navigate = useNavigate();

  // Auto-dismiss timer
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      onClose();
    }, autoCloseMs);
    return () => clearTimeout(timer);
  }, [isOpen, onClose, autoCloseMs, item]);

  return (
    <AnimatePresence>
      {isOpen && item && (
        <div className="fixed top-20 sm:top-24 right-3 sm:right-6 z-[9999] pointer-events-none max-w-[92vw] sm:max-w-sm w-full">
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95, x: 20 }}
            animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
            exit={{ opacity: 0, y: -15, scale: 0.95, x: 20 }}
            transition={{ type: "spring", damping: 22, stiffness: 320 }}
            className="pointer-events-auto relative overflow-hidden bg-background/95 backdrop-blur-xl border border-primary/30 rounded-2xl p-3.5 sm:p-4 shadow-2xl shadow-primary/20"
          >
            {/* Top row: Checkmark, Title, and Close */}
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <div className="flex items-center gap-1.5 text-primary text-xs font-bold uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                <span>Added to Cart</span>
              </div>
              <button
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors"
                aria-label="Close notification"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Middle: Product snapshot */}
            <div className="flex items-center gap-3">
              {item.image && (
                <div className="w-12 h-12 bg-card rounded-xl p-1 shrink-0 border border-border/60 flex items-center justify-center">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-semibold text-foreground truncate">
                  {item.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  Qty: <span className="text-foreground font-medium">{item.qty}</span> ·{" "}
                  <span className="text-primary font-bold">₹{item.price.toFixed(0)}</span>
                </p>
              </div>

              {/* View Cart Button */}
              <button
                onClick={() => {
                  onClose();
                  navigate("/cart");
                }}
                className="shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1 shadow-md shadow-primary/20 transition-transform active:scale-95"
              >
                Cart <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Subtle Cart Subtotal & free gift hint */}
            <div className="mt-2.5 pt-2 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Total: {cartCount} items</span>
              <span className="font-semibold text-foreground">₹{cartSubtotal.toFixed(0)}</span>
            </div>

            {/* Animated countdown progress bar */}
            <motion.div
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: autoCloseMs / 1000, ease: "linear" }}
              className="absolute bottom-0 left-0 h-0.5 bg-primary/80"
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Gift, CheckCircle2, Truck, ArrowRight, X, ShieldCheck, Flame } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useCart, FREE_BOTTLE_THRESHOLD } from "@/hooks/use-cart";
import fomoBottle from "@/assets/steel-bottle-new.webp";

export function FreeBottleOfferPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const { subtotal, count } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const isUnlocked = subtotal >= FREE_BOTTLE_THRESHOLD;
  const amountNeeded = Math.max(0, FREE_BOTTLE_THRESHOLD - subtotal);
  const progressPercent = Math.min(100, Math.round((subtotal / FREE_BOTTLE_THRESHOLD) * 100));

  useEffect(() => {
    setHasMounted(true);
    // Automatically show popup after 1.8s delay on home page if not dismissed this session
    const isDismissed = sessionStorage.getItem("fomo_free_bottle_popup_dismissed") === "true";
    if (!isDismissed && location.pathname === "/") {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1800);
      return () => clearTimeout(timer);
    }
  }, [location.pathname]);

  const handleClose = () => {
    setIsOpen(false);
    sessionStorage.setItem("fomo_free_bottle_popup_dismissed", "true");
  };

  const handleOpen = () => {
    setIsOpen(true);
  };

  const handleActionClick = (target: "shop" | "cart") => {
    handleClose();
    if (target === "cart") {
      navigate("/cart");
    } else {
      if (location.pathname === "/") {
        const el = document.getElementById("products");
        if (el) {
          el.scrollIntoView({ behavior: "smooth" });
          return;
        }
      }
      navigate("/products");
    }
  };

  if (!hasMounted) return null;

  return (
    <>
      {/* Floating Offer Pill Trigger (Always available to re-open on main page) */}
      <AnimatePresence>
        {!isOpen && location.pathname === "/" && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleOpen}
            className="fixed bottom-5 left-4 sm:left-6 z-40 bg-gradient-to-r from-amber-500 via-primary to-amber-600 text-white px-3.5 py-2.5 rounded-full shadow-2xl shadow-primary/30 border-2 border-white/30 flex items-center gap-2 cursor-pointer group backdrop-blur-md"
            aria-label="View Free Bottle Offer"
          >
            <div className="relative">
              <Gift className="w-4 h-4 sm:w-5 sm:h-5 text-white animate-bounce" />
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-200"></span>
              </span>
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider leading-none">
                {isUnlocked ? "🎉 Free Bottle Unlocked!" : "Free Bottle on ₹1,200+"}
              </span>
              <span className="text-[9px] sm:text-[10px] text-amber-100/90 leading-tight">
                {isUnlocked ? "In your cart now" : "Auto-applied offer · Tap here"}
              </span>
            </div>
            <Sparkles className="w-3.5 h-3.5 text-amber-200 group-hover:rotate-12 transition-transform" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Main Interactive Popup Modal */}
      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleClose}
                className="fixed inset-0 bg-black/75 backdrop-blur-md"
              />

              {/* Modal Container */}
              <motion.div
                initial={{ opacity: 0, scale: 0.88, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.88, y: 20 }}
                transition={{ type: "spring", damping: 24, stiffness: 320 }}
                role="dialog"
                aria-modal="true"
                aria-labelledby="offer-modal-title"
                className="relative w-full max-w-lg bg-card/95 border-2 border-primary/40 rounded-3xl p-5 sm:p-7 shadow-2xl shadow-primary/25 overflow-hidden z-10 my-auto backdrop-blur-xl"
              >
                {/* Ambient glow decoration */}
                <div className="absolute -top-20 -right-20 w-44 h-44 bg-primary/25 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-20 -left-20 w-44 h-44 bg-amber-500/25 rounded-full blur-3xl pointer-events-none" />

                {/* Close Button */}
                <button
                  onClick={handleClose}
                  className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 p-2 rounded-full bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer z-20 border border-border/50"
                  aria-label="Close offer popup"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Top Badge */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/15 to-primary/15 border border-primary/30 text-primary text-[11px] sm:text-xs font-bold uppercase tracking-wider mb-3">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                  <span>Exclusive Celebration Perk</span>
                </div>

                {/* Title & Description */}
                <h2
                  id="offer-modal-title"
                  className="font-display text-2xl sm:text-3xl text-foreground font-black leading-tight tracking-tight mb-2"
                >
                  Get a <span className="text-gradient">Food On The Move Bottle</span> FREE!
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground mb-4 leading-relaxed">
                  Purchase above <strong className="text-foreground font-semibold">₹1,200</strong> and get our premium double-walled stainless steel bottle worth ₹300 completely free!
                </p>

                {/* Visual Product Showcase Card */}
                <div className="relative bg-gradient-to-br from-primary/10 via-amber-500/5 to-background border border-primary/20 rounded-2xl p-3 sm:p-4 mb-4 flex items-center gap-3 sm:gap-4 overflow-hidden">
                  <div className="relative w-24 h-24 sm:w-28 sm:h-28 shrink-0 bg-background/90 rounded-xl p-2 border border-border/60 flex items-center justify-center shadow-md overflow-hidden group">
                    <img
                      src={fomoBottle}
                      alt="Food On The Move Stainless Steel Bottle"
                      className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className="absolute top-1 right-1 bg-gradient-to-r from-amber-500 to-primary text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow uppercase">
                      ₹300 FREE
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-display text-sm sm:text-base font-bold text-foreground">
                      Food On The Move Steel Bottle
                    </h3>
                    <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
                      750ml Food-Grade Stainless Steel · Double-Walled · BPA-Free & Leakproof
                    </p>
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className="line-through text-xs text-muted-foreground">₹300</span>
                      <span className="text-xs sm:text-sm font-black text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                        100% FREE
                      </span>
                    </div>
                  </div>
                </div>

                {/* Highlights List */}
                <div className="space-y-2 bg-background/60 border border-border/50 rounded-2xl p-3 sm:p-3.5 text-xs mb-4">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                    <span className="text-foreground">
                      <strong className="font-semibold">Auto-Added to Cart:</strong> The free bottle adds automatically once your cart reaches ₹1,200.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Truck className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                    <span className="text-foreground">
                      <strong className="font-semibold">Free Doorstep Delivery:</strong> ₹0 shipping charges on eligible orders.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Flame className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                    <span className="text-foreground">
                      <strong className="font-semibold">100% Non-Fried Millets:</strong> Healthy, guilt-free snacking for all ages.
                    </span>
                  </div>
                </div>

                {/* Real-time Cart Progress Bar */}
                <div className="p-3 sm:p-3.5 rounded-2xl bg-primary/5 border border-primary/20 mb-5">
                  <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                    <span className="text-muted-foreground">
                      {isUnlocked ? "🎉 Free Bottle Unlocked in Cart!" : `Current Cart: ₹${subtotal.toFixed(0)} / ₹${FREE_BOTTLE_THRESHOLD}`}
                    </span>
                    <span className="text-primary font-bold">
                      {isUnlocked ? "FREE GIFT APPLIED" : `Add ₹${amountNeeded.toFixed(0)} more`}
                    </span>
                  </div>
                  <div className="w-full bg-border/60 h-2.5 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-amber-500 to-primary rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </div>
                </div>

                {/* Action CTA Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    onClick={() => handleActionClick("shop")}
                    className="w-full py-3 px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold rounded-xl text-xs sm:text-sm shadow-lg shadow-primary/25 transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Shop Snacks Now</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  {count > 0 ? (
                    <button
                      onClick={() => handleActionClick("cart")}
                      className="w-full py-3 px-4 bg-muted hover:bg-muted/80 text-foreground font-display font-bold rounded-xl text-xs sm:text-sm border border-border transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>View Cart (₹{subtotal.toFixed(0)})</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        handleClose();
                        navigate("/hampers");
                      }}
                      className="w-full py-3 px-4 bg-muted hover:bg-muted/80 text-foreground font-display font-semibold rounded-xl text-xs sm:text-sm border border-border transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>Explore Hampers</span>
                    </button>
                  )}
                </div>

                <div className="mt-3 text-center">
                  <button
                    onClick={handleClose}
                    className="text-[11px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer underline-offset-4 hover:underline"
                  >
                    Continue browsing
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}

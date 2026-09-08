import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Gift, Truck, Flame, ArrowRight, X, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/hooks/use-cart";
import fomoBottle from "@/assets/steel-bottle-new.webp";

export function OfferPromo() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const navigate = useNavigate();
  const { subtotal, count } = useCart();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isModalOpen]);

  const threshold = 1000;
  const isUnlocked = subtotal >= threshold;
  const amountNeeded = Math.max(0, threshold - subtotal);
  const progressPercent = Math.min(100, Math.round((subtotal / threshold) * 100));

  const marqueeItems = [
    { icon: Gift, text: "FREE FOMO Steel Water Bottle (Worth ₹300) on all orders above ₹1,000!" },
    { icon: Sparkles, text: "Special Offer: FREE 750ml Food-Grade Steel Bottle + FREE Delivery on ₹1,000+" },
    { icon: Gift, text: "Limited Period Gift: Free Stainless Steel Bottle auto-adds in Cart at ₹1,000!" },
    { icon: Truck, text: "FREE Delivery across Mumbai & Navi Mumbai included on ₹1,000+" },
    { icon: Flame, text: "100% Roasted, Non-Fried Millet Snacks · Free Bottle on ₹1,000+" },
  ];

  const modalContent = (
    <AnimatePresence>
      {isModalOpen && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsModalOpen(false)}
            className="fixed inset-0 bg-black/75 backdrop-blur-md"
          />

          {/* Modal Dialog Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 320 }}
            className="relative w-full max-w-md bg-card/95 backdrop-blur-xl border border-primary/30 rounded-3xl p-4 sm:p-6 shadow-2xl shadow-primary/20 overflow-hidden z-10 my-auto flex flex-col max-h-[90vh]"
          >
            {/* Background ambient glow */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/20 rounded-full blur-[70px] pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-amber-500/15 rounded-full blur-[70px] pointer-events-none" />

            {/* Close button */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-3 right-3 p-2 rounded-full bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60 transition-colors z-30 cursor-pointer shadow-sm"
              aria-label="Close offer popup"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Scrollable content container */}
            <div className="overflow-y-auto flex-1 min-h-0 pr-1 -mr-1 space-y-3.5">
              {/* Tag / Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-primary/10 border border-primary/30 text-primary text-[11px] font-bold uppercase tracking-wider">
                <Sparkles className="w-3 h-3" />
                <span>Special Gift Offer</span>
              </div>

              {/* Bottle Showcase Header */}
              <div className="flex items-center gap-3.5">
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 min-w-[80px] min-h-[80px] sm:min-w-[96px] sm:min-h-[96px] max-w-[80px] max-h-[80px] sm:max-w-[96px] sm:max-h-[96px] bg-background/90 rounded-2xl p-1 flex items-center justify-center border border-primary/30 shrink-0 overflow-hidden shadow-inner">
                  <img
                    src={fomoBottle}
                    alt="FOMO Stainless Steel Bottle"
                    className="w-full h-full object-cover rounded-xl"
                  />
                  <span className="absolute top-1 right-1 bg-gradient-to-r from-amber-500 to-primary text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-md shadow uppercase tracking-wider z-10">
                    ₹300 FREE
                  </span>
                </div>

                <div className="flex-1 min-w-0 pr-6">
                  <h3 className="font-display text-lg sm:text-xl text-foreground font-bold leading-tight">
                    Free FOMO Steel Bottle
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-snug">
                    Get our premium 750ml Food-Grade Steel Bottle <span className="text-primary font-semibold">100% FREE</span> on orders of ₹1,000+!
                  </p>
                </div>
              </div>

              {/* Offer Benefits List */}
              <div className="space-y-2 bg-background/70 border border-border/60 rounded-2xl p-3 text-xs">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                  <span className="text-foreground">
                    <strong className="font-semibold">Auto-Applied in Cart:</strong> Free bottle automatically adds when cart hits ₹1,000.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <Truck className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                  <span className="text-foreground">
                    <strong className="font-semibold">FREE Delivery Included:</strong> ₹0 shipping fee across Mumbai & Navi Mumbai.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <Gift className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                  <span className="text-foreground">
                    <strong className="font-semibold">Food Grade Stainless Steel:</strong> Double-walled, BPA-free, leakproof strap.
                  </span>
                </div>
              </div>

              {/* Real-time Cart Progress Bar */}
              <div className="p-3 rounded-2xl bg-primary/5 border border-primary/20">
                <div className="flex items-center justify-between text-[11px] mb-1.5 font-medium">
                  <span className="text-muted-foreground">
                    {isUnlocked ? "🎉 Free Bottle Unlocked!" : `Cart: ₹${subtotal.toFixed(0)} / ₹${threshold}`}
                  </span>
                  <span className="text-primary font-bold">
                    {isUnlocked ? "FREE GIFT INCLUDED" : `Add ₹${amountNeeded.toFixed(0)} more`}
                  </span>
                </div>
                <div className="w-full bg-border/60 h-2 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-amber-500 to-primary rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>
              </div>
            </div>

            {/* CTAs */}
            <div className="grid grid-cols-2 gap-2.5 pt-3 mt-2 border-t border-border/50 shrink-0">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  navigate("/products");
                }}
                className="w-full py-2.5 px-3 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-semibold rounded-xl text-xs sm:text-sm shadow-md shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Shop Snacks</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              {count > 0 ? (
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    navigate("/cart");
                  }}
                  className="w-full py-2.5 px-3 bg-muted hover:bg-muted/80 text-foreground font-display font-semibold rounded-xl text-xs sm:text-sm border border-border transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Cart (₹{subtotal.toFixed(0)})</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    navigate("/hampers");
                  }}
                  className="w-full py-2.5 px-3 bg-muted hover:bg-muted/80 text-foreground font-display font-semibold rounded-xl text-xs sm:text-sm border border-border transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>View Hampers</span>
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      {/* Top Marquee Announcement Bar */}
      <div
        onClick={() => setIsModalOpen(true)}
        className="w-full bg-gradient-to-r from-amber-600 via-primary to-amber-600 text-white shadow-sm cursor-pointer relative overflow-hidden group select-none border-b border-primary/30 z-50"
        role="button"
        tabIndex={0}
        aria-label="View Free Bottle Offer details"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsModalOpen(true);
          }
        }}
      >
        <div className="flex items-center justify-between py-1.5 px-3 relative">
          {/* Infinite Marquee Track */}
          <div className="flex overflow-hidden w-full group-hover:[&>div]:[animation-play-state:paused]">
            <div className="flex shrink-0 items-center gap-6 sm:gap-10 animate-marquee text-[11px] sm:text-xs font-semibold tracking-wide whitespace-nowrap">
              {marqueeItems.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <span key={`m1-${idx}`} className="inline-flex items-center gap-1.5">
                    <Icon className="w-3.5 h-3.5 text-amber-200 shrink-0 animate-pulse" />
                    <span>{item.text}</span>
                    <span className="text-amber-200/60 font-bold ml-2 sm:ml-4">•</span>
                  </span>
                );
              })}
            </div>
            <div
              aria-hidden="true"
              className="flex shrink-0 items-center gap-6 sm:gap-10 animate-marquee text-[11px] sm:text-xs font-semibold tracking-wide whitespace-nowrap"
            >
              {marqueeItems.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <span key={`m2-${idx}`} className="inline-flex items-center gap-1.5">
                    <Icon className="w-3.5 h-3.5 text-amber-200 shrink-0 animate-pulse" />
                    <span>{item.text}</span>
                    <span className="text-amber-200/60 font-bold ml-2 sm:ml-4">•</span>
                  </span>
                );
              })}
            </div>
          </div>

          {/* Action pill on right */}
          <div className="hidden md:flex shrink-0 items-center gap-1 bg-white/20 hover:bg-white/30 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[11px] font-bold text-white transition-transform group-hover:scale-105 ml-3">
            <span>View Offer</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>
      </div>

      {/* Render Modal via Portal to avoid any parent CSS transform clipping */}
      {mounted && createPortal(modalContent, document.body)}
    </>
  );
}


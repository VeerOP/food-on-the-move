import { motion } from "framer-motion";
import { Sparkles, Tag, Gift, Truck, ArrowRight, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "@/hooks/use-cart";
import fomoBottle from "@/assets/steel-bottle-new.webp";

export function OffersSection() {
  const { subtotal } = useCart();
  const threshold = 1000;
  const isUnlocked = subtotal >= threshold;
  const amountNeeded = Math.max(0, threshold - subtotal);
  const progressPercent = Math.min(100, Math.round((subtotal / threshold) * 100));

  return (
    <section id="offers" className="py-20 relative overflow-hidden bg-gradient-to-b from-background via-primary/5 to-background">
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-primary/5 pointer-events-none" />
      <div className="section-container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <span className="text-primary font-semibold uppercase tracking-wider text-sm inline-flex items-center gap-2">
            <Tag className="w-4 h-4" /> Exclusive Offer
          </span>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl mt-3 mb-4 text-foreground font-bold">
            GET A FREE <span className="text-gradient">STEEL BOTTLE</span>
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
            Order your favourite roasted millet snacks and receive our premium 750ml Food-Grade Steel Bottle <strong className="text-primary">100% FREE</strong> + Zero Delivery Fee!
          </p>
        </motion.div>

        {/* Highlight Feature Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="max-w-4xl mx-auto relative bg-card/95 backdrop-blur-xl border-2 border-primary/40 rounded-3xl p-6 sm:p-10 shadow-2xl shadow-primary/20 overflow-hidden"
        >
          {/* Ambient background glow */}
          <div className="absolute -top-16 -right-16 w-56 h-56 bg-primary/20 rounded-full blur-[90px] pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-amber-500/20 rounded-full blur-[90px] pointer-events-none" />

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 items-center relative z-10">
            {/* Left: Product Image */}
            <div className="md:col-span-5 flex flex-col items-center justify-center">
              <div className="relative w-44 h-44 sm:w-56 sm:h-56 bg-gradient-to-br from-primary/20 via-amber-500/10 to-transparent rounded-3xl p-3 flex items-center justify-center border border-primary/40 shadow-xl overflow-hidden group">
                <img
                  src={fomoBottle}
                  alt="Free FOMO Stainless Steel Bottle"
                  className="w-full h-full object-cover rounded-2xl transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute top-2.5 right-2.5 bg-gradient-to-r from-amber-500 to-primary text-white text-xs font-black px-2.5 py-1 rounded-full shadow-lg uppercase tracking-wider">
                  ₹300 FREE
                </div>
              </div>
              <span className="text-xs text-muted-foreground mt-3 font-medium text-center">
                750ml Double-Walled Food Grade Stainless Steel
              </span>
            </div>

            {/* Right: Offer Details */}
            <div className="md:col-span-7 flex flex-col justify-center text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-bold uppercase tracking-wider mb-3 w-fit">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Orders Above ₹1,000</span>
              </div>

              <h3 className="font-display text-2xl sm:text-3xl text-foreground font-bold leading-tight mb-3">
                Free FOMO Steel Bottle + Free Delivery
              </h3>

              <div className="space-y-2.5 mb-6 text-xs sm:text-sm">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span className="text-foreground">
                    <strong className="font-semibold">Auto-Added to Cart:</strong> The free bottle adds automatically once your cart hits ₹1,000.
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Truck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span className="text-foreground">
                    <strong className="font-semibold">FREE Delivery Included:</strong> ₹0 shipping fee on all orders of ₹1,000+.
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Gift className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span className="text-foreground">
                    <strong className="font-semibold">Durable & BPA-Free:</strong> Keeps drinks fresh with travel strap.
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-6 p-4 rounded-2xl bg-background/80 border border-border/80">
                <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                  <span className="text-muted-foreground">
                    {isUnlocked ? "🎉 Free Bottle Unlocked in Cart!" : `Current Cart: ₹${subtotal.toFixed(0)} / ₹${threshold}`}
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

              {/* CTAs */}
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/products"
                  className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-semibold rounded-xl text-sm shadow-lg shadow-primary/25 transition-all active:scale-95 inline-flex items-center gap-2"
                >
                  <span>Shop Snacks Now</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/hampers"
                  className="px-6 py-3 bg-muted hover:bg-muted/80 text-foreground font-display font-semibold rounded-xl text-sm border border-border transition-all active:scale-95 inline-flex items-center gap-2"
                >
                  <span>Explore Gift Hampers</span>
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}


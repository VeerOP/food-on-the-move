import { motion } from "framer-motion";
import { Sparkles, Tag } from "lucide-react";

/**
 * Reusable Offers section.
 * Placeholder for future promotional banners, coupon codes,
 * percentage/flat discounts, and seasonal offers.
 */
export function OffersSection() {
  return (
    <section id="offers" className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
      <div className="section-container relative">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <span className="text-primary font-semibold uppercase tracking-wider text-sm inline-flex items-center gap-2">
            <Tag className="w-4 h-4" /> Offers
          </span>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl mt-3 mb-4 text-foreground">
            EXCITING OFFERS <span className="text-gradient">COMING SOON!</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Coupons, seasonal discounts and combo deals — stay tuned.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="max-w-3xl mx-auto relative bg-card border-2 border-dashed border-primary/40 rounded-3xl p-10 text-center"
        >
          <motion.div
            animate={{ rotate: [0, 8, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4"
          >
            <Sparkles className="w-8 h-8 text-primary" />
          </motion.div>
          <p className="font-display text-2xl mb-2">Something delicious is brewing</p>
          <p className="text-muted-foreground">
            Check back soon for launch offers, referral bonuses, and combo packs.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

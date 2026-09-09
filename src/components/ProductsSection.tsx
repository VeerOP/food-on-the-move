import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, Flame, Cookie, UtensilsCrossed } from "lucide-react";
import { CATALOG, CatalogProduct } from "@/lib/catalog";
import { ProductCardSnackible } from "@/components/ProductCardSnackible";

type TabId = "bestsellers" | "puffs" | "cookies_sticks" | "all";

const TABS: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "bestsellers", label: "Bestsellers", icon: Flame },
  { id: "puffs", label: "Roasted Puffs", icon: Sparkles },
  { id: "cookies_sticks", label: "Cookies & Sticks", icon: Cookie },
  { id: "all", label: "All Snacks", icon: UtensilsCrossed },
];

export function ProductsSection() {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });
  const [activeTab, setActiveTab] = useState<TabId>("bestsellers");

  // Filter products for homepage showcase
  const allList = Object.values(CATALOG).filter((p) => !p.isHamper && p.slug !== "fomo-steel-bottle");

  const getFilteredList = (): CatalogProduct[] => {
    switch (activeTab) {
      case "bestsellers":
        // Featured top puffs & cookies
        return [
          CATALOG["woh-corn-thi"],
          CATALOG["yeh-jowaari-hai-deewani"],
          CATALOG["quinoa-se-quinoa-tak"],
          CATALOG["hum-saath-saath-hai"],
          CATALOG["double-chocolate-cookies"],
          CATALOG["almond-sticks"],
          CATALOG["jowaar-jaggery-cookies"],
          CATALOG["chocochips-sticks"],
        ].filter(Boolean) as CatalogProduct[];
      case "puffs":
        return allList.filter((p) => p.category === "puffs");
      case "cookies_sticks":
        return allList.filter((p) => p.category === "cookies" || p.category === "sticks");
      case "all":
      default:
        return allList;
    }
  };

  const displayedProducts = getFilteredList();

  return (
    <section id="products" className="py-20 relative overflow-hidden bg-gradient-to-b from-background via-card/30 to-background">
      {/* Background Subtle Glows */}
      <div className="absolute top-1/3 left-0 w-96 h-96 bg-primary/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="section-container relative z-10" ref={sectionRef}>
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" /> Munch Better • Guilt Free
          </div>
          <h2 className="font-display text-4xl sm:text-5xl md:text-6xl text-foreground font-black tracking-tight">
            OUR <span className="text-gradient">BESTSELLERS</span>
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto mt-2.5">
            100% roasted, high in protein & fibre, made with pure millets and zero guilt.
          </p>
        </motion.div>

        {/* Snackible-Style Filter Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="flex items-center justify-center gap-2 flex-wrap mb-10"
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/25 scale-102"
                    : "bg-card border border-border/80 text-muted-foreground hover:text-foreground hover:border-foreground/30"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-primary-foreground" : "text-muted-foreground"}`} />
                {tab.label}
              </button>
            );
          })}
        </motion.div>

        {/* 2-Column Mobile / 4-Column Desktop Product Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
          {displayedProducts.map((product, idx) => (
            <ProductCardSnackible
              key={product.slug}
              product={product}
              isBestseller={idx < 4}
              badgeText={idx === 0 ? "🔥 #1 BESTSELLER" : "BESTSELLER"}
            />
          ))}
        </div>

        {/* Snackible Decorative Divider */}
        <div className="my-14 flex items-center justify-center gap-3">
          <span className="text-muted-foreground/30 font-mono tracking-tighter text-sm select-none">
            /////////
          </span>
          <span className="text-xs sm:text-sm font-extrabold uppercase tracking-widest text-foreground/80 font-display">
            CRAVING MORE FLAVOURS?
          </span>
          <span className="text-muted-foreground/30 font-mono tracking-tighter text-sm select-none">
            /////////
          </span>
        </div>

        {/* VIEW ALL Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <Link
            to="/products"
            className="inline-flex items-center justify-center bg-primary hover:bg-primary/90 text-primary-foreground text-sm sm:text-base font-extrabold px-10 py-4 rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-300 gap-2.5 active:scale-95 cursor-pointer uppercase tracking-wider"
          >
            <span>VIEW ALL PRODUCTS</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

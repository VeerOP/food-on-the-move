import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { variantPrice } from "@/lib/catalog";

import productCorn from "@/assets/product-corn-main.png";
import productJowar from "@/assets/product-jowar-main.png";
import productQuinoa from "@/assets/product-quinoa-main.png";
import productMultigrain from "@/assets/product-multigrain-main.png";

const products = [
  {
    id: 1,
    name: "Woh Corn Thi",
    slug: "woh-corn-thi",
    tagline: "Roasted Corn Puffs",
    description: "Crispy, golden, and bursting with Tomato and cheese flavour.",
    image: productCorn,
    color: "from-blue-500/20 to-indigo-500/20",
    clapperboardTag: "TAKE 1 • Crowd Favourite",
  },
  {
    id: 2,
    name: "Yeh Jowaari Hai Deewani",
    slug: "yeh-jowaari-hai-deewani",
    tagline: "Roasted Jowar Puffs",
    description: "Wholesome, gluten-free, and rich in fibre — for clean, sustained energy.",
    image: productJowar,
    color: "from-gray-500/20 to-zinc-500/20",
    clapperboardTag: "TAKE 2 • Gluten Free",
  },
  {
    id: 3,
    name: "Quinoa se Quinoa Tak",
    slug: "quinoa-se-quinoa-tak",
    tagline: "Roasted Quinoa Puffs",
    description: "Protein-packed, light, and crunchy — perfect for mindful snackers.",
    image: productQuinoa,
    color: "from-gray-600/20 to-stone-500/20",
    clapperboardTag: "TAKE 3 • High Protein",
  },
  {
    id: 4,
    name: "Hum Saath Saath Hai",
    slug: "hum-saath-saath-hai",
    tagline: "Roasted Multigrain Puffs",
    description: "A delicious medley of grains, bringing together health and taste.",
    image: productMultigrain,
    color: "from-orange-500/20 to-amber-500/20",
    clapperboardTag: "FINAL TAKE • Multigrain",
  },
];

// Clapperboard Tag Component
function ClapperboardTag({ text, delay = 0 }: { text: string; delay?: number }) {
  return (
    <motion.div 
      className="absolute -top-3 -left-3 z-10"
      initial={{ opacity: 0, x: -30, rotate: -20 }}
      animate={{ opacity: 1, x: 0, rotate: -6 }}
      transition={{ 
        duration: 0.5, 
        delay: delay + 0.3,
        type: "spring",
        stiffness: 200,
        damping: 15
      }}
      style={{ filter: 'drop-shadow(3px 4px 6px rgba(0,0,0,0.5))' }}
    >
      {/* Clapperboard structure */}
      <div className="relative min-w-[140px]">
        {/* Top striped clapper - animated snap */}
        <motion.div 
          className="h-5 w-full overflow-hidden origin-left border-2 border-white/20"
          initial={{ rotateZ: -35 }}
          animate={{ rotateZ: 0 }}
          transition={{ 
            duration: 0.12, 
            delay: delay + 0.6,
            ease: "easeOut"
          }}
          style={{
            background: 'repeating-linear-gradient(135deg, #000 0px, #000 8px, #fff 8px, #fff 16px)',
            borderTopLeftRadius: '4px',
            borderTopRightRadius: '4px',
          }}
        />
        {/* Bottom solid body */}
        <div 
          className="bg-black px-4 py-2.5 border-2 border-t-0 border-white/20"
          style={{
            borderBottomLeftRadius: '4px',
            borderBottomRightRadius: '4px',
          }}
        >
          {/* Scene/Take info row */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-white/60 text-[8px] font-mono uppercase">Scene</span>
            <span className="text-white text-[10px] font-bold font-mono">01</span>
            <span className="w-px h-3 bg-white/30" />
            <span className="text-white/60 text-[8px] font-mono uppercase">Roll</span>
            <span className="text-white text-[10px] font-bold font-mono">A</span>
          </div>
          {/* Main text */}
          <span className="text-white text-[11px] font-bold uppercase tracking-wider whitespace-nowrap block">
            {text}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function ProductCard({ product, index }: { product: typeof products[0]; index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const { addToCart } = useCart();


  return (
    <>
      <Link to={`/product/${product.slug}`} state={{ from: "/#products" }} className="block h-full">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 80 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: index * 0.15 }}
          className="group relative cursor-pointer h-full"
        >
          <div className={`absolute inset-0 bg-gradient-to-br ${product.color} rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
          
          <div className="relative bg-card border border-border/50 rounded-3xl p-6 overflow-hidden card-hover h-full flex flex-col justify-between">
            <div>
              {/* Clapperboard Tag */}
              {product.clapperboardTag && (
                <ClapperboardTag text={product.clapperboardTag} delay={index * 0.15} />
              )}

              {/* Product Image */}
              <div className="relative h-56 mb-6 flex items-center justify-center">
                <motion.img
                  src={product.image}
                  alt={product.name}
                  className="h-full w-auto object-contain drop-shadow-2xl"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                />
              </div>

              {/* Content */}
              <div className="text-center mb-4">
                <span className="text-primary text-sm font-semibold uppercase tracking-wider">
                  {product.tagline}
                </span>
                <h3 className="font-display text-2xl mt-2 mb-3 text-foreground">
                  {product.name}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {product.description}
                </p>
              </div>
            </div>

            {/* Add to Cart dropdown button */}
            <div className="mt-auto pt-4 relative z-20">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    variant="hero"
                    className="w-full py-4 text-xs font-semibold rounded-2xl shadow-lg transition-all duration-300 opacity-100 md:opacity-0 md:group-hover:opacity-100 transform translate-y-1 md:group-hover:translate-y-0 flex items-center justify-center gap-2"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" /> Add to Cart
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="center" 
                  className="w-56 mt-1 rounded-2xl border border-border/50 bg-background/95 backdrop-blur-md shadow-xl p-1.5"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  <DropdownMenuItem
                    className="cursor-pointer py-2 px-3 rounded-xl hover:bg-primary/10 transition-colors focus:bg-primary/10"
                    onClick={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      await addToCart(product.slug, { qty: 1, variant: "single" });
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
                      await addToCart(product.slug, { qty: 1, variant: "po3", packItems: [] });
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
                      await addToCart(product.slug, { qty: 1, variant: "po5", packItems: [] });
                    }}
                  >
                    <div className="flex justify-between w-full font-medium text-sm">
                      <span>Pack of 5</span>
                      <span className="text-primary">₹{variantPrice("po5", product.slug)}</span>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Hover Effect Background Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-3xl" />
          </div>
        </motion.div>
      </Link>


    </>
  );
}

export function ProductsSection() {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  return (
    <section id="products" className="py-24 relative overflow-hidden">
      {/* Background Accent */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-primary/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-[120px]" />

      <div className="section-container" ref={sectionRef}>
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-primary font-semibold uppercase tracking-wider text-sm">
            Our Products
          </span>
          <h2 className="font-display text-5xl md:text-6xl lg:text-7xl mt-4 mb-6 text-foreground">
            TASTE THE <span className="text-gradient">DIFFERENCE</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Bold flavours, light crunch, and pure satisfaction in every puff.
          </p>
        </motion.div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>

        {/* View All Products CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-14 text-center"
        >
          <Button 
            asChild
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground text-base font-bold px-8 py-6 rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all duration-300 gap-3 group"
          >
            <Link to="/products">
              View All Products
              <span className="bg-primary-foreground/20 rounded-full p-1 group-hover:translate-x-1 transition-transform">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </span>
            </Link>
          </Button>
        </motion.div>

        {/* Bollywood Tag */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-12 text-center"
        >
          <p className="font-cinematic text-2xl md:text-3xl text-muted-foreground uppercase tracking-wider">
            Snack Smart. <span className="text-gradient">Snack Bold.</span>
          </p>
        </motion.div>
      </div>
    </section>
  );
}

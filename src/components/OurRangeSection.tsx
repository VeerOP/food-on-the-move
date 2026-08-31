import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import allProducts from "@/assets/all-products-badges.webp";
import lifestyleGirl from "@/assets/lifestyle-girl-products.webp";
import lifestyleFriends from "@/assets/lifestyle-friends-gaming.webp";
import lifestyleTravel from "@/assets/lifestyle-travel.webp";
import lifestyleGamenight from "@/assets/lifestyle-gamenight.webp";

const slides = [
  { src: allProducts, alt: "Food On The Move - Complete product range" },
  { src: lifestyleGirl, alt: "Food On The Move - All flavours showcase" },
  { src: lifestyleFriends, alt: "Food On The Move - Snacking with friends" },
  { src: lifestyleTravel, alt: "Food On The Move - Travel snacking" },
  { src: lifestyleGamenight, alt: "Food On The Move - Game night snacks" },
];

export function OurRangeSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [current, setCurrent] = useState(0);

  // Auto-advance every 4s
  useEffect(() => {
    const timer = setInterval(() => setCurrent((c) => (c + 1) % slides.length), 4000);
    return () => clearInterval(timer);
  }, []);

  const go = (dir: number) => setCurrent((c) => (c + dir + slides.length) % slides.length);

  return (
    <section className="py-20 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary/8 rounded-full blur-[150px]" />

      <div className="section-container" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <span className="text-primary font-semibold uppercase tracking-wider text-sm">
            Our Range
          </span>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl mt-4 text-foreground">
            One Brand. <span className="text-gradient">Many Cravings.</span>
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative max-w-5xl mx-auto"
        >
          {/* Carousel container */}
          <div className="relative rounded-2xl overflow-hidden">
            <div
              className="flex transition-transform duration-700 ease-in-out"
              style={{ transform: `translateX(-${current * 100}%)` }}
            >
              {slides.map((slide, i) => (
                <img
                  key={i}
                  src={slide.src}
                  alt={slide.alt}
                  className="w-full flex-shrink-0 h-auto object-cover"
                  loading={i === 0 ? "eager" : "lazy"}
                  decoding="async"
                />
              ))}
            </div>

            {/* Nav arrows */}
            <button
              onClick={() => go(-1)}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 backdrop-blur flex items-center justify-center border border-border/50 hover:bg-background transition-colors"
              aria-label="Previous"
            >
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
            <button
              onClick={() => go(1)}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 backdrop-blur flex items-center justify-center border border-border/50 hover:bg-background transition-colors"
              aria-label="Next"
            >
              <ChevronRight className="w-5 h-5 text-foreground" />
            </button>
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-4">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  i === current ? "bg-primary w-6" : "bg-muted-foreground/30"
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Wheat, Sparkles, Heart, Plane, Users } from "lucide-react";

const features = [
  {
    icon: Wheat,
    title: "Nutritionally Smart",
    description: "Gluten-free, protein-rich, and fibre-filled for balanced living.",
  },
  {
    icon: Sparkles,
    title: "Flavor That Pops",
    description: "Bold, exciting, and true to Indian taste buds.",
  },
  {
    icon: Heart,
    title: "Mindful Indulgence",
    description: "Light on calories, big on satisfaction.",
  },
  {
    icon: Plane,
    title: "Made for Movement",
    description: "Perfect for travel, breaks, and daily munching.",
  },
  {
    icon: Users,
    title: "Everyone's Snack",
    description: "From kids to professionals — we've got you covered.",
  },
];

export function FeaturesSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="py-24 relative overflow-hidden bg-gradient-to-b from-background via-card/30 to-background">
      <div className="section-container" ref={ref}>
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-primary font-semibold uppercase tracking-wider text-sm">
            Why Choose Us
          </span>
          <h2 className="font-display text-5xl md:text-6xl mt-4 mb-6 text-foreground">
            WHAT MAKES US <span className="text-gradient">STAND OUT</span>
          </h2>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group relative"
            >
              <div className="bg-card/50 border border-border/30 rounded-2xl p-6 h-full hover:border-primary/50 transition-all duration-300 hover:-translate-y-2">
                {/* Icon */}
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors duration-300">
                  <feature.icon className="w-7 h-7 text-primary" />
                </div>

                {/* Content */}
                <h3 className="font-display text-xl mb-2 text-foreground">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.8 }}
          className="text-center mt-12 text-xl font-display text-muted-foreground"
        >
          Anytime. Anywhere.{" "}
          <span className="text-gradient">Food On The Move.</span>
        </motion.p>
      </div>
    </section>
  );
}

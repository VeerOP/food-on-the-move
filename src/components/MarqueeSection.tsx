import { motion } from "framer-motion";
import { Film } from "lucide-react";

const phrases = ["Gluten Free", "Roasted", "Non-Fried", "No Palm Oil", "Zero Trans Fat"];

export function MarqueeSection() {
  return (
    <section className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] mt-8 md:mt-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="w-full"
      >
        <div className="py-6 overflow-hidden bg-foreground/95 dark:bg-foreground/10 relative">
          {/* Film strip top perforations */}
          <div className="absolute top-0 left-0 right-0 h-3 sm:h-4 flex">
            {Array.from({ length: 80 }).map((_, i) => (
              <div
                key={`top-${i}`}
                className="flex-1 mx-0.5 sm:mx-1 bg-background/90 dark:bg-background/80 rounded-sm"
              />
            ))}
          </div>
          
          {/* Film strip bottom perforations */}
          <div className="absolute bottom-0 left-0 right-0 h-3 sm:h-4 flex">
            {Array.from({ length: 80 }).map((_, i) => (
              <div
                key={`bottom-${i}`}
                className="flex-1 mx-0.5 sm:mx-1 bg-background/90 dark:bg-background/80 rounded-sm"
              />
            ))}
          </div>

          {/* Main content area */}
          <div className="relative py-4">
            <div className="flex whitespace-nowrap animate-marquee">
              {[...Array(6)].map((_, setIndex) => (
                <div key={setIndex} className="flex items-center">
                  {phrases.map((phrase, index) => (
                    <div key={`${setIndex}-${index}`} className="flex items-center mx-6 md:mx-8">
                      <Film className="w-5 h-5 text-primary mr-3 flex-shrink-0" />
                      <span className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-background dark:text-foreground tracking-wide">
                        {phrase}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
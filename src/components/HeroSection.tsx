import { motion } from "framer-motion";
import { Sparkles, Film } from "lucide-react";
import heroBg from "@/assets/hero-all-products.webp";
import logo from "@/assets/logo-new.webp";

const phrases = ["Gluten Free", "Roasted", "Non-Fried", "No Palm Oil", "Zero Trans Fat"];

export function HeroSection() {
  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center justify-center overflow-hidden pb-20 md:pb-24"
    >
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <img
          src={heroBg}
          alt="Food On The Move - Delicious snacks"
          className="w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/70 via-transparent to-background/70" />
      </div>

      {/* Animated Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary/10 blur-[120px] animate-pulse" />

      {/* Content */}
      <div className="section-container relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex items-center justify-center gap-2 mb-6"
        >
          <Sparkles className="text-primary" size={20} />
          <span className="text-primary font-display font-semibold text-lg md:text-xl tracking-wider">
            Not just a snack — a <span className="text-gradient">Bollywood-inspired</span> experience!
          </span>
          <Sparkles className="text-primary" size={20} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mb-6 flex justify-center"
        >
          {/* IMAX Cinema Camera */}
          <div className="relative">
            {/* Camera Body */}
            <div className="relative bg-gradient-to-b from-zinc-800 via-zinc-900 to-zinc-950 rounded-2xl p-3 sm:p-4 md:p-5 shadow-2xl border border-zinc-700/50">
              
              {/* Top handle bar */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-24 sm:w-32 h-2 bg-gradient-to-b from-zinc-600 to-zinc-800 rounded-t-full" />
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-16 sm:w-20 h-2 bg-gradient-to-b from-zinc-500 to-zinc-700 rounded-full" />
              
              {/* Side grip texture - left */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-24 sm:h-32 bg-gradient-to-r from-zinc-700 to-zinc-800 rounded-l-md">
                <div className="h-full w-full" style={{
                  background: 'repeating-linear-gradient(180deg, transparent 0px, transparent 3px, rgba(0,0,0,0.3) 3px, rgba(0,0,0,0.3) 6px)'
                }} />
              </div>
              
              {/* Side grip texture - right */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 w-2 h-24 sm:h-32 bg-gradient-to-l from-zinc-700 to-zinc-800 rounded-r-md">
                <div className="h-full w-full" style={{
                  background: 'repeating-linear-gradient(180deg, transparent 0px, transparent 3px, rgba(0,0,0,0.3) 3px, rgba(0,0,0,0.3) 6px)'
                }} />
              </div>
              
              {/* Recording indicator */}
              <div className="absolute top-1 left-2 sm:top-2 sm:left-6 z-30 flex items-center gap-1 pointer-events-none">
                <div className="w-1.5 h-1.5 sm:w-2.5 sm:h-2.5 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50" />
                <span className="text-[7px] sm:text-[10px] text-red-400 font-mono">REC</span>
              </div>
              
              {/* Viewfinder Screen */}
              <div className="relative w-[280px] h-[180px] sm:w-[380px] sm:h-[230px] md:w-[480px] md:h-[280px] lg:w-[580px] lg:h-[340px] bg-black rounded-lg overflow-hidden border-2 border-zinc-800">
                
                {/* Screen glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-zinc-900/50 via-transparent to-zinc-900/50" />
                
                {/* Letterbox bars */}
                <div className="absolute top-0 left-0 right-0 h-4 sm:h-5 md:h-6 bg-black z-20" />
                <div className="absolute bottom-0 left-0 right-0 h-4 sm:h-5 md:h-6 bg-black z-20" />
                
                {/* Focus frame corners */}
                <div className="absolute top-6 sm:top-8 left-4 sm:left-6 w-6 sm:w-8 h-6 sm:h-8 border-l-2 border-t-2 border-primary/60 z-20" />
                <div className="absolute top-6 sm:top-8 right-4 sm:right-6 w-6 sm:w-8 h-6 sm:h-8 border-r-2 border-t-2 border-primary/60 z-20" />
                <div className="absolute bottom-6 sm:bottom-8 left-4 sm:left-6 w-6 sm:w-8 h-6 sm:h-8 border-l-2 border-b-2 border-primary/60 z-20" />
                <div className="absolute bottom-6 sm:bottom-8 right-4 sm:right-6 w-6 sm:w-8 h-6 sm:h-8 border-r-2 border-b-2 border-primary/60 z-20" />
                
                {/* Center crosshair */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 z-20 pointer-events-none">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-2 bg-primary/40" />
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-px h-2 bg-primary/40" />
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-px bg-primary/40" />
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-px bg-primary/40" />
                </div>
                
                {/* Timecode display */}
                <div className="absolute bottom-1 sm:bottom-2 left-2 sm:left-4 text-[8px] sm:text-[10px] font-mono text-primary/70 z-20">
                  00:00:01:12
                </div>
                
                {/* Camera info */}
                <div className="absolute bottom-1 sm:bottom-2 right-2 sm:right-4 text-[8px] sm:text-[10px] font-mono text-primary/70 z-20">
                  4K • 24fps
                </div>
                
                {/* Logo */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <img
                    src={logo}
                    alt="Food On The Move"
                    className="h-36 sm:h-44 md:h-56 lg:h-72 w-auto drop-shadow-2xl relative z-10"
                  />
                </div>
              </div>
              
              {/* Bottom details */}
              <div className="flex justify-between items-center mt-2 sm:mt-3 px-2">
                <div className="flex gap-1.5 sm:gap-2">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-zinc-700 border border-zinc-600" />
                  <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-zinc-700 border border-zinc-600" />
                </div>
                <div className="flex gap-1.5 sm:gap-2">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-zinc-700 border border-zinc-600" />
                  <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-zinc-700 border border-zinc-600" />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
        >
          Roasted to perfection, crafted for modern snackers. Bold flavours,
          light crunch, and Bollywood-inspired creativity in every bite.
        </motion.p>
      </div>

      {/* Marquee at bottom of hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        className="absolute bottom-0 left-0 right-0 w-screen z-10"
      >
        <div className="py-6 overflow-hidden bg-foreground/95 dark:bg-foreground/10 relative">
          {/* Film strip top perforations - fixed width squares */}
          <div className="absolute top-0 left-0 right-0 h-3 sm:h-4 flex gap-2 sm:gap-3 px-1">
            {Array.from({ length: 60 }).map((_, i) => (
              <div
                key={`top-${i}`}
                className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0 bg-background/90 dark:bg-background/80 rounded-[2px]"
              />
            ))}
          </div>
          
          {/* Film strip bottom perforations - fixed width squares */}
          <div className="absolute bottom-0 left-0 right-0 h-3 sm:h-4 flex gap-2 sm:gap-3 px-1">
            {Array.from({ length: 60 }).map((_, i) => (
              <div
                key={`bottom-${i}`}
                className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0 bg-background/90 dark:bg-background/80 rounded-[2px]"
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
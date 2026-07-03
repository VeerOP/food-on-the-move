import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function CurtainReveal() {
  const [showCurtain, setShowCurtain] = useState(false);

  useEffect(() => {
    // Check if curtain has already been shown this session
    const hasShown = sessionStorage.getItem("curtainRevealed");
    
    if (!hasShown) {
      setShowCurtain(true);
      sessionStorage.setItem("curtainRevealed", "true");
      
      // Auto-dismiss after animation completes
      const timer = setTimeout(() => {
        setShowCurtain(false);
      }, 1200);
      
      return () => clearTimeout(timer);
    }
  }, []);

  if (!showCurtain) return null;

  return (
    <AnimatePresence>
      {showCurtain && (
        <div className="fixed inset-0 z-[100] pointer-events-none overflow-hidden">
          {/* Left Curtain */}
          <motion.div
            initial={{ x: 0 }}
            animate={{ x: "-100%" }}
            transition={{ 
              duration: 1.2, 
              ease: [0.4, 0, 0.2, 1] // ease-in-out
            }}
            className="absolute top-0 left-0 w-1/2 h-full"
            style={{
              background: "linear-gradient(90deg, hsl(0 70% 20%) 0%, hsl(0 75% 25%) 70%, hsl(0 80% 30%) 100%)",
              boxShadow: "inset -20px 0 60px rgba(0,0,0,0.5), inset 0 0 100px rgba(0,0,0,0.3)",
            }}
          >
            {/* Curtain Folds */}
            <div className="absolute inset-0 opacity-30">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="absolute top-0 bottom-0 w-[12.5%]"
                  style={{
                    left: `${i * 12.5}%`,
                    background: i % 2 === 0 
                      ? "linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.2) 50%, transparent 100%)"
                      : "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.05) 50%, transparent 100%)",
                  }}
                />
              ))}
            </div>
            {/* Gold Trim */}
            <div 
              className="absolute top-0 right-0 w-1 h-full"
              style={{
                background: "linear-gradient(180deg, hsl(45 80% 50%) 0%, hsl(35 70% 40%) 50%, hsl(45 80% 50%) 100%)",
                boxShadow: "0 0 10px rgba(255,215,0,0.3)",
              }}
            />
          </motion.div>

          {/* Right Curtain */}
          <motion.div
            initial={{ x: 0 }}
            animate={{ x: "100%" }}
            transition={{ 
              duration: 1.2, 
              ease: [0.4, 0, 0.2, 1] // ease-in-out
            }}
            className="absolute top-0 right-0 w-1/2 h-full"
            style={{
              background: "linear-gradient(270deg, hsl(0 70% 20%) 0%, hsl(0 75% 25%) 70%, hsl(0 80% 30%) 100%)",
              boxShadow: "inset 20px 0 60px rgba(0,0,0,0.5), inset 0 0 100px rgba(0,0,0,0.3)",
            }}
          >
            {/* Curtain Folds */}
            <div className="absolute inset-0 opacity-30">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="absolute top-0 bottom-0 w-[12.5%]"
                  style={{
                    left: `${i * 12.5}%`,
                    background: i % 2 === 0 
                      ? "linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.2) 50%, transparent 100%)"
                      : "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.05) 50%, transparent 100%)",
                  }}
                />
              ))}
            </div>
            {/* Gold Trim */}
            <div 
              className="absolute top-0 left-0 w-1 h-full"
              style={{
                background: "linear-gradient(180deg, hsl(45 80% 50%) 0%, hsl(35 70% 40%) 50%, hsl(45 80% 50%) 100%)",
                boxShadow: "0 0 10px rgba(255,215,0,0.3)",
              }}
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

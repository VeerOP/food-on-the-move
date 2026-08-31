import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

export function CinematicLoader() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="fixed inset-0 z-[100] pointer-events-none"
        >
          {/* Film grain texture overlay */}
          <div 
            className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"
          />

          {/* Center projector light flare */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="absolute inset-0 flex items-center justify-center"
          >
            {/* Main light burst */}
            <div 
              className="w-[600px] h-[600px] rounded-full"
              style={{
                background: `radial-gradient(circle, 
                  rgba(255, 255, 255, 0.15) 0%, 
                  rgba(255, 255, 255, 0.08) 20%, 
                  rgba(255, 255, 255, 0.02) 50%, 
                  transparent 70%
                )`,
              }}
            />
          </motion.div>

          {/* Subtle horizontal light streak */}
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, delay: 0.1, ease: "easeOut" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[2px]"
            style={{
              background: `linear-gradient(90deg, 
                transparent 0%, 
                rgba(255, 255, 255, 0.1) 30%, 
                rgba(255, 255, 255, 0.2) 50%, 
                rgba(255, 255, 255, 0.1) 70%, 
                transparent 100%
              )`,
            }}
          />

          {/* Subtle vertical light streak */}
          <motion.div
            initial={{ opacity: 0, scaleY: 0 }}
            animate={{ opacity: 1, scaleY: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, delay: 0.15, ease: "easeOut" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[2px] h-[60vh]"
            style={{
              background: `linear-gradient(180deg, 
                transparent 0%, 
                rgba(255, 255, 255, 0.08) 30%, 
                rgba(255, 255, 255, 0.15) 50%, 
                rgba(255, 255, 255, 0.08) 70%, 
                transparent 100%
              )`,
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
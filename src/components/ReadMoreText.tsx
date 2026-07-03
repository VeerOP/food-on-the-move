import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";

interface ReadMoreTextProps {
  text: string;
  maxLength?: number;
  className?: string;
}

export function ReadMoreText({ text, maxLength = 150, className = "" }: ReadMoreTextProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const shouldTruncate = text.length > maxLength;
  const displayText = shouldTruncate && !isExpanded 
    ? text.slice(0, maxLength).trim() + "..." 
    : text;

  if (!shouldTruncate) {
    return <p className={className}>{text}</p>;
  }

  return (
    <div>
      <AnimatePresence mode="wait">
        <motion.p
          key={isExpanded ? "expanded" : "collapsed"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={className}
        >
          {displayText}
        </motion.p>
      </AnimatePresence>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="inline-flex items-center gap-1 mt-2 text-primary font-medium text-sm hover:text-primary/80 transition-colors"
      >
        {isExpanded ? (
          <>
            Read less <ChevronUp size={16} />
          </>
        ) : (
          <>
            Read more <ChevronDown size={16} />
          </>
        )}
      </button>
    </div>
  );
}

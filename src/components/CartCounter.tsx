import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Minus, Plus, Trash2, Loader2 } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { Variant, CATALOG } from "@/lib/catalog";
import { getAvailableStock } from "@/lib/inventory";
import { toast } from "sonner";

export interface CartCounterProps {
  slug?: string;
  variant?: Variant;
  value?: number;
  onIncrement?: () => void | Promise<void>;
  onDecrement?: () => void | Promise<void>;
  onDelete?: () => void | Promise<void>;
  disabled?: boolean;
  min?: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
  showDeleteAtMin?: boolean;
}

export function CartCounter({
  slug,
  variant = "single",
  value: controlledValue,
  onIncrement,
  onDecrement,
  onDelete,
  disabled = false,
  min = 1,
  max,
  size = "md",
  className = "",
  showDeleteAtMin = false,
}: CartCounterProps) {
  const { getItemQuantity, getItem, updateQty, removeItem, addToCart } = useCart();
  const [isUpdating, setIsUpdating] = useState(false);

  // Determine current quantity (from controlled prop or cart hook)
  const cartItem = slug ? getItem(slug, variant) : undefined;
  const currentQty = controlledValue !== undefined 
    ? controlledValue 
    : slug 
      ? getItemQuantity(slug, variant) 
      : 0;

  const product = slug ? CATALOG[slug] : undefined;
  const effectiveMin = product?.moq ? Math.max(min, product.moq) : min;
  const availableStock = slug ? getAvailableStock(slug) : (max ?? 99);
  const effectiveMax = max !== undefined ? max : availableStock;

  const handleMinus = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled || isUpdating) return;

    if (onDecrement) {
      setIsUpdating(true);
      try {
        await onDecrement();
      } finally {
        setIsUpdating(false);
      }
      return;
    }

    if (!slug) return;

    setIsUpdating(true);
    try {
      if (cartItem) {
        if (currentQty <= effectiveMin || currentQty <= 1) {
          await removeItem(cartItem.id);
        } else {
          await updateQty(cartItem.id, currentQty - 1);
        }
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePlus = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled || isUpdating) return;

    if (currentQty >= effectiveMax) {
      toast.error(`Maximum available stock (${effectiveMax}) reached.`);
      return;
    }

    if (onIncrement) {
      setIsUpdating(true);
      try {
        await onIncrement();
      } finally {
        setIsUpdating(false);
      }
      return;
    }

    if (!slug) return;

    setIsUpdating(true);
    try {
      if (cartItem) {
        await updateQty(cartItem.id, currentQty + 1);
      } else {
        await addToCart(slug, { qty: 1, variant });
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled || isUpdating) return;

    if (onDelete) {
      setIsUpdating(true);
      try {
        await onDelete();
      } finally {
        setIsUpdating(false);
      }
      return;
    }

    if (cartItem) {
      setIsUpdating(true);
      try {
        await removeItem(cartItem.id);
      } finally {
        setIsUpdating(false);
      }
    }
  };

  // Size styling maps
  const sizeStyles = {
    sm: {
      container: "h-8 px-1.5 gap-1 text-xs",
      btn: "w-6 h-6",
      icon: "w-3 h-3",
      qty: "min-w-[20px] text-xs font-bold",
    },
    md: {
      container: "h-9 sm:h-10 px-2 gap-2 text-sm",
      btn: "w-7 h-7 sm:w-8 sm:h-8",
      icon: "w-3.5 h-3.5 sm:w-4 sm:h-4",
      qty: "min-w-[26px] text-sm sm:text-base font-bold",
    },
    lg: {
      container: "h-11 sm:h-12 px-3 gap-3 text-base",
      btn: "w-8 h-8 sm:w-9 sm:h-9",
      icon: "w-4 h-4 sm:w-5 sm:h-5",
      qty: "min-w-[32px] text-base sm:text-lg font-bold",
    },
  };

  const currentSize = sizeStyles[size] || sizeStyles.md;
  const isAtMax = currentQty >= effectiveMax;
  const isAtMin = currentQty <= effectiveMin;

  return (
    <div
      className={`inline-flex items-center justify-between rounded-full border-2 border-amber-400 dark:border-amber-400 bg-background dark:bg-card shadow-sm hover:shadow-md transition-all select-none ${currentSize.container} ${className}`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      {/* Minus Button */}
      <motion.button
        type="button"
        whileTap={{ scale: 0.85 }}
        onClick={handleMinus}
        disabled={disabled || isUpdating}
        aria-label="Decrease quantity"
        className={`flex items-center justify-center rounded-full text-foreground/80 hover:text-foreground hover:bg-amber-400/20 active:bg-amber-400/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${currentSize.btn}`}
      >
        {isUpdating ? (
          <Loader2 className={`${currentSize.icon} animate-spin text-amber-500`} />
        ) : showDeleteAtMin && isAtMin ? (
          <Trash2 className={`${currentSize.icon} text-destructive hover:scale-110 transition-transform`} />
        ) : (
          <Minus className={`${currentSize.icon} stroke-[2.5]`} />
        )}
      </motion.button>

      {/* Quantity Display with Animated Transitions */}
      <div className={`flex items-center justify-center text-center text-foreground font-display tracking-tight ${currentSize.qty}`}>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={currentQty}
            initial={{ opacity: 0, y: -4, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.85 }}
            transition={{ duration: 0.15 }}
            className="block"
          >
            {currentQty}
          </motion.span>
        </AnimatePresence>
      </div>

      {/* Plus Button */}
      <motion.button
        type="button"
        whileTap={{ scale: 0.85 }}
        onClick={handlePlus}
        disabled={disabled || isUpdating || isAtMax}
        aria-label="Increase quantity"
        title={isAtMax ? "Maximum stock reached" : "Increase quantity"}
        className={`flex items-center justify-center rounded-full text-foreground/80 hover:text-foreground hover:bg-amber-400/20 active:bg-amber-400/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${currentSize.btn}`}
      >
        <Plus className={`${currentSize.icon} stroke-[2.5]`} />
      </motion.button>
    </div>
  );
}

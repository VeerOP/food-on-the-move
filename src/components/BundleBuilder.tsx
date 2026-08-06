import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { CATALOG, VARIANT_META, Variant } from "@/lib/catalog";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variant: Extract<Variant, "po3" | "po5">;
  onConfirm: (slugs: string[]) => void;
  submitting?: boolean;
};

export function BundleBuilder({ open, onOpenChange, variant, onConfirm, submitting }: Props) {
  const required = VARIANT_META[variant].count;
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (slug: string) => {
    setSelected((prev) => {
      // count of this slug currently
      const idx = prev.indexOf(slug);
      if (idx !== -1) return prev.filter((_, i) => i !== idx);
      if (prev.length >= required) return prev;
      return [...prev, slug];
    });
  };

  const addOne = (slug: string) => {
    setSelected((prev) => (prev.length >= required ? prev : [...prev, slug]));
  };

  const remaining = required - selected.length;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) setSelected([]); onOpenChange(o); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            Build your {VARIANT_META[variant].label}
          </DialogTitle>
          <DialogDescription>
            Pick exactly {required} snacks. You can repeat any snack.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-2">
          {Object.values(CATALOG).map((p) => {
            const count = selected.filter((s) => s === p.slug).length;
            const disabled = selected.length >= required && count === 0;
            return (
              <motion.button
                key={p.slug}
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => addOne(p.slug)}
                disabled={disabled}
                className={cn(
                  "relative bg-card border rounded-2xl p-3 text-left transition-all",
                  count > 0 ? "border-primary shadow-lg shadow-primary/20" : "border-border/50",
                  disabled && "opacity-50 cursor-not-allowed"
                )}
              >
                {count > 0 && (
                  <span className="absolute top-2 right-2 z-10 bg-primary text-primary-foreground text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                    ×{count}
                  </span>
                )}
                <div className="h-24 flex items-center justify-center mb-2">
                  <img src={p.image} alt={p.name} className="max-h-full object-contain" />
                </div>
                <p className="text-xs font-semibold leading-tight">{p.name}</p>
                <p className="text-[10px] text-muted-foreground">{p.tagline}</p>
              </motion.button>
            );
          })}
        </div>

        <div className="rounded-xl bg-muted/40 p-3 text-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold">Your pack</span>
            <span className={cn("text-xs", remaining === 0 ? "text-primary" : "text-muted-foreground")}>
              {remaining === 0 ? (
                <span className="inline-flex items-center gap-1"><Check className="w-3 h-3" /> Ready</span>
              ) : `Pick ${remaining} more`}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {selected.length === 0 ? (
              <span className="text-xs text-muted-foreground">Nothing selected yet</span>
            ) : (
              selected.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setSelected((prev) => prev.filter((_, j) => j !== i))}
                  className="text-xs bg-background border border-border/60 rounded-full px-3 py-1 hover:border-destructive hover:text-destructive transition-colors"
                >
                  {CATALOG[s]?.name} ✕
                </button>
              ))
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setSelected([])}>Reset</Button>
          <Button
            variant="hero"
            disabled={remaining !== 0 || submitting}
            onClick={() => onConfirm(selected)}
          >
            {submitting ? "Adding…" : `Add ${VARIANT_META[variant].label} — ₹${VARIANT_META[variant].price}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

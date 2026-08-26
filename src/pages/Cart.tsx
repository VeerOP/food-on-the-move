import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { computeDeliveryFee, FREE_DELIVERY_THRESHOLD_INR } from "@/lib/delivery";
import { CATALOG, variantLabel } from "@/lib/catalog";

export default function CartPage() {
  const { items, subtotal, count, updateQty, removeItem, loading, couponCode, discount, applyCoupon, removeCoupon } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [couponInput, setCouponInput] = useState("");

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-32 pb-16 section-container text-center">
          <h1 className="font-display text-4xl mb-4">Sign in to view your cart</h1>
          <Button variant="hero" onClick={() => navigate("/auth")}>Sign In</Button>
        </div>
      </div>
    );
  }

  const deliveryFee = computeDeliveryFee(subtotal);
  const total = subtotal - discount + deliveryFee;
  const amountToFree = Math.max(0, FREE_DELIVERY_THRESHOLD_INR - subtotal);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-32 pb-16 section-container">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display text-5xl md:text-6xl mb-8"
        >
          Your <span className="text-gradient">Cart</span>
        </motion.h1>

        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : items.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-6">Your cart is empty.</p>
            <Button variant="hero" asChild>
              <Link to="/#products">Browse Products</Link>
            </Button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card border border-border/50 rounded-2xl p-4 flex items-start gap-4"
                >
                  {item.product_image && (
                    <img src={item.product_image} alt={item.product_name} className="w-20 h-20 object-contain flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-display text-xl">{item.product_name}</h3>
                      <Badge variant="secondary" className="text-xs">{variantLabel(item.variant)}</Badge>
                    </div>
                    <p className="text-muted-foreground text-sm">₹{item.price_inr.toFixed(2)} each</p>
                    {item.pack_items && item.pack_items.length > 0 && (
                      <div className="mt-2 flex items-start gap-2 text-xs text-muted-foreground">
                        <Package className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        <span>
                          {item.pack_items.map((s) => CATALOG[s]?.name ?? s).join(" · ")}
                        </span>
                      </div>
                    )}
                    {item.product_slug === "fomo-steel-bottle" ? (
                      <div className="flex items-center gap-2 mt-3">
                        <Badge variant="default" className="text-xs bg-primary text-primary-foreground font-medium px-2 py-0.5">Free Gift Included!</Badge>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mt-3">
                        <Button 
                          size="icon" 
                          variant="outline" 
                          onClick={() => updateQty(item.id, item.quantity - 1)}
                          disabled={!!CATALOG[item.product_slug]?.moq && item.quantity <= (CATALOG[item.product_slug]?.moq ?? 0)}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <Button size="icon" variant="outline" onClick={() => updateQty(item.id, item.quantity + 1)}>
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="text-right flex flex-col items-end justify-between h-full gap-2">
                    <p className="font-semibold whitespace-nowrap">
                      {item.product_slug === "fomo-steel-bottle" ? "FREE" : `₹${(item.price_inr * item.quantity).toFixed(2)}`}
                    </p>
                    <Button size="icon" variant="ghost" onClick={() => removeItem(item.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="bg-card border border-border/50 rounded-2xl p-6 h-fit sticky top-28">
              <h2 className="font-display text-2xl mb-4">Order Summary</h2>
              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-muted-foreground">
                  <span>Items ({count})</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-primary font-medium">
                    <span>Discount (20%)</span>
                    <span>-₹{discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-muted-foreground">
                  <span>Delivery</span>
                  <span>{deliveryFee === 0 ? "FREE" : `₹${deliveryFee.toFixed(2)}`}</span>
                </div>
                {subtotal < 2000 && (
                  <p className="text-xs text-primary/80 leading-normal">
                    {subtotal < 1000
                      ? `Add ₹${(1000 - subtotal).toFixed(2)} more for FREE delivery in Mumbai (or ₹${(2000 - subtotal).toFixed(2)} for PAN India)`
                      : `You have FREE delivery in Mumbai! Add ₹${(2000 - subtotal).toFixed(2)} more for FREE PAN India delivery.`}
                  </p>
                )}
              </div>

              {/* Coupon Code Section */}
              <div className="border-t border-border/50 pt-4 pb-4">
                {couponCode ? (
                  <div className="flex items-center justify-between bg-primary/10 border border-primary/20 rounded-xl p-3 text-sm">
                    <div className="flex flex-col">
                      <span className="font-semibold text-primary">{couponCode} applied</span>
                      <span className="text-xs text-muted-foreground">20% discount on total puffs</span>
                    </div>
                    <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10 h-8 px-2.5 rounded-lg" onClick={removeCoupon}>
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Coupon Code"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      className="rounded-xl"
                    />
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        const ok = applyCoupon(couponInput);
                        if (ok) setCouponInput("");
                      }}
                      className="rounded-xl px-4"
                    >
                      Apply
                    </Button>
                  </div>
                )}
              </div>

              <div className="border-t border-border/50 pt-4 mb-6 flex justify-between font-display text-xl">
                <span>Total</span>
                <span className="text-gradient">₹{total.toFixed(2)}</span>
              </div>
              <Button variant="hero" size="lg" className="w-full" onClick={() => navigate("/checkout")}>
                Checkout <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Package, MapPin, Plus, Bookmark, ArrowRight, ShieldCheck, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Navbar } from "@/components/Navbar";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import {
  STORE,
  computeDeliveryFee,
  isMumbaiAddress,
} from "@/lib/delivery";
import { CATALOG, variantLabel } from "@/lib/catalog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

const phoneSchema = z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number");
const nameSchema = z.string().trim().min(2, "Name must be at least 2 characters").max(80);
const addrSchema = z.string().trim().min(5, "Please enter your complete address (flat/building/street)").max(300);
const pinSchema = z.string().trim().regex(/^[1-9]\d{5}$/, "Enter a valid 6-digit Indian postal pincode");
const landmarkSchema = z.string().trim().max(120).optional().or(z.literal(""));

export type SavedAddress = {
  id: string;
  name: string;
  phone: string;
  address: string;
  landmark: string;
  pincode: string;
};

export default function CheckoutPage() {
  const { items, subtotal, discount, couponCode } = useCart();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [landmark, setLandmark] = useState("");
  const [pincode, setPincode] = useState("");
  const [saveAddressForFuture, setSaveAddressForFuture] = useState(true);

  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedSavedId, setSelectedSavedId] = useState<string | null>(null);
  const [isEnteringNew, setIsEnteringNew] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const paymentMethod = "razorpay";

  // Redirect if cart is truly empty (after auth resolves)
  useEffect(() => {
    if (!authLoading && items.length === 0) {
      navigate("/cart");
    }
  }, [authLoading, items, navigate]);

  // Load saved addresses from localStorage and previous Supabase orders
  const loadAddresses = useCallback(async () => {
    if (!user) return;
    const storageKey = `fomo_saved_addresses_${user.id}`;
    let loaded: SavedAddress[] = [];

    // 1. Read from localStorage
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        loaded = JSON.parse(raw);
      }
    } catch (e) {
      console.warn("Failed to parse saved addresses from localStorage:", e);
    }

    // 2. Query previous orders from Supabase to backfill any past order addresses
    try {
      const { data: pastOrders } = await supabase
        .from("orders")
        .select("customer_name, customer_phone, delivery_address, landmark, pincode")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (pastOrders && pastOrders.length > 0) {
        for (const ord of pastOrders) {
          if (!ord.delivery_address || !ord.pincode) continue;
          const exists = loaded.some(
            (a) =>
              a.address.toLowerCase().trim() === ord.delivery_address.toLowerCase().trim() &&
              a.pincode.trim() === ord.pincode.trim()
          );
          if (!exists) {
            loaded.push({
              id: `past-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              name: ord.customer_name || "",
              phone: ord.customer_phone || "",
              address: ord.delivery_address,
              landmark: ord.landmark || "",
              pincode: ord.pincode,
            });
          }
        }
      }
    } catch (e) {
      console.warn("Failed to load past orders for address recovery:", e);
    }

    setSavedAddresses(loaded);

    // If addresses exist and user hasn't filled anything, auto-select the latest one
    if (loaded.length > 0 && !name && !address) {
      const first = loaded[0];
      setSelectedSavedId(first.id);
      setName(first.name);
      setPhone(first.phone);
      setAddress(first.address);
      setLandmark(first.landmark || "");
      setPincode(first.pincode);
    } else if (loaded.length === 0) {
      setIsEnteringNew(true);
    }
  }, [user, name, address]);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  const selectAddress = (addr: SavedAddress) => {
    setSelectedSavedId(addr.id);
    setName(addr.name);
    setPhone(addr.phone);
    setAddress(addr.address);
    setLandmark(addr.landmark || "");
    setPincode(addr.pincode);
    setIsEnteringNew(false);
    toast.success("Delivery address selected");
  };

  const startNewAddress = () => {
    setSelectedSavedId(null);
    setIsEnteringNew(true);
    setName("");
    setPhone("");
    setAddress("");
    setLandmark("");
    setPincode("");
  };

  // Pincode validation & delivery fee calculation
  const cleanPin = pincode.trim();
  const isPinValid = /^[1-9]\d{5}$/.test(cleanPin);
  const isMumbai = isMumbaiAddress(cleanPin, address);
  const deliveryThreshold = isMumbai ? 1000 : 2000;
  const deliveryFee = computeDeliveryFee(subtotal, cleanPin, address);
  const total = subtotal - discount + deliveryFee;
  const amountToFree = Math.max(0, deliveryThreshold - subtotal);

  const handleProceed = async () => {
    if (!user) {
      toast.error("Please sign in or create an account to place your order");
      navigate("/auth", { state: { from: "/checkout" } });
      return;
    }

    try {
      nameSchema.parse(name);
      phoneSchema.parse(phone);
      addrSchema.parse(address);
      pinSchema.parse(pincode);
      landmarkSchema.parse(landmark);
    } catch (e) {
      if (e instanceof z.ZodError) toast.error(e.issues[0].message);
      return;
    }

    if (!isPinValid) {
      toast.error("Please enter a valid 6-digit Indian pincode");
      return;
    }

    setSubmitting(true);

    // Save address if user checked the box
    if (saveAddressForFuture && user) {
      try {
        const storageKey = `fomo_saved_addresses_${user.id}`;
        const newEntry: SavedAddress = {
          id: `addr-${Date.now()}`,
          name: name.trim(),
          phone: phone.trim(),
          address: address.trim(),
          landmark: landmark.trim(),
          pincode: cleanPin,
        };
        const updated = [
          newEntry,
          ...savedAddresses.filter(
            (a) =>
              !(
                a.address.toLowerCase().trim() === newEntry.address.toLowerCase().trim() &&
                a.pincode.trim() === newEntry.pincode
              )
          ),
        ].slice(0, 8);
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch (err) {
        console.warn("Failed to persist saved address:", err);
      }
    }

    // Coordinates default to Matunga Store fallback coordinates to satisfy schema NOT NULL constraints
    const lat = STORE.lat;
    const lng = STORE.lng;

    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        status: "pending_payment",
        subtotal_inr: subtotal - discount,
        delivery_fee_inr: deliveryFee,
        total_inr: total,
        delivery_address: address.trim(),
        landmark: landmark.trim() || null,
        pincode: cleanPin,
        delivery_lat: lat,
        delivery_lng: lng,
        delivery_distance_km: 0,
        customer_name: name.trim(),
        customer_phone: phone.trim(),
        payment_method: paymentMethod,
      })
      .select("id")
      .single();

    if (error || !order) {
      setSubmitting(false);
      toast.error(error?.message ?? "Failed to create order");
      return;
    }

    const orderItems = items.map((i) => ({
      order_id: order.id,
      user_id: user.id,
      product_slug: i.product_slug,
      product_name: i.product_name,
      product_image: i.product_image,
      price_inr: i.price_inr,
      quantity: i.quantity,
      line_total_inr: i.price_inr * i.quantity,
      variant: i.variant,
      pack_items: i.pack_items,
    }));

    const { error: itemsErr } = await supabase.from("order_items").insert(orderItems);
    if (itemsErr) {
      setSubmitting(false);
      toast.error(itemsErr.message);
      return;
    }

    // NOTE: Cart is NOT cleared here! It is only cleared upon confirmed payment in Pay.tsx.
    setSubmitting(false);
    navigate(`/pay/${order.id}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-32 pb-16 section-container">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display text-5xl md:text-6xl mb-2"
        >
          Check<span className="text-gradient">out</span>
        </motion.h1>
        <p className="text-muted-foreground mb-8">
          Fast & fresh delivery across Mumbai & PAN India.
        </p>

        {/* Guest Sign-in Prompt if not logged in */}
        {!user && !authLoading && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-6 rounded-2xl bg-primary/10 border border-primary/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display text-lg text-foreground">Sign In to Complete Checkout</h3>
                <p className="text-sm text-muted-foreground">
                  Your cart items are saved. Please sign in or create an account to enter your address and pay securely.
                </p>
              </div>
            </div>
            <Button
              variant="hero"
              onClick={() => navigate("/auth", { state: { from: "/checkout" } })}
              className="whitespace-nowrap flex-shrink-0"
            >
              Sign In / Sign Up <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            
            {/* Saved Addresses Section */}
            {user && savedAddresses.length > 0 && (
              <div className="bg-card border border-border/50 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Bookmark className="w-5 h-5 text-primary" />
                    <h2 className="font-display text-2xl">Saved Addresses</h2>
                  </div>
                  <Button
                    size="sm"
                    variant={isEnteringNew ? "secondary" : "outline"}
                    onClick={isEnteringNew ? () => savedAddresses[0] && selectAddress(savedAddresses[0]) : startNewAddress}
                    className="text-xs"
                  >
                    {isEnteringNew ? "Choose Saved" : "+ Add New Address"}
                  </Button>
                </div>

                {!isEnteringNew && (
                  <div className="grid sm:grid-cols-2 gap-3 mb-2">
                    {savedAddresses.map((addr) => {
                      const isSelected = selectedSavedId === addr.id;
                      return (
                        <div
                          key={addr.id}
                          onClick={() => selectAddress(addr)}
                          className={`p-4 rounded-xl border cursor-pointer transition-all ${
                            isSelected
                              ? "border-primary bg-primary/5 ring-1 ring-primary shadow-sm"
                              : "border-border/60 hover:border-border hover:bg-muted/40"
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <span className="font-semibold text-foreground text-sm">{addr.name}</span>
                            {isSelected && (
                              <Badge variant="default" className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0">
                                Selected
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{addr.address}</p>
                          {addr.landmark && (
                            <p className="text-[11px] text-muted-foreground/80 mt-0.5">Near {addr.landmark}</p>
                          )}
                          <div className="mt-2 flex items-center justify-between text-xs font-medium text-foreground">
                            <span>PIN: {addr.pincode}</span>
                            <span className="text-muted-foreground">{addr.phone}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Contact Details */}
            <div className="bg-card border border-border/50 rounded-2xl p-6">
              <h2 className="font-display text-2xl mb-4">Contact Information</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name" className="flex items-center gap-1">
                    Full Name <span className="text-destructive font-bold">*</span>
                  </Label>
                  <Input
                    id="name"
                    required
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (selectedSavedId) setSelectedSavedId(null);
                    }}
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <Label htmlFor="phone" className="flex items-center gap-1">
                    Mobile Number (10 digits) <span className="text-destructive font-bold">*</span>
                  </Label>
                  <Input
                    id="phone"
                    required
                    inputMode="numeric"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value.replace(/\D/g, ""));
                      if (selectedSavedId) setSelectedSavedId(null);
                    }}
                    placeholder="10-digit mobile number"
                  />
                </div>
              </div>
            </div>

            {/* Delivery Address Details */}
            <div className="bg-card border border-border/50 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-2xl">Delivery Address</h2>
                {isEnteringNew && savedAddresses.length > 0 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs text-primary"
                    onClick={() => savedAddresses[0] && selectAddress(savedAddresses[0])}
                  >
                    Select Saved Address Instead
                  </Button>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="address" className="flex items-center gap-1">
                    Complete Address <span className="text-destructive font-bold">*</span>
                  </Label>
                  <Input
                    id="address"
                    required
                    placeholder="Flat / House No, Building name, Street, Area"
                    value={address}
                    onChange={(e) => {
                      setAddress(e.target.value);
                      if (selectedSavedId) setSelectedSavedId(null);
                    }}
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="landmark" className="flex items-center gap-1">
                      Landmark <span className="text-muted-foreground text-xs font-normal">(optional)</span>
                    </Label>
                    <Input
                      id="landmark"
                      placeholder="Nearby landmark (e.g. Opposite Metro Station)"
                      value={landmark}
                      onChange={(e) => {
                        setLandmark(e.target.value);
                        if (selectedSavedId) setSelectedSavedId(null);
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="pincode" className="flex items-center gap-1">
                      Pincode <span className="text-destructive font-bold">*</span>
                    </Label>
                    <Input
                      id="pincode"
                      required
                      inputMode="numeric"
                      maxLength={6}
                      value={pincode}
                      onChange={(e) => {
                        setPincode(e.target.value.replace(/\D/g, "").slice(0, 6));
                        if (selectedSavedId) setSelectedSavedId(null);
                      }}
                      placeholder="6-digit postal pincode"
                    />
                  </div>
                </div>

                {/* Instant Pincode Verification Badge (Replaces old manual geocode button) */}
                <AnimatePresence>
                  {cleanPin.length === 6 && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className={`p-4 rounded-xl flex items-start gap-3 border ${
                        isPinValid
                          ? "bg-primary/10 border-primary/30 text-foreground"
                          : "bg-destructive/10 border-destructive/30 text-destructive"
                      }`}
                    >
                      {isPinValid ? (
                        <>
                          <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                          <div className="text-sm">
                            <p className="font-semibold">
                              ✓ Pincode {cleanPin} Verified — {isMumbai ? "Mumbai & Navi Mumbai Delivery" : "PAN India Delivery"}
                            </p>
                            <p className="text-muted-foreground text-xs mt-0.5">
                              {isMumbai
                                ? "₹100 delivery fee · FREE on orders ₹1,000+ · Estimated delivery 2-3 working days"
                                : "₹200 delivery fee · FREE on orders ₹2,000+ · Estimated delivery 4-6 working days"}
                            </p>
                          </div>
                        </>
                      ) : (
                        <div className="text-sm">
                          <p className="font-medium">Invalid pincode</p>
                          <p className="text-xs opacity-90">Please enter a valid 6-digit Indian postal pincode.</p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Save address checkbox */}
                {user && (
                  <div className="flex items-center space-x-2 pt-2">
                    <Checkbox
                      id="save-address"
                      checked={saveAddressForFuture}
                      onCheckedChange={(v) => setSaveAddressForFuture(!!v)}
                    />
                    <label
                      htmlFor="save-address"
                      className="text-xs font-medium leading-none text-muted-foreground cursor-pointer"
                    >
                      Save this address for faster checkout next time
                    </label>
                  </div>
                )}
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              By placing this order you agree to our{" "}
              <Link to="/terms" className="underline hover:text-primary">Terms & Conditions</Link>.
            </p>
          </div>

          {/* Order Summary Column */}
          <div className="bg-card border border-border/50 rounded-2xl p-6 h-fit sticky top-28">
            <h2 className="font-display text-2xl mb-4">Order Summary</h2>
            <div className="space-y-3 mb-4 max-h-72 overflow-y-auto pr-1">
              {items.map((i) => (
                <div key={i.id} className="text-sm">
                  <div className="flex justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium truncate">{i.product_name}</span>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{variantLabel(i.variant)}</Badge>
                      </div>
                      <span className="text-muted-foreground text-xs">Qty {i.quantity}</span>
                      {i.pack_items?.length > 0 && (
                        <div className="mt-1 text-[11px] text-muted-foreground flex items-start gap-1">
                          <Package className="w-3 h-3 mt-0.5" />
                          <span>{i.pack_items.map((s) => CATALOG[s]?.name ?? s).join(", ")}</span>
                        </div>
                      )}
                    </div>
                    <span className="whitespace-nowrap font-medium">
                      {i.variant === "free" ? (
                        <>
                          <span className="line-through text-xs text-muted-foreground mr-1.5 font-normal">₹300.00</span>
                          <span className="text-primary font-bold">FREE</span>
                        </>
                      ) : (
                        `₹${(i.price_inr * i.quantity).toFixed(2)}`
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-border/50 pt-3 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-primary font-medium">
                  <span>Discount ({couponCode})</span>
                  <span>-₹{discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery</span>
                <span>{deliveryFee === 0 ? "FREE" : `₹${deliveryFee.toFixed(2)}`}</span>
              </div>
              {amountToFree > 0 && (
                <p className="text-[11px] text-primary/80">
                  Add ₹{amountToFree.toFixed(2)} more for FREE delivery
                </p>
              )}
            </div>
            <div className="border-t border-border/50 mt-3 pt-3 flex justify-between font-display text-xl mb-6">
              <span>Grand Total</span>
              <span className="text-gradient">₹{total.toFixed(2)}</span>
            </div>

            <Button
              variant="hero"
              size="lg"
              className="w-full text-base font-semibold py-6"
              onClick={handleProceed}
              disabled={submitting}
            >
              {submitting ? (
                "Creating Order..."
              ) : !user ? (
                "Sign In to Pay"
              ) : (
                `Proceed to Payment · ₹${total.toFixed(2)}`
              )}
            </Button>
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground text-center mt-3">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              <span>Razorpay 256-bit Secure UPI, Cards, Netbanking</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

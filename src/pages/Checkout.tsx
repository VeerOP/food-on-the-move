import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Loader2, CheckCircle2, XCircle, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/Navbar";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import {
  STORE,
  DELIVERY_RADIUS_KM,
  distanceFromStore,
  geocodeAddress,
  computeDeliveryFee,
  FREE_DELIVERY_THRESHOLD_INR,
  isMumbaiAddress,
} from "@/lib/delivery";
import { CATALOG, variantLabel } from "@/lib/catalog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

const phoneSchema = z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian phone");
const nameSchema = z.string().trim().min(2, "Name required").max(80);
const addrSchema = z.string().trim().min(5, "Address required").max(300);
const pinSchema = z.string().trim().regex(/^\d{6}$/, "Enter a valid 6-digit pincode");
const landmarkSchema = z.string().trim().max(120).optional().or(z.literal(""));

export default function CheckoutPage() {
  const { items, subtotal, clearCart, discount, couponCode } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [landmark, setLandmark] = useState("");
  const [pincode, setPincode] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [locating, setLocating] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const paymentMethod = "razorpay";

  useEffect(() => {
    if (!user) navigate("/auth");
    else if (items.length === 0) navigate("/cart");
  }, [user, items, navigate]);

  useEffect(() => {
    if (coords) setDistance(distanceFromStore(coords.lat, coords.lng));
    else setDistance(null);
  }, [coords]);

  const isMumbai = isMumbaiAddress(pincode, address);
  const deliveryThreshold = isMumbai ? 1000 : 2000;
  const deliveryFee = computeDeliveryFee(subtotal, pincode, address);
  const total = subtotal - discount + deliveryFee;
  const amountToFree = Math.max(0, deliveryThreshold - subtotal);

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported in this browser");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
        toast.success("Location captured");
      },
      (err) => {
        setLocating(false);
        toast.error(`Could not get location: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const verifyAddress = async () => {
    if (!address.trim()) {
      toast.error("Enter an address first");
      return;
    }
    if (!pincode.trim()) {
      toast.error("Enter a pincode first");
      return;
    }
    const query = [address, landmark, pincode, "Mumbai"].filter(Boolean).join(", ");
    setGeocoding(true);
    const result = await geocodeAddress(query);
    setGeocoding(false);
    if (!result) {
      toast.error("Could not find that address. Try a more specific one or use GPS.");
      return;
    }
    setCoords({ lat: result.lat, lng: result.lng });
    toast.success("Address verified");
  };

  const handleProceed = async () => {
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
    if (!coords) {
      toast.error("Please verify your address by clicking 'Verify address' first.");
      return;
    }
    if (!user) return;

    setSubmitting(true);
    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        status: "pending_payment",
        subtotal_inr: subtotal - discount,
        delivery_fee_inr: deliveryFee,
        total_inr: total,
        delivery_address: address,
        landmark: landmark || null,
        pincode,
        delivery_lat: coords.lat,
        delivery_lng: coords.lng,
        delivery_distance_km: Number(distance!.toFixed(3)),
        customer_name: name,
        customer_phone: phone,
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
    await clearCart();
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
          Delivering from {STORE.name} · within {DELIVERY_RADIUS_KM} km only.
        </p>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card border border-border/50 rounded-2xl p-6">
              <h2 className="font-display text-2xl mb-4">Contact</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name" className="flex items-center gap-1">
                    Full name <span className="text-destructive font-bold">*</span>
                  </Label>
                  <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter full name" />
                </div>
                <div>
                  <Label htmlFor="phone" className="flex items-center gap-1">
                    Mobile number (10 digits) <span className="text-destructive font-bold">*</span>
                  </Label>
                  <Input id="phone" required inputMode="numeric" maxLength={10} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="10-digit number" />
                </div>
              </div>
            </div>

            <div className="bg-card border border-border/50 rounded-2xl p-6">
              <h2 className="font-display text-2xl mb-4">Delivery address</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="address" className="flex items-center gap-1">
                    Address <span className="text-destructive font-bold">*</span>
                  </Label>
                  <Input
                    id="address"
                    required
                    placeholder="Flat, building, street, area"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="landmark" className="flex items-center gap-1">
                      Landmark <span className="text-muted-foreground text-xs font-normal">(optional)</span>
                    </Label>
                    <Input id="landmark" placeholder="Nearby landmark" value={landmark} onChange={(e) => setLandmark(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="pincode" className="flex items-center gap-1">
                      Pincode <span className="text-destructive font-bold">*</span>
                    </Label>
                    <Input id="pincode" required inputMode="numeric" maxLength={6} value={pincode} onChange={(e) => setPincode(e.target.value)} placeholder="6-digit pincode" />
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 mt-4">
                <Button variant="outline" onClick={verifyAddress} disabled={geocoding}>
                  {geocoding ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <MapPin className="w-4 h-4 mr-2" />}
                  Verify address
                </Button>
                <Button variant="outline" onClick={useMyLocation} disabled={locating}>
                  {locating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <MapPin className="w-4 h-4 mr-2" />}
                  Use my GPS location
                </Button>
              </div>

              {distance !== null && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 rounded-xl p-4 flex items-start gap-3 bg-primary/10 border border-primary/30"
                >
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-foreground">
                      Address verified! {isMumbaiAddress(pincode, address) ? "Mumbai Delivery" : "PAN India Delivery"}
                    </p>
                    <p className="text-muted-foreground">
                      Estimated delivery time: <span className="font-semibold text-foreground">2-3 working days</span>.
                    </p>
                  </div>
                </motion.div>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              By placing this order you agree to our{" "}
              <Link to="/terms" className="underline hover:text-primary">Terms & Conditions</Link>.
            </p>
          </div>

          <div className="bg-card border border-border/50 rounded-2xl p-6 h-fit sticky top-28">
            <h2 className="font-display text-2xl mb-4">Order Summary</h2>
            <div className="space-y-3 mb-4 max-h-72 overflow-y-auto">
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
                    <span className="whitespace-nowrap">
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
            <div className="border-t border-border/50 pt-3 space-y-1 text-sm">
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
              className="w-full"
              onClick={handleProceed}
              disabled={submitting}
            >
              {submitting ? "Creating order..." : "Proceed to Payment"}
            </Button>
            <p className="text-[11px] text-muted-foreground text-center mt-3">
              Cards, UPI, Netbanking, Wallets supported
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Copy, CheckCircle2, CreditCard, Loader2, MessageSquare, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { buildWhatsAppOrderMessage, whatsappLink, googleMapsLink } from "@/lib/notify";
import { toast } from "sonner";

type OrderItem = {
  product_name: string;
  quantity: number;
  line_total_inr: number;
  variant: string;
  pack_items: string[];
};

type Order = {
  id: string;
  status: string;
  upi_reference: string | null;
  subtotal_inr: number;
  delivery_fee_inr: number;
  total_inr: number;
  delivery_address: string;
  landmark: string | null;
  pincode: string | null;
  delivery_lat: number;
  delivery_lng: number;
  delivery_distance_km: number;
  customer_name: string;
  customer_phone: string;
  created_at: string;
  order_items: OrderItem[];
  payment_method: string;
};

const loadRazorpay = () => {
  return new Promise<boolean>((resolve) => {
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function PayPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { clearCart } = useCart();
  const [order, setOrder] = useState<Order | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [hasAutoTriggered, setHasAutoTriggered] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    if (!id) return;
    (async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          id,
          status,
          upi_reference,
          payment_method,
          subtotal_inr,
          delivery_fee_inr,
          total_inr,
          delivery_address,
          landmark,
          pincode,
          delivery_lat,
          delivery_lng,
          delivery_distance_km,
          customer_name,
          customer_phone,
          created_at,
          order_items (
            product_name,
            quantity,
            line_total_inr,
            variant,
            pack_items
          )
        `)
        .eq("id", id)
        .single();
      if (error || !data) {
        toast.error("Order not found");
        navigate("/orders");
        return;
      }
      const ord: Order = {
        ...data,
        subtotal_inr: Number(data.subtotal_inr),
        delivery_fee_inr: Number(data.delivery_fee_inr),
        total_inr: Number(data.total_inr),
        delivery_distance_km: Number(data.delivery_distance_km),
        delivery_lat: Number(data.delivery_lat),
        delivery_lng: Number(data.delivery_lng),
        order_items: (data.order_items ?? []).map((i: any) => ({
          ...i,
          line_total_inr: Number(i.line_total_inr),
          pack_items: Array.isArray(i.pack_items) ? i.pack_items : [],
        })),
      };
      setOrder(ord);
    })();
  }, [id, user, navigate]);

  const handleSendWhatsApp = (ord: Order) => {
    const msg = buildWhatsAppOrderMessage({
      orderId: ord.id,
      customerName: ord.customer_name,
      customerPhone: ord.customer_phone,
      address: ord.delivery_address,
      landmark: ord.landmark,
      pincode: ord.pincode,
      mapsUrl: googleMapsLink(ord.delivery_lat, ord.delivery_lng),
      distanceKm: ord.delivery_distance_km,
      subtotal: ord.subtotal_inr,
      deliveryFee: ord.delivery_fee_inr,
      total: ord.total_inr,
      paymentStatus: "Paid (Razorpay)",
      upiReference: ord.upi_reference,
      createdAt: ord.created_at,
      items: ord.order_items.map((it) => ({
        name: it.product_name,
        quantity: it.quantity,
        lineTotal: it.line_total_inr,
        variant: it.variant,
        packItems: it.pack_items,
      })),
    });
    window.open(whatsappLink(msg), "_blank", "noopener");
  };

  const handleRazorpayPayment = useCallback(async () => {
    if (!order) return;
    setConfirming(true);
    setPaymentError(null);

    const loaded = await loadRazorpay();
    if (!loaded) {
      setConfirming(false);
      const msg = "Failed to load Razorpay SDK. Please check your internet connection.";
      setPaymentError(msg);
      toast.error(msg);
      return;
    }

    const localKey = (import.meta.env.VITE_RAZORPAY_KEY_ID || "").replace(/['"\s]/g, "").trim();

    try {
      // 1. BACKEND - Create Order
      const createResponse = await fetch("/api/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: Math.round(order.total_inr * 100), // in paise
          currency: "INR",
          receipt: `order_${order.id.slice(0, 8)}`,
        }),
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json();
        throw new Error(errorData.error || "Failed to create order on server");
      }

      const { order_id, key_id } = await createResponse.json();
      const activeKey = key_id || localKey;

      if (!activeKey) {
        setConfirming(false);
        const msg = "Razorpay Key ID is not configured. Please check your environment variables.";
        setPaymentError(msg);
        toast.error(msg);
        return;
      }

      // 2. FRONTEND - Open Razorpay Modal with order_id
      const options = {
        key: activeKey,
        amount: Math.round(order.total_inr * 100),
        currency: "INR",
        name: "Food on the Move",
        description: `Order #${order.id.slice(0, 8)}`,
        order_id: order_id,
        handler: async function (response: any) {
          const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = response;
          setConfirming(true);

          try {
            // 3. BACKEND - Verify Signature
            const verifyResponse = await fetch("/api/verify-payment", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                razorpay_payment_id,
                razorpay_order_id,
                razorpay_signature,
              }),
            });

            const verifyData = await verifyResponse.json();
            if (!verifyResponse.ok || !verifyData.success) {
              throw new Error(verifyData.error || "Payment signature verification failed");
            }

            // Sync to Database only after signature is verified successfully
            const { error } = await supabase
              .from("orders")
              .update({
                status: "paid",
                upi_reference: razorpay_payment_id,
                updated_at: new Date().toISOString(),
              })
              .eq("id", order.id);

            if (error) throw error;

            await clearCart();

            toast.success("Payment verified! Order confirmed.");
            const updatedOrder = {
              ...order,
              status: "paid",
              upi_reference: razorpay_payment_id,
            };
            setOrder(updatedOrder);
            handleSendWhatsApp(updatedOrder);
          } catch (err: any) {
            const msg = err.message || "Failed to verify signature";
            setPaymentError(msg);
            toast.error(msg);
          } finally {
            setConfirming(false);
          }
        },
        prefill: {
          name: order.customer_name,
          contact: order.customer_phone,
          email: user?.email || "",
        },
        theme: {
          color: "#F28C28",
        },
        modal: {
          ondismiss: function () {
            setConfirming(false);
            toast.error("Payment modal closed");
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      setConfirming(false);
      console.error(err);
      const msg = err.message || "Failed to initialize payment gateway";
      setPaymentError(msg);
      toast.error(msg);
    }
  }, [order, user?.email, clearCart]);

  useEffect(() => {
    if (order && order.status === "pending_payment" && !hasAutoTriggered) {
      setHasAutoTriggered(true);
      const timer = setTimeout(() => {
        handleRazorpayPayment();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [order, hasAutoTriggered, handleRazorpayPayment]);

  if (!order) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-32 section-container text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary mb-2" />
          <p className="text-muted-foreground">Loading order details…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-32 pb-16 section-container max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border/50 rounded-3xl p-5 sm:p-8 text-center"
        >
          <h1 className="font-display text-3xl sm:text-4xl mb-2">
            Pay with <span className="text-gradient">Razorpay</span>
          </h1>
          <p className="text-muted-foreground mb-6 text-sm sm:text-base">
            Order #{order.id.slice(0, 8)} · Amount: <span className="text-foreground font-semibold">₹{order.total_inr.toFixed(2)}</span>
          </p>

          {order.status === "paid" ? (
            <div className="py-6 sm:py-8 space-y-6 text-center">
              <div className="flex flex-col items-center">
                <CheckCircle2 className="w-16 h-16 text-primary mb-3 animate-pulse" />
                <h2 className="font-display text-2xl sm:text-3xl mb-1 text-foreground">Payment Received!</h2>
                <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                  Your order is confirmed via Razorpay (Ref: <span className="font-mono text-xs text-primary">{order.upi_reference}</span>).
                </p>
              </div>

              {/* Order summary card */}
              <div className="bg-background/50 border border-border/50 rounded-2xl p-4 sm:p-6 text-left space-y-3">
                <h3 className="font-display text-lg border-b border-border/50 pb-2">Order Summary</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {order.order_items.map((it, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{it.product_name} × {it.quantity}</span>
                      <span className="font-semibold">₹{it.line_total_inr.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-border/50 pt-2 flex justify-between font-display text-lg text-gradient">
                  <span>Grand Total</span>
                  <span>₹{order.total_inr.toFixed(2)}</span>
                </div>
              </div>

              {/* WhatsApp Call-to-action */}
              <div className="space-y-4 pt-4 border-t border-border/50">
                <div className="bg-[#25D366]/10 border border-[#25D366]/30 rounded-2xl p-4 sm:p-5 text-left">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-[#25D366] text-white flex items-center justify-center font-bold text-sm shrink-0">
                      💬
                    </div>
                    <div>
                      <h4 className="font-display text-base text-foreground">Order Confirmation on WhatsApp</h4>
                      <p className="text-xs text-muted-foreground">Send receipt & chat with store for live delivery updates</p>
                    </div>
                  </div>
                  
                  <div className="grid sm:grid-cols-2 gap-2 mt-4">
                    <Button 
                      variant="hero" 
                      className="w-full bg-[#25D366] hover:bg-[#20ba56] text-white border-none shadow-lg shadow-green-500/20 py-4 sm:py-5 flex items-center justify-center gap-2 font-medium"
                      onClick={() => handleSendWhatsApp(order)}
                    >
                      <MessageSquare className="w-4 h-4 fill-white shrink-0" />
                      Send to WhatsApp
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full border-[#25D366]/40 hover:bg-[#25D366]/10 text-foreground py-4 sm:py-5 flex items-center justify-center gap-2"
                      onClick={() => {
                        const msg = buildWhatsAppOrderMessage({
                          orderId: order.id,
                          customerName: order.customer_name,
                          customerPhone: order.customer_phone,
                          address: order.delivery_address,
                          landmark: order.landmark,
                          pincode: order.pincode,
                          mapsUrl: googleMapsLink(order.delivery_lat, order.delivery_lng),
                          distanceKm: order.delivery_distance_km,
                          subtotal: order.subtotal_inr,
                          deliveryFee: order.delivery_fee_inr,
                          total: order.total_inr,
                          paymentStatus: "Paid (Razorpay)",
                          upiReference: order.upi_reference,
                          createdAt: order.created_at,
                          items: order.order_items.map((it) => ({
                            name: it.product_name,
                            quantity: it.quantity,
                            lineTotal: it.line_total_inr,
                            variant: it.variant,
                            packItems: it.pack_items,
                          })),
                        });
                        navigator.clipboard.writeText(msg);
                        toast.success("Order summary copied to clipboard!");
                      }}
                    >
                      <Copy className="w-4 h-4 shrink-0" />
                      Copy Receipt Text
                    </Button>
                  </div>
                </div>

                <div className="flex gap-3 justify-center">
                  <Button variant="outline" className="w-full" onClick={() => navigate("/orders")}>
                    View My Orders
                  </Button>
                  <Button variant="outline" className="w-full" onClick={() => navigate("/")}>
                    Back to Home
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6 py-2 sm:py-4">
              <div className="flex flex-col items-center justify-center p-5 sm:p-8 bg-background/50 border border-border/50 rounded-2xl">
                <CreditCard className="w-14 h-14 sm:w-16 sm:h-16 text-primary mb-3 sm:mb-4 animate-pulse" />
                <h3 className="font-display text-xl sm:text-2xl text-foreground mb-2">Automated Online Payment</h3>
                <p className="text-xs sm:text-sm text-muted-foreground text-center max-w-sm mb-6">
                  Secure checkout via Razorpay. Pay automatically using credit/debit cards, net banking, UPI apps, or wallets.
                </p>

                {paymentError && (
                  <div className="w-full mb-6 p-3.5 sm:p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm flex items-start gap-3 text-left">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold break-words">{paymentError}</p>
                      {paymentError.toLowerCase().includes("authentication failed") && (
                        <p className="text-xs mt-1.5 text-muted-foreground break-words leading-relaxed">
                          Please verify your <code className="bg-background/80 px-1 py-0.5 rounded font-mono text-[11px]">VITE_RAZORPAY_KEY_ID</code> and <code className="bg-background/80 px-1 py-0.5 rounded font-mono text-[11px]">RAZORPAY_KEY_SECRET</code> in Vercel Environment Variables.
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <Button
                  variant="hero"
                  className="w-full min-h-[3.25rem] h-auto px-4 py-3.5 sm:py-4 rounded-xl flex items-center justify-center gap-2.5 font-display text-base sm:text-lg shadow-lg shadow-primary/25 transition-all"
                  onClick={handleRazorpayPayment}
                  disabled={confirming}
                >
                  {confirming ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin shrink-0" />
                      <span>Loading Gateway...</span>
                    </>
                  ) : paymentError ? (
                    <>
                      <RefreshCw className="w-5 h-5 shrink-0" />
                      <span>Retry Payment ₹{order.total_inr.toFixed(2)}</span>
                    </>
                  ) : (
                    <span>Pay Securely ₹{order.total_inr.toFixed(2)}</span>
                  )}
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

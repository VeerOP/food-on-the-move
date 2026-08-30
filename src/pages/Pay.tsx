import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import QRCode from "qrcode";
import { Copy, Smartphone, CheckCircle2, CreditCard, Loader2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { buildUpiUri, UPI_PAYEE_VPA, UPI_PAYEE_NAME } from "@/lib/upi";
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
  const [order, setOrder] = useState<Order | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [hasAutoTriggered, setHasAutoTriggered] = useState(false);

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
      const uri = buildUpiUri({
        amount: ord.total_inr,
        transactionNote: `Order ${ord.id.slice(0, 8)}`,
        transactionRef: ord.id.slice(0, 12),
      });
      QRCode.toDataURL(uri, { width: 320, margin: 1 }).then(setQrDataUrl);
    })();
  }, [id, user, navigate]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File is too large. Upload an image under 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setScreenshot(reader.result);
        toast.success("Screenshot loaded successfully");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSendWhatsApp = (ord: Order) => {
    const isRazorpay = ord.upi_reference && ord.upi_reference.startsWith("pay_");
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
      paymentStatus: isRazorpay ? "Paid (Razorpay)" : "Paid (UPI)",
      upiReference: ord.upi_reference && ord.upi_reference.startsWith("data:image/") ? "Screenshot Uploaded" : ord.upi_reference,
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

  const handleRazorpayPayment = async () => {
    if (!order) return;
    setConfirming(true);
    const loaded = await loadRazorpay();
    if (!loaded) {
      setConfirming(false);
      toast.error("Failed to load Razorpay SDK. Please check your internet connection.");
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
        toast.error("Razorpay Key ID is not configured. Please check your environment variables.");
        return;
      }

      // 2. FRONTEND - Open Razorpay Modal with order_id
      const options = {
        key: activeKey,
        amount: Math.round(order.total_inr * 100),
        currency: "INR",
        name: "Food on the Move",
        description: `Order #${order.id.slice(0, 8)}`,
        order_id: order_id, // Pass order_id here
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

            toast.success("Payment verified! Order confirmed.");
            const updatedOrder = {
              ...order,
              status: "paid",
              upi_reference: razorpay_payment_id,
            };
            setOrder(updatedOrder);
            handleSendWhatsApp(updatedOrder);
          } catch (err: any) {
            toast.error(err.message || "Failed to verify signature");
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
            toast.error("Payment cancelled");
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      setConfirming(false);
      console.error(err);
      toast.error(err.message || "Failed to initialize payment gateway");
    }
  };

  const switchPaymentMethod = async (method: "razorpay" | "upi") => {
    if (!order) return;
    setConfirming(true);
    const { error } = await supabase
      .from("orders")
      .update({ payment_method: method })
      .eq("id", order.id);

    if (error) {
      setConfirming(false);
      toast.error(error.message);
      return;
    }

    setOrder({
      ...order,
      payment_method: method,
    });
    setConfirming(false);
    toast.success(`Switched to ${method === "razorpay" ? "Online Payment" : "Manual UPI Transfer"}`);
  };

  useEffect(() => {
    if (order && order.status === "pending_payment" && order.payment_method === "razorpay" && !hasAutoTriggered) {
      setHasAutoTriggered(true);
      const timer = setTimeout(() => {
        handleRazorpayPayment();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [order?.id, order?.payment_method, order?.status, hasAutoTriggered]);

  const confirmPayment = async () => {
    if (!order) return;
    if (!screenshot) {
      toast.error("Please upload a payment screenshot");
      return;
    }
    setConfirming(true);
    const { error } = await supabase
      .from("orders")
      .update({
        status: "paid",
        upi_reference: screenshot,
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id);
    if (error) {
      setConfirming(false);
      toast.error(error.message);
      return;
    }

    toast.success("Payment recorded! Your order is confirmed.");
    
    const updatedOrder = {
      ...order,
      status: "paid",
      upi_reference: screenshot,
    };
    setOrder(updatedOrder);
    setConfirming(false);

    handleSendWhatsApp(updatedOrder);
  };

  if (!order) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-32 section-container">Loading…</div>
      </div>
    );
  }

  const upiUri = buildUpiUri({
    amount: order.total_inr,
    transactionNote: `Order ${order.id.slice(0, 8)}`,
    transactionRef: order.id.slice(0, 12),
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-32 pb-16 section-container max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border/50 rounded-3xl p-8 text-center"
        >
          <h1 className="font-display text-4xl mb-2">
            Pay with <span className="text-gradient">Razorpay</span>
          </h1>
          <p className="text-muted-foreground mb-6">
            Order #{order.id.slice(0, 8)} · Amount: <span className="text-foreground font-semibold">₹{order.total_inr.toFixed(2)}</span>
          </p>

          {order.status === "paid" ? (
            <div className="py-8 space-y-6 text-center">
              <div className="flex flex-col items-center">
                <CheckCircle2 className="w-16 h-16 text-primary mb-3 animate-pulse" />
                <h2 className="font-display text-3xl mb-1 text-foreground">Order Confirmed!</h2>
                <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                  Thank you! We have received your payment reference. Please complete the step below.
                </p>
              </div>

              {/* Order summary card */}
              <div className="bg-background/50 border border-border/50 rounded-2xl p-6 text-left space-y-3">
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
                <div className="bg-[#25D366]/10 border border-[#25D366]/30 rounded-2xl p-5 text-left">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-[#25D366] text-white flex items-center justify-center font-bold text-sm">
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
                      className="w-full bg-[#25D366] hover:bg-[#20ba56] text-white border-none shadow-lg shadow-green-500/20 py-5 flex items-center justify-center gap-2 font-medium"
                      onClick={() => handleSendWhatsApp(order)}
                    >
                      <MessageSquare className="w-4 h-4 fill-white" />
                      Send to WhatsApp
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full border-[#25D366]/40 hover:bg-[#25D366]/10 text-foreground py-5 flex items-center justify-center gap-2"
                      onClick={() => {
                        const isRazorpay = order.upi_reference && order.upi_reference.startsWith("pay_");
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
                          paymentStatus: isRazorpay ? "Paid (Razorpay)" : "Paid (UPI)",
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
                      <Copy className="w-4 h-4" />
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
            <div className="space-y-6 py-4">
              <div className="flex flex-col items-center justify-center p-8 bg-card border border-border/50 rounded-2xl">
                <CreditCard className="w-16 h-16 text-primary mb-4 animate-pulse" />
                <h3 className="font-display text-2xl text-foreground mb-2">Automated Online Payment</h3>
                <p className="text-sm text-muted-foreground text-center max-w-sm mb-6">
                  Secure checkout via Razorpay. Pay automatically using credit/debit cards, net banking, UPI, or mobile wallets.
                </p>
                <Button
                  variant="hero"
                  size="lg"
                  className="w-full py-6 flex items-center justify-center gap-2 font-display text-lg"
                  onClick={handleRazorpayPayment}
                  disabled={confirming}
                >
                  {confirming ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Loading Gateway...
                    </>
                  ) : (
                    <>Pay Securely ₹{order.total_inr.toFixed(2)}</>
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

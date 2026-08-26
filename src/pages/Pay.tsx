import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import QRCode from "qrcode";
import { Copy, Smartphone, CheckCircle2, CreditCard, Loader2 } from "lucide-react";
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

    const key = import.meta.env.VITE_RAZORPAY_KEY_ID || "";
    if (!key) {
      setConfirming(false);
      toast.error("Razorpay Key ID is not configured. Please add VITE_RAZORPAY_KEY_ID to your .env file.");
      return;
    }

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

      const { order_id } = await createResponse.json();

      // 2. FRONTEND - Open Razorpay Modal with order_id
      const options = {
        key: key,
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
            Pay with <span className="text-gradient">{order.payment_method === "razorpay" ? "Razorpay" : "UPI"}</span>
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
                <div className="bg-primary/10 border border-primary/30 rounded-2xl p-5">
                  <p className="text-xs text-primary font-semibold tracking-wider uppercase mb-3">
                    📲 STEP 2: SHARE ORDER DETAILS ON WHATSAPP
                  </p>
                  <p className="text-xs text-muted-foreground mb-4">
                    Send the generated order receipt message on WhatsApp. This is how we coordinate delivery details and updates with you.
                  </p>
                  <Button 
                    variant="hero" 
                    className="w-full bg-[#25D366] hover:bg-[#20ba56] text-white border-none shadow-lg shadow-green-500/20 py-6"
                    onClick={() => handleSendWhatsApp(order)}
                  >
                    Send Order via WhatsApp
                  </Button>
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
          ) : order.payment_method === "razorpay" ? (
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

              <div className="border-t border-border/50 pt-6">
                <p className="text-xs text-muted-foreground mb-3">Having trouble with automatic payment?</p>
                <Button
                  variant="outline"
                  className="w-full text-xs py-4"
                  onClick={() => switchPaymentMethod("upi")}
                  disabled={confirming}
                >
                  Switch to Manual UPI QR Transfer
                </Button>
              </div>
            </div>
          ) : (
            <>
              {qrDataUrl && (
                <div className="bg-white p-4 rounded-2xl inline-block mb-4">
                  <img src={qrDataUrl} alt="UPI QR" className="w-64 h-64" />
                </div>
              )}
              <p className="text-sm text-muted-foreground mb-2">Scan with any UPI app</p>
              <div className="flex items-center justify-center gap-2 mb-4">
                <code className="bg-muted px-3 py-1 rounded text-sm">{UPI_PAYEE_VPA}</code>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    navigator.clipboard.writeText(UPI_PAYEE_VPA);
                    toast.success("UPI ID copied");
                  }}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mb-6">Payee: {UPI_PAYEE_NAME}</p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                <Button variant="outline" asChild>
                  <a href={buildUpiUri({ amount: order.total_inr, transactionNote: `Order ${order.id.slice(0,8)}`, transactionRef: order.id.slice(0,12), app: "gpay" })}>
                    Pay with GPay
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <a href={buildUpiUri({ amount: order.total_inr, transactionNote: `Order ${order.id.slice(0,8)}`, transactionRef: order.id.slice(0,12), app: "phonepe" })}>
                    Pay with PhonePe
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <a href={buildUpiUri({ amount: order.total_inr, transactionNote: `Order ${order.id.slice(0,8)}`, transactionRef: order.id.slice(0,12), app: "paytm" })}>
                    Pay with Paytm
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <a href={buildUpiUri({ amount: order.total_inr, transactionNote: `Order ${order.id.slice(0,8)}`, transactionRef: order.id.slice(0,12), app: "bhim" })}>
                    Pay with BHIM
                  </a>
                </Button>
              </div>

              <Button variant="hero" size="lg" className="w-full mb-6" asChild>
                <a href={upiUri}>
                  <Smartphone className="w-4 h-4 mr-2" /> Open any UPI app
                </a>
              </Button>
              <p className="text-xs text-muted-foreground mb-6">
                Tip: app buttons work on mobile devices with the respective app installed. On desktop, scan the QR with your phone.
              </p>

              <div className="border-t border-border/50 pt-6 text-left space-y-4">
                <Label htmlFor="screenshot" className="font-semibold text-foreground block">
                  After paying, upload a screenshot of your transaction confirmation
                </Label>
                <div className="mt-2 flex flex-col items-center justify-center border-2 border-dashed border-border/60 rounded-2xl p-6 bg-card/30 hover:border-primary/50 transition-colors relative">
                  <input
                    id="screenshot"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {screenshot ? (
                    <div className="text-center space-y-3">
                      <img src={screenshot} alt="Payment Preview" className="max-h-40 rounded-xl border border-border mx-auto object-contain" />
                      <p className="text-xs text-primary font-medium">Click or drag to replace screenshot</p>
                    </div>
                  ) : (
                    <div className="text-center space-y-2 pointer-events-none">
                      <p className="text-sm text-muted-foreground">Click to upload or drag & drop image</p>
                      <p className="text-xs text-muted-foreground/60">Supports PNG, JPG, JPEG up to 5MB</p>
                    </div>
                  )}
                </div>
                <Button
                  variant="hero"
                  className="w-full mt-2"
                  onClick={confirmPayment}
                  disabled={confirming || !screenshot}
                >
                  {confirming ? "Uploading & Confirming…" : "I have paid — submit screenshot"}
                </Button>

                <div className="border-t border-border/50 pt-4 text-center">
                  <p className="text-xs text-muted-foreground mb-2">Prefer paying automatically?</p>
                  <Button
                    variant="outline"
                    className="w-full text-xs py-4"
                    onClick={() => switchPaymentMethod("razorpay")}
                    disabled={confirming}
                  >
                    Switch to Online Payment (Razorpay)
                  </Button>
                </div>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}

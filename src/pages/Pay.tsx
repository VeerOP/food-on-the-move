import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import QRCode from "qrcode";
import { Copy, Smartphone, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { buildUpiUri, UPI_PAYEE_VPA, UPI_PAYEE_NAME } from "@/lib/upi";
import { buildWhatsAppOrderMessage, whatsappLink, googleMapsLink } from "@/lib/notify";
import { toast } from "sonner";

type Order = {
  id: string;
  total_inr: number;
  status: string;
  upi_reference: string | null;
};

export default function PayPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [reference, setReference] = useState("");
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    if (!id) return;
    (async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, total_inr, status, upi_reference")
        .eq("id", id)
        .single();
      if (error || !data) {
        toast.error("Order not found");
        navigate("/orders");
        return;
      }
      const ord = { ...data, total_inr: Number(data.total_inr) };
      setOrder(ord);
      const uri = buildUpiUri({
        amount: ord.total_inr,
        transactionNote: `Order ${ord.id.slice(0, 8)}`,
        transactionRef: ord.id.slice(0, 12),
      });
      QRCode.toDataURL(uri, { width: 320, margin: 1 }).then(setQrDataUrl);
    })();
  }, [id, user, navigate]);

  const confirmPayment = async () => {
    if (!order) return;
    if (reference.trim().length < 4) {
      toast.error("Enter the UPI transaction reference ID");
      return;
    }
    setConfirming(true);
    const ref = reference.trim();
    const { error } = await supabase
      .from("orders")
      .update({
        status: "paid",
        upi_reference: ref,
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id);
    if (error) {
      setConfirming(false);
      toast.error(error.message);
      return;
    }

    // Fetch full order details for WhatsApp notification
    const { data: full } = await supabase
      .from("orders")
      .select("id, customer_name, customer_phone, delivery_address, landmark, pincode, delivery_lat, delivery_lng, delivery_distance_km, subtotal_inr, delivery_fee_inr, total_inr, created_at, order_items(product_name, quantity, line_total_inr, variant, pack_items)")
      .eq("id", order.id)
      .single();

    setConfirming(false);
    toast.success("Payment recorded! Your order is confirmed.");

    if (full) {
      const msg = buildWhatsAppOrderMessage({
        orderId: full.id,
        customerName: full.customer_name,
        customerPhone: full.customer_phone,
        address: full.delivery_address,
        landmark: full.landmark,
        pincode: full.pincode,
        mapsUrl: googleMapsLink(Number(full.delivery_lat), Number(full.delivery_lng)),
        distanceKm: Number(full.delivery_distance_km),
        subtotal: Number(full.subtotal_inr),
        deliveryFee: Number(full.delivery_fee_inr),
        total: Number(full.total_inr),
        paymentStatus: "Paid (UPI)",
        upiReference: ref,
        createdAt: full.created_at,
        items: (full.order_items ?? []).map((it: any) => ({
          name: it.product_name,
          quantity: it.quantity,
          lineTotal: Number(it.line_total_inr),
          variant: it.variant,
          packItems: Array.isArray(it.pack_items) ? it.pack_items : [],
        })),
      });
      // Open WhatsApp in new tab so owner is notified
      window.open(whatsappLink(msg), "_blank", "noopener");
    }

    navigate("/orders");
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
          <h1 className="font-display text-4xl mb-2">Pay with <span className="text-gradient">UPI</span></h1>
          <p className="text-muted-foreground mb-6">
            Order #{order.id.slice(0, 8)} · Amount: <span className="text-foreground font-semibold">₹{order.total_inr.toFixed(2)}</span>
          </p>

          {order.status === "paid" ? (
            <div className="py-8">
              <CheckCircle2 className="w-16 h-16 text-primary mx-auto mb-3" />
              <p className="font-medium">This order is already paid.</p>
              <Button variant="hero" className="mt-6" onClick={() => navigate("/orders")}>View Orders</Button>
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

              <div className="border-t border-border/50 pt-6 text-left">
                <Label htmlFor="ref">After paying, enter your UPI transaction reference ID</Label>
                <Input
                  id="ref"
                  placeholder="e.g. 123456789012"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="mt-2"
                />
                <Button
                  variant="hero"
                  className="w-full mt-4"
                  onClick={confirmPayment}
                  disabled={confirming}
                >
                  {confirming ? "Confirming…" : "I have paid — confirm order"}
                </Button>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}

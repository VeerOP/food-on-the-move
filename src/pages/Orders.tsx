import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import { STATUS_LABEL, STATUS_STYLE, OrderStatus } from "@/lib/orderStatus";

type OrderRow = {
  id: string;
  status: string;
  total_inr: number;
  subtotal_inr: number;
  delivery_fee_inr: number;
  delivery_address: string;
  delivery_distance_km: number;
  upi_reference: string | null;
  created_at: string;
  order_items: {
    product_name: string;
    quantity: number;
    line_total_inr: number;
  }[];
};

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/auth");
      return;
    }
    (async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, status, total_inr, subtotal_inr, delivery_fee_inr, delivery_address, delivery_distance_km, upi_reference, created_at, order_items(product_name, quantity, line_total_inr)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (!error && data) {
        setOrders(
          data.map((o: any) => ({
            ...o,
            total_inr: Number(o.total_inr),
            subtotal_inr: Number(o.subtotal_inr),
            delivery_fee_inr: Number(o.delivery_fee_inr),
            delivery_distance_km: Number(o.delivery_distance_km),
            order_items: (o.order_items ?? []).map((it: any) => ({
              ...it,
              line_total_inr: Number(it.line_total_inr),
            })),
          }))
        );
      }
      setLoading(false);
    })();
  }, [user, authLoading, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-32 pb-16 section-container">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display text-5xl md:text-6xl mb-8"
        >
          Order <span className="text-gradient">History</span>
        </motion.h1>

        {loading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : orders.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-6">No orders yet.</p>
            <Button variant="hero" asChild>
              <Link to="/#products">Start Shopping</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((o) => (
              <motion.div
                key={o.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card border border-border/50 rounded-2xl p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Order #{o.id.slice(0, 8)}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(o.created_at), "PPp")}</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${
                      STATUS_STYLE[(o.status as OrderStatus)] ?? "bg-muted text-muted-foreground"
                    }`}
                  >
                    {STATUS_LABEL[(o.status as OrderStatus)] ?? o.status.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="space-y-1 mb-4 text-sm">
                  {o.order_items.map((it, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span className="text-muted-foreground">{it.product_name} × {it.quantity}</span>
                      <span>₹{it.line_total_inr.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-border/50 pt-3 text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Delivery to ({o.delivery_distance_km.toFixed(2)} km)</span>
                    <span>₹{o.delivery_fee_inr.toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{o.delivery_address}</p>
                  <div className="flex justify-between font-display text-lg pt-2">
                    <span>Total</span>
                    <span className="text-gradient">₹{o.total_inr.toFixed(2)}</span>
                  </div>
                  {o.upi_reference && (
                    o.upi_reference.startsWith("pay_") ? (
                      <p className="text-xs text-muted-foreground font-semibold text-primary">Razorpay ID: {o.upi_reference}</p>
                    ) : o.upi_reference.startsWith("data:image/") ? (
                      <p className="text-xs text-muted-foreground">Payment Screenshot Uploaded</p>
                    ) : (
                      <p className="text-xs text-muted-foreground">UPI Ref: {o.upi_reference}</p>
                    )
                  )}
                </div>
                {o.status === "pending_payment" && (
                  <Button variant="outline" className="mt-4" onClick={() => navigate(`/pay/${o.id}`)}>
                    Complete payment
                  </Button>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

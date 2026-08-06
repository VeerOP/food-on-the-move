import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useIsAdmin } from "@/hooks/use-admin";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { ORDER_STATUSES, STATUS_LABEL, STATUS_STYLE, OrderStatus } from "@/lib/orderStatus";

type AdminOrder = {
  id: string;
  status: OrderStatus;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  delivery_distance_km: number;
  total_inr: number;
  upi_reference: string | null;
  created_at: string;
  order_items: { product_name: string; quantity: number; line_total_inr: number }[];
};

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<OrderStatus | "all">("all");

  useEffect(() => {
    if (authLoading || adminLoading) return;
    if (!user) {
      navigate("/auth");
      return;
    }
    if (!isAdmin) {
      toast.error("Admin access required");
      navigate("/");
      return;
    }
    void loadOrders();
  }, [user, isAdmin, authLoading, adminLoading, navigate]);

  const loadOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select("id, status, customer_name, customer_phone, delivery_address, delivery_distance_km, total_inr, upi_reference, created_at, order_items(product_name, quantity, line_total_inr)")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error(error.message);
    } else if (data) {
      setOrders(
        data.map((o: any) => ({
          ...o,
          status: o.status as OrderStatus,
          total_inr: Number(o.total_inr),
          delivery_distance_km: Number(o.delivery_distance_km),
          order_items: (o.order_items ?? []).map((it: any) => ({
            ...it,
            line_total_inr: Number(it.line_total_inr),
          })),
        }))
      );
    }
    setLoading(false);
  };

  const updateStatus = async (orderId: string, status: OrderStatus) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
    if (error) {
      toast.error(error.message);
      return;
    }
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
    toast.success(`Status updated to ${STATUS_LABEL[status]}`);
  };

  const visible = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-32 pb-16 section-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-end justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="font-display text-5xl md:text-6xl">
              Admin <span className="text-gradient">Dashboard</span>
            </h1>
            <p className="text-muted-foreground mt-2">Manage all customer orders and delivery status.</p>
          </div>
          <div className="min-w-[220px]">
            <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
              <SelectTrigger><SelectValue placeholder="Filter status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses ({orders.length})</SelectItem>
                {ORDER_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_LABEL[s]} ({orders.filter((o) => o.status === s).length})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        {loading ? (
          <p className="text-muted-foreground">Loading orders…</p>
        ) : visible.length === 0 ? (
          <p className="text-muted-foreground">No orders in this view.</p>
        ) : (
          <div className="space-y-4">
            {visible.map((o) => (
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
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${STATUS_STYLE[o.status]}`}>
                    {STATUS_LABEL[o.status]}
                  </span>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4 text-sm">
                  <div>
                    <p className="font-semibold">{o.customer_name}</p>
                    <a href={`tel:${o.customer_phone}`} className="text-primary">{o.customer_phone}</a>
                    <p className="text-muted-foreground mt-1">{o.delivery_address}</p>
                    <p className="text-xs text-muted-foreground">{o.delivery_distance_km.toFixed(2)} km from store</p>
                  </div>
                  <div>
                    {o.order_items.map((it, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span className="text-muted-foreground">{it.product_name} × {it.quantity}</span>
                        <span>₹{it.line_total_inr.toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between font-display text-lg pt-2 border-t border-border/50 mt-2">
                      <span>Total</span>
                      <span className="text-gradient">₹{o.total_inr.toFixed(2)}</span>
                    </div>
                    {o.upi_reference && (
                      o.upi_reference.startsWith("data:image/") ? (
                        <div className="mt-2 space-y-1 text-left">
                          <span className="text-xs text-muted-foreground block font-medium">Payment Screenshot:</span>
                          <a href={o.upi_reference} target="_blank" rel="noopener noreferrer" className="inline-block">
                            <img src={o.upi_reference} alt="Payment Screenshot" className="max-w-[180px] max-h-[140px] border border-border/50 rounded-xl object-contain hover:scale-105 transition-transform duration-300" />
                          </a>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground mt-1">UPI Ref: {o.upi_reference}</p>
                      )
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 border-t border-border/50 pt-4">
                  <span className="text-sm text-muted-foreground">Update status:</span>
                  <div className="min-w-[220px]">
                    <Select value={o.status} onValueChange={(v) => updateStatus(o.id, v as OrderStatus)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ORDER_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

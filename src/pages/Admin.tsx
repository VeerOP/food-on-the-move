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
  MessageSquare,
  ShoppingCart,
  Boxes,
  Search,
  RefreshCw,
  Plus,
  Minus,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Package,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { customerWhatsappLink, buildCustomerStatusMessage } from "@/lib/notify";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { ADMIN_ORDER_STATUSES, STATUS_LABEL, STATUS_STYLE, OrderStatus } from "@/lib/orderStatus";
import { CATALOG } from "@/lib/catalog";
import { useInventory, updateProductStock } from "@/lib/inventory";
import { cn } from "@/lib/utils";

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

const CATEGORY_LABELS: Record<string, string> = {
  all: "All Categories",
  puffs: "Roasted Puffs",
  cookies: "Healthy Cookies",
  sticks: "Crunchy Sticks",
  sweets: "Sweets & Baklava",
  accessories: "Accessories",
  hampers: "Gift Hampers",
};

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const navigate = useNavigate();

  // Navigation Tab
  const [activeTab, setActiveTab] = useState<"orders" | "inventory">("orders");

  // Orders State
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<OrderStatus | "all">("all");

  // Inventory State
  const { inventory, refreshInventory } = useInventory();
  const [stockEdits, setStockEdits] = useState<Record<string, number>>({});
  const [savingSlug, setSavingSlug] = useState<string | null>(null);
  const [inventorySearch, setInventorySearch] = useState("");
  const [inventoryCategory, setInventoryCategory] = useState<string>("all");
  const [inventoryStatus, setInventoryStatus] = useState<"all" | "in_stock" | "low_stock" | "sold_out">("all");
  const [isRefreshingInventory, setIsRefreshingInventory] = useState(false);

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
      .neq("status", "pending_payment")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error(error.message);
    } else if (data) {
      setOrders(
        data
          .filter((o: any) => o.status !== "pending_payment")
          .map((o: any) => ({
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

  // Helper to extract stock numbers for any catalog product
  const getProductStock = (slug: string) => {
    const inv = inventory[slug];
    const cat = CATALOG[slug];
    const initial = inv?.initial ?? (typeof cat?.stock === "number" ? cat.stock : cat?.isSoldOut ? 0 : 50);
    const sold = inv?.sold ?? 0;
    const available = inv ? inv.available : Math.max(0, initial - sold);
    const isOut = inv ? inv.available <= 0 : !!cat?.isSoldOut;
    return { initial, sold, available, isOut };
  };

  const allProducts = Object.values(CATALOG);

  // Inventory Summary Stats
  const totalProductsCount = allProducts.length;
  const inStockCount = allProducts.filter((p) => getProductStock(p.slug).available > 3).length;
  const lowStockCount = allProducts.filter((p) => {
    const a = getProductStock(p.slug).available;
    return a > 0 && a <= 3;
  }).length;
  const soldOutCount = allProducts.filter((p) => getProductStock(p.slug).available <= 0).length;

  // Filtered Products for Inventory View
  const filteredProducts = allProducts.filter((p) => {
    const { available } = getProductStock(p.slug);

    if (inventorySearch.trim()) {
      const q = inventorySearch.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchSlug = p.slug.toLowerCase().includes(q);
      const matchCategory = p.category.toLowerCase().includes(q);
      if (!matchName && !matchSlug && !matchCategory) return false;
    }

    if (inventoryCategory !== "all" && p.category !== inventoryCategory) {
      return false;
    }

    if (inventoryStatus === "in_stock" && available <= 3) return false;
    if (inventoryStatus === "low_stock" && (available <= 0 || available > 3)) return false;
    if (inventoryStatus === "sold_out" && available > 0) return false;

    return true;
  });

  // Handle saving new available stock to Supabase
  const handleSaveStock = async (slug: string, targetAvailable: number, resetSold = false) => {
    setSavingSlug(slug);
    const prod = CATALOG[slug];
    const newStock = Math.max(0, targetAvailable);

    const res = await updateProductStock(slug, newStock, { resetSold });
    if (res.success) {
      toast.success(
        resetSold
          ? `Stock reset for ${prod?.name || slug}: ${newStock} units available (sold count reset to 0)`
          : `Stock updated for ${prod?.name || slug}: ${newStock} units available`
      );
      setStockEdits((prev) => {
        const next = { ...prev };
        delete next[slug];
        return next;
      });
    } else {
      toast.error(res.error || "Failed to update stock in Supabase");
    }
    setSavingSlug(null);
  };

  const handleQuickAdd = async (slug: string, addQty: number) => {
    const { available } = getProductStock(slug);
    const currentInput = stockEdits[slug] !== undefined ? stockEdits[slug] : available;
    const target = Math.max(0, currentInput + addQty);
    setStockEdits((prev) => ({ ...prev, [slug]: target }));
    await handleSaveStock(slug, target);
  };

  const handleMarkSoldOut = async (slug: string) => {
    setStockEdits((prev) => ({ ...prev, [slug]: 0 }));
    await handleSaveStock(slug, 0);
  };

  const handleRefreshInventory = async () => {
    setIsRefreshingInventory(true);
    await refreshInventory();
    toast.success("Stock details refreshed from Supabase");
    setIsRefreshingInventory(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="pt-32 pb-16 section-container flex-1">
        {/* Top Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-end justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl text-foreground font-black">
              Admin <span className="text-gradient">Dashboard</span>
            </h1>
            <p className="text-muted-foreground mt-2 text-sm sm:text-base">
              Manage customer orders, delivery tracking, and live product stock details with Supabase sync.
            </p>
          </div>

          {activeTab === "orders" && (
            <div className="min-w-[220px]">
              <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
                <SelectTrigger className="bg-card border-border/70 rounded-xl">
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="all">All active orders ({orders.length})</SelectItem>
                  {ADMIN_ORDER_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_LABEL[s]} ({orders.filter((o) => o.status === s).length})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </motion.div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-border/60 pb-3 mb-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab("orders")}
            className={cn(
              "flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer",
              activeTab === "orders"
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                : "text-muted-foreground hover:text-foreground hover:bg-card/70 border border-transparent"
            )}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Customer Orders</span>
            <span
              className={cn(
                "px-2 py-0.5 rounded-full text-xs font-bold",
                activeTab === "orders" ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
              )}
            >
              {orders.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("inventory")}
            className={cn(
              "flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer",
              activeTab === "inventory"
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                : "text-muted-foreground hover:text-foreground hover:bg-card/70 border border-transparent"
            )}
          >
            <Boxes className="w-4 h-4" />
            <span>Stock & Inventory</span>
            <span
              className={cn(
                "px-2 py-0.5 rounded-full text-xs font-bold",
                activeTab === "inventory"
                  ? "bg-white/20 text-white"
                  : soldOutCount > 0
                  ? "bg-destructive/15 text-destructive font-bold"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {soldOutCount > 0 ? `${soldOutCount} Sold Out` : `${totalProductsCount} Products`}
            </span>
          </button>
        </div>

        {/* ========================================================= */}
        {/* TAB 1: ORDERS MANAGEMENT                                   */}
        {/* ========================================================= */}
        {activeTab === "orders" && (
          <div>
            {loading ? (
              <div className="py-16 text-center text-muted-foreground">
                <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto mb-3" />
                <p>Loading orders…</p>
              </div>
            ) : visible.length === 0 ? (
              <div className="bg-card border border-border/50 rounded-2xl p-12 text-center text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-40 text-primary" />
                <p className="font-semibold text-foreground">No orders in this view</p>
                <p className="text-xs mt-1">Orders placed by customers will appear here automatically.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {visible.map((o) => (
                  <motion.div
                    key={o.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                      <div>
                        <p className="text-sm font-bold text-foreground">Order #{o.id.slice(0, 8)}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(o.created_at), "PPp")}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${STATUS_STYLE[o.status]}`}>
                        {STATUS_LABEL[o.status]}
                      </span>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 mb-4 text-sm">
                      <div>
                        <p className="font-semibold text-foreground">{o.customer_name}</p>
                        <a href={`tel:${o.customer_phone}`} className="text-primary hover:underline font-medium">
                          {o.customer_phone}
                        </a>
                        <p className="text-muted-foreground mt-1 leading-relaxed">{o.delivery_address}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          📍 {o.delivery_distance_km.toFixed(2)} km from store
                        </p>
                      </div>
                      <div>
                        <div className="space-y-1.5">
                          {o.order_items.map((it, idx) => (
                            <div key={idx} className="flex justify-between text-xs sm:text-sm">
                              <span className="text-muted-foreground">
                                {it.product_name} × {it.quantity}
                              </span>
                              <span className="font-medium">
                                {it.line_total_inr === 0 ? (
                                  <>
                                    <span className="line-through text-xs text-muted-foreground mr-1.5 font-normal">
                                      ₹300.00
                                    </span>
                                    <span className="text-primary font-bold">FREE</span>
                                  </>
                                ) : (
                                  `₹${it.line_total_inr.toFixed(2)}`
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-between font-display text-lg pt-2 border-t border-border/50 mt-3">
                          <span className="font-bold text-foreground">Total</span>
                          <span className="text-gradient font-black">₹{o.total_inr.toFixed(2)}</span>
                        </div>
                        {o.upi_reference && (
                          o.upi_reference.startsWith("data:image/") ? (
                            <div className="mt-2 space-y-1 text-left">
                              <span className="text-xs text-muted-foreground block font-medium">
                                Payment Screenshot:
                              </span>
                              <a href={o.upi_reference} target="_blank" rel="noopener noreferrer" className="inline-block">
                                <img
                                  src={o.upi_reference}
                                  alt="Payment Screenshot"
                                  className="max-w-[180px] max-h-[140px] border border-border/50 rounded-xl object-contain hover:scale-105 transition-transform duration-300"
                                />
                              </a>
                            </div>
                          ) : o.upi_reference.startsWith("pay_") ? (
                            <p className="text-xs text-muted-foreground mt-1 font-semibold text-primary">
                              Razorpay ID: {o.upi_reference}
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground mt-1">UPI Ref: {o.upi_reference}</p>
                          )
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/50 pt-4">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-sm text-muted-foreground">Update status:</span>
                        <div className="min-w-[200px]">
                          <Select value={o.status} onValueChange={(v) => updateStatus(o.id, v as OrderStatus)}>
                            <SelectTrigger className="bg-background border-border/60 rounded-xl">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-border">
                              {ADMIN_ORDER_STATUSES.map((s) => (
                                <SelectItem key={s} value={s}>
                                  {STATUS_LABEL[s]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        className="border-[#25D366]/40 hover:bg-[#25D366]/10 text-foreground flex items-center gap-2 rounded-xl"
                        onClick={() => {
                          const msg = buildCustomerStatusMessage(o.customer_name, o.id, STATUS_LABEL[o.status]);
                          const link = customerWhatsappLink(o.customer_phone, msg);
                          window.open(link, "_blank", "noopener");
                        }}
                      >
                        <MessageSquare className="w-4 h-4 text-[#25D366]" />
                        Chat with Buyer on WhatsApp
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: STOCK & INVENTORY MANAGEMENT                        */}
        {/* ========================================================= */}
        {activeTab === "inventory" && (
          <div className="space-y-6">
            {/* Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-card border border-border/60 rounded-2xl p-4 sm:p-5 shadow-xs flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Boxes className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Products</p>
                  <p className="font-display text-2xl sm:text-3xl font-black text-foreground">{totalProductsCount}</p>
                </div>
              </div>

              <div className="bg-card border border-border/60 rounded-2xl p-4 sm:p-5 shadow-xs flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">In Stock</p>
                  <p className="font-display text-2xl sm:text-3xl font-black text-emerald-500">{inStockCount}</p>
                </div>
              </div>

              <div className="bg-card border border-border/60 rounded-2xl p-4 sm:p-5 shadow-xs flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Low Stock (&le;3)</p>
                  <p className="font-display text-2xl sm:text-3xl font-black text-amber-500">{lowStockCount}</p>
                </div>
              </div>

              <div className="bg-card border border-border/60 rounded-2xl p-4 sm:p-5 shadow-xs flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
                  <XCircle className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Sold Out</p>
                  <p className="font-display text-2xl sm:text-3xl font-black text-destructive">{soldOutCount}</p>
                </div>
              </div>
            </div>

            {/* Filter & Search Toolbar */}
            <div className="bg-card border border-border/60 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
              <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search products by name, slug, or category…"
                    value={inventorySearch}
                    onChange={(e) => setInventorySearch(e.target.value)}
                    className="pl-10 bg-background border-border/70 rounded-xl"
                  />
                  {inventorySearch && (
                    <button
                      onClick={() => setInventorySearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Filters */}
                <div className="flex flex-wrap sm:flex-nowrap gap-2.5">
                  <div className="w-full sm:w-[190px]">
                    <Select value={inventoryCategory} onValueChange={setInventoryCategory}>
                      <SelectTrigger className="bg-background border-border/70 rounded-xl">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {Object.entries(CATEGORY_LABELS).map(([k, label]) => (
                          <SelectItem key={k} value={k}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="w-full sm:w-[170px]">
                    <Select value={inventoryStatus} onValueChange={(v) => setInventoryStatus(v as any)}>
                      <SelectTrigger className="bg-background border-border/70 rounded-xl">
                        <SelectValue placeholder="Stock Status" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="in_stock">In Stock (&gt;3)</SelectItem>
                        <SelectItem value="low_stock">Low Stock (&le;3)</SelectItem>
                        <SelectItem value="sold_out">Sold Out (0)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    variant="outline"
                    onClick={handleRefreshInventory}
                    disabled={isRefreshingInventory}
                    className="rounded-xl shrink-0 gap-2 border-border/70 hover:border-primary/50 text-foreground"
                    title="Re-fetch latest numbers from Supabase"
                  >
                    <RefreshCw className={cn("w-4 h-4 text-primary", isRefreshingInventory && "animate-spin")} />
                    <span className="hidden sm:inline">Refresh</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* Product List */}
            {filteredProducts.length === 0 ? (
              <div className="bg-card border border-border/50 rounded-2xl p-12 text-center text-muted-foreground">
                <Boxes className="w-12 h-12 mx-auto mb-3 opacity-40 text-primary" />
                <p className="font-semibold text-foreground">No matching products found</p>
                <p className="text-xs mt-1">Try resetting the search query or category filters.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredProducts.map((product) => {
                  const { initial, sold, available, isOut } = getProductStock(product.slug);
                  const isSaving = savingSlug === product.slug;
                  // If admin typed in the field, show that; otherwise show current available stock
                  const currentValue = stockEdits[product.slug] !== undefined ? stockEdits[product.slug] : available;
                  const isDirty = stockEdits[product.slug] !== undefined && stockEdits[product.slug] !== available;

                  return (
                    <motion.div
                      key={product.slug}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "bg-card border rounded-2xl p-4 sm:p-5 transition-all shadow-xs",
                        isOut
                          ? "border-destructive/30 bg-destructive/5"
                          : available <= 3
                          ? "border-amber-500/30 bg-amber-500/5"
                          : "border-border/60"
                      )}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                        {/* Left: Product Info */}
                        <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-background border border-border/60 shrink-0 p-1 flex items-center justify-center">
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-full h-full object-contain hover:scale-110 transition-transform duration-300"
                              loading="lazy"
                            />
                            {isOut && (
                              <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px] flex items-center justify-center">
                                <span className="text-[9px] font-black uppercase tracking-wider text-destructive bg-black/80 px-1.5 py-0.5 rounded border border-destructive/50">
                                  Out
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-foreground text-base sm:text-lg">{product.name}</span>
                              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 uppercase tracking-wide">
                                {CATEGORY_LABELS[product.category] || product.category}
                              </span>
                            </div>

                            <p className="text-xs text-muted-foreground">{product.tagline}</p>

                            <div className="flex items-center gap-3 text-xs pt-1 flex-wrap">
                              <span className="font-semibold text-foreground">₹{product.price} MRP</span>
                              <span className="text-muted-foreground/60">•</span>
                              <span className="text-muted-foreground font-mono text-[11px]">slug: {product.slug}</span>
                            </div>
                          </div>
                        </div>

                        {/* Center: Current Stock Status Pill & Sold Counter */}
                        <div className="flex flex-wrap items-center gap-4 lg:gap-6 py-2 border-y lg:border-y-0 lg:border-x border-border/40 lg:px-6">
                          <div>
                            <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider mb-1">
                              Status
                            </p>
                            {isOut ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-destructive/15 text-destructive border border-destructive/30 text-xs font-bold">
                                <XCircle className="w-3.5 h-3.5" /> Sold Out
                              </span>
                            ) : available <= 3 ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-500 border border-amber-500/30 text-xs font-bold">
                                <AlertTriangle className="w-3.5 h-3.5" /> Low Stock ({available})
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 text-xs font-bold">
                                <CheckCircle2 className="w-3.5 h-3.5" /> In Stock ({available})
                              </span>
                            )}
                          </div>

                          <div>
                            <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider mb-1">
                              Units Sold
                            </p>
                            <span className="text-xs font-mono font-bold text-foreground">
                              {sold} units
                            </span>
                          </div>

                          <div>
                            <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider mb-1">
                              Batch Initial
                            </p>
                            <span className="text-xs font-mono text-muted-foreground">
                              {initial} units
                            </span>
                          </div>
                        </div>

                        {/* Right: Interactive Stock Update Controls */}
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 lg:justify-end">
                          {/* Stepper + Input */}
                          <div className="flex items-center bg-background border border-border/80 rounded-xl p-1 shadow-xs">
                            <button
                              type="button"
                              onClick={() => {
                                const next = Math.max(0, currentValue - 1);
                                setStockEdits((prev) => ({ ...prev, [product.slug]: next }));
                              }}
                              disabled={isSaving || currentValue <= 0}
                              className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-lg transition-colors disabled:opacity-40 disabled:pointer-events-none"
                              title="Decrease by 1"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>

                            <input
                              type="number"
                              min="0"
                              value={currentValue}
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10);
                                setStockEdits((prev) => ({
                                  ...prev,
                                  [product.slug]: isNaN(val) ? 0 : Math.max(0, val),
                                }));
                              }}
                              disabled={isSaving}
                              className="w-14 text-center font-mono font-bold text-sm bg-transparent outline-none border-none text-foreground"
                            />

                            <button
                              type="button"
                              onClick={() => {
                                const next = currentValue + 1;
                                setStockEdits((prev) => ({ ...prev, [product.slug]: next }));
                              }}
                              disabled={isSaving}
                              className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-lg transition-colors disabled:opacity-40 disabled:pointer-events-none"
                              title="Increase by 1"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Quick Restock Buttons */}
                          <div className="flex items-center gap-1.5">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleQuickAdd(product.slug, 5)}
                              disabled={isSaving}
                              className="h-9 px-2.5 text-xs rounded-xl border-border/70 hover:border-primary/50 text-foreground"
                              title="Quickly add 5 units and save"
                            >
                              +5
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleQuickAdd(product.slug, 10)}
                              disabled={isSaving}
                              className="h-9 px-2.5 text-xs rounded-xl border-border/70 hover:border-primary/50 text-foreground"
                              title="Quickly add 10 units and save"
                            >
                              +10
                            </Button>
                          </div>

                          {/* Save Changes Button */}
                          <Button
                            type="button"
                            size="sm"
                            disabled={isSaving || !isDirty}
                            onClick={() => handleSaveStock(product.slug, currentValue)}
                            className={cn(
                              "h-9 px-3.5 rounded-xl font-bold text-xs gap-1.5 transition-all shadow-xs",
                              isDirty
                                ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/20 cursor-pointer"
                                : "bg-muted text-muted-foreground cursor-not-allowed"
                            )}
                          >
                            {isSaving ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            )}
                            Save
                          </Button>

                          {/* One-Click Sold Out / Restock Toggle */}
                          {available > 0 ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleMarkSoldOut(product.slug)}
                              disabled={isSaving}
                              className="h-9 px-3 text-xs rounded-xl border-destructive/40 text-destructive hover:bg-destructive/10 shrink-0 cursor-pointer"
                              title="Set available stock to 0 immediately"
                            >
                              Mark Sold Out
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleSaveStock(product.slug, 10)}
                              disabled={isSaving}
                              className="h-9 px-3 text-xs rounded-xl border-emerald-500/40 text-emerald-500 hover:bg-emerald-500/10 shrink-0 cursor-pointer"
                              title="Instantly restock with 10 units"
                            >
                              Restock (+10)
                            </Button>
                          )}

                          {/* Reset Sold Counter (starts new production batch) */}
                          {sold > 0 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSaveStock(product.slug, available, true)}
                              disabled={isSaving}
                              className="h-9 px-2 text-xs text-muted-foreground hover:text-foreground rounded-xl shrink-0 cursor-pointer"
                              title="Reset historical sold counter to 0 for a fresh batch cycle"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

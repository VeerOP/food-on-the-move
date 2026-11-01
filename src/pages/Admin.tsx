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
  Image as ImageIcon,
  Ticket,
  Tag,
  Percent,
  Truck,
  Edit2,
  Trash2,
  Copy,
  Check,
  Power,
  ShieldCheck,
  Gift,
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
import { CATALOG, CatalogProduct } from "@/lib/catalog";
import { useInventory, updateProductStock } from "@/lib/inventory";
import { useCoupons, Coupon } from "@/lib/coupons";
import { ManagePicturesModal } from "@/components/ManagePicturesModal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  cookies: "Cookies",
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
  const [activeTab, setActiveTab] = useState<"orders" | "inventory" | "coupons">("orders");

  // Orders State
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<OrderStatus | "all">("all");

  // Inventory State
  const { inventory, refreshInventory, getMRP, updateMRP, getImages, getMainImage } = useInventory();
  const [stockEdits, setStockEdits] = useState<Record<string, number>>({});
  const [mrpEdits, setMrpEdits] = useState<Record<string, number>>({});
  const [savingSlug, setSavingSlug] = useState<string | null>(null);
  const [savingMrpSlug, setSavingMrpSlug] = useState<string | null>(null);
  const [inventorySearch, setInventorySearch] = useState("");
  const [inventoryCategory, setInventoryCategory] = useState<string>("all");
  const [inventoryStatus, setInventoryStatus] = useState<"all" | "in_stock" | "low_stock" | "sold_out">("all");
  const [isRefreshingInventory, setIsRefreshingInventory] = useState(false);
  const [selectedProductForImages, setSelectedProductForImages] = useState<CatalogProduct | null>(null);

  // Coupons State & Hook
  const {
    coupons,
    loading: couponsLoading,
    refresh: refreshCoupons,
    addCoupon,
    updateCoupon,
    updateAvailableCount,
    deleteCoupon,
    isSupabaseOnline,
    isFreeBottleActive,
    toggleFreeBottleOffer,
    toggleCouponBottleAllowance,
  } = useCoupons();

  const [couponSearch, setCouponSearch] = useState("");
  const [couponFilter, setCouponFilter] = useState<string>("all");
  const [copiedCouponCode, setCopiedCouponCode] = useState<string | null>(null);
  const [quotaEdits, setQuotaEdits] = useState<Record<string, number>>({});
  const [savingQuotaId, setSavingQuotaId] = useState<string | null>(null);
  const [savingBottleId, setSavingBottleId] = useState<string | null>(null);
  const [isRefreshingCoupons, setIsRefreshingCoupons] = useState(false);
  const [isTogglingFreeBottle, setIsTogglingFreeBottle] = useState(false);

  const handleToggleFreeBottleOffer = async (checked: boolean) => {
    setIsTogglingFreeBottle(true);
    try {
      const ok = await toggleFreeBottleOffer(checked);
      if (ok) {
        toast.success(
          checked
            ? "Free Bottle Offer & Coupon (FREEBOTTLE) enabled!"
            : "Free Bottle Offer & Coupon (FREEBOTTLE) disabled."
        );
      } else {
        toast.error("Failed to update Free Bottle status");
      }
    } catch (e) {
      toast.error("Error updating Free Bottle status");
    } finally {
      setIsTogglingFreeBottle(false);
    }
  };

  const handleToggleCouponBottleAllowance = async (coupon: Coupon, nextAllowed: boolean) => {
    setSavingBottleId(coupon.id);
    const res = await toggleCouponBottleAllowance(coupon.id, nextAllowed);
    setSavingBottleId(null);
    if (res.success) {
      toast.success(
        nextAllowed
          ? `Coupon ${coupon.code} now allows Free Bottle on ₹1,200+ (after discount)!`
          : `Coupon ${coupon.code} now excludes Free Bottle.`
      );
    } else {
      toast.error(res.error || "Failed to update Free Bottle setting for coupon");
    }
  };

  // Add Coupon Dialog
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCouponCode, setNewCouponCode] = useState("");
  const [newDiscountPercent, setNewDiscountPercent] = useState<number>(25);
  const [newIsFreeDelivery, setNewIsFreeDelivery] = useState(false);
  const [newTotalCoupons, setNewTotalCoupons] = useState<number>(100);
  const [newAvailableCoupons, setNewAvailableCoupons] = useState<number>(100);
  const [newMinOrder, setNewMinOrder] = useState<number>(0);
  const [newDescription, setNewDescription] = useState("");
  const [newIsActive, setNewIsActive] = useState(true);
  const [newAllowFreeBottle, setNewAllowFreeBottle] = useState(true);
  const [isSubmittingNewCoupon, setIsSubmittingNewCoupon] = useState(false);

  // Edit Coupon Dialog
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [editCode, setEditCode] = useState("");
  const [editDiscountPercent, setEditDiscountPercent] = useState<number>(25);
  const [editIsFreeDelivery, setEditIsFreeDelivery] = useState(false);
  const [editTotalCoupons, setEditTotalCoupons] = useState<number>(100);
  const [editAvailableCoupons, setEditAvailableCoupons] = useState<number>(100);
  const [editMinOrder, setEditMinOrder] = useState<number>(0);
  const [editDescription, setEditDescription] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);
  const [editAllowFreeBottle, setEditAllowFreeBottle] = useState(true);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Delete Confirm Dialog
  const [deletingCoupon, setDeletingCoupon] = useState<Coupon | null>(null);
  const [isDeletingCoupon, setIsDeletingCoupon] = useState(false);

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

  const handleSaveMRP = async (slug: string, targetMRP: number) => {
    setSavingMrpSlug(slug);
    const prod = CATALOG[slug];
    const newPrice = Math.max(1, Math.round(targetMRP));

    const res = await updateMRP(slug, newPrice);
    if (res.success) {
      toast.success(`MRP updated for ${prod?.name || slug}: ₹${newPrice}`);
      setMrpEdits((prev) => {
        const next = { ...prev };
        delete next[slug];
        return next;
      });
    } else {
      toast.error(res.error || "Failed to update MRP in Supabase");
    }
    setSavingMrpSlug(null);
  };

  const handleRefreshInventory = async () => {
    setIsRefreshingInventory(true);
    await refreshInventory();
    toast.success("Stock details refreshed from Supabase");
    setIsRefreshingInventory(false);
  };

  // Coupon Helpers & Calculations
  const handleRefreshCoupons = async () => {
    setIsRefreshingCoupons(true);
    await refreshCoupons();
    toast.success("Coupons refreshed from database");
    setIsRefreshingCoupons(false);
  };

  const handleCopyCouponCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCouponCode(code);
    toast.success(`Coupon code ${code} copied!`);
    setTimeout(() => {
      setCopiedCouponCode((prev) => (prev === code ? null : prev));
    }, 2000);
  };

  const handleOpenAddModal = () => {
    setNewCouponCode("");
    setNewDiscountPercent(25);
    setNewIsFreeDelivery(false);
    setNewTotalCoupons(100);
    setNewAvailableCoupons(100);
    setNewMinOrder(0);
    setNewDescription("25% OFF on your entire order");
    setNewIsActive(true);
    setNewAllowFreeBottle(true);
    setIsAddModalOpen(true);
  };

  const handleCreateNewCoupon = async () => {
    if (!newCouponCode.trim()) {
      toast.error("Please provide a valid coupon code");
      return;
    }
    setIsSubmittingNewCoupon(true);
    const res = await addCoupon({
      code: newCouponCode,
      discount_percent: newDiscountPercent,
      is_free_delivery: newIsFreeDelivery,
      total_coupons: newTotalCoupons,
      available_coupons: newAvailableCoupons,
      min_order_amount: newMinOrder,
      description: newDescription,
      is_active: newIsActive,
      allow_free_bottle: newAllowFreeBottle,
    });
    setIsSubmittingNewCoupon(false);

    if (res.success) {
      toast.success(`Coupon ${res.coupon?.code} created successfully!`);
      setIsAddModalOpen(false);
    } else {
      toast.error(res.error || "Failed to create coupon");
    }
  };

  const handleOpenEditModal = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setEditCode(coupon.code);
    setEditDiscountPercent(coupon.discount_percent);
    setEditIsFreeDelivery(coupon.is_free_delivery);
    setEditTotalCoupons(coupon.total_coupons);
    setEditAvailableCoupons(coupon.available_coupons);
    setEditMinOrder(coupon.min_order_amount);
    setEditDescription(coupon.description || "");
    setEditIsActive(coupon.is_active);
    setEditAllowFreeBottle(coupon.allow_free_bottle !== false);
  };

  const handleSaveEditCoupon = async () => {
    if (!editingCoupon) return;
    if (!editCode.trim()) {
      toast.error("Coupon code cannot be empty");
      return;
    }
    setIsSubmittingEdit(true);
    const res = await updateCoupon(editingCoupon.id, {
      code: editCode,
      discount_percent: editDiscountPercent,
      is_free_delivery: editIsFreeDelivery,
      total_coupons: editTotalCoupons,
      available_coupons: editAvailableCoupons,
      min_order_amount: editMinOrder,
      description: editDescription,
      is_active: editIsActive,
      allow_free_bottle: editAllowFreeBottle,
    });
    setIsSubmittingEdit(false);

    if (res.success) {
      if (editingCoupon.code.toUpperCase() === "FREEBOTTLE" || editCode.toUpperCase() === "FREEBOTTLE") {
        void toggleFreeBottleOffer(editIsActive);
      }
      toast.success(`Coupon ${editCode.toUpperCase()} updated successfully!`);
      setEditingCoupon(null);
    } else {
      toast.error(res.error || "Failed to update coupon");
    }
  };

  const handleConfirmDeleteCoupon = async () => {
    if (!deletingCoupon) return;
    setIsDeletingCoupon(true);
    const res = await deleteCoupon(deletingCoupon.id);
    setIsDeletingCoupon(false);
    if (res.success) {
      toast.success(`Coupon ${deletingCoupon.code} removed`);
      setDeletingCoupon(null);
    } else {
      toast.error(res.error || "Failed to remove coupon");
    }
  };

  const handleToggleCouponStatus = async (coupon: Coupon) => {
    const nextStatus = !coupon.is_active;
    if (coupon.code.toUpperCase() === "FREEBOTTLE") {
      await handleToggleFreeBottleOffer(nextStatus);
      return;
    }
    const res = await updateCoupon(coupon.id, { is_active: nextStatus });
    if (res.success) {
      toast.success(`Coupon ${coupon.code} marked ${nextStatus ? "Active" : "Inactive"}`);
    } else {
      toast.error(res.error || "Failed to update coupon status");
    }
  };

  const handleQuickAdjustQuota = async (coupon: Coupon, delta: number) => {
    const current = quotaEdits[coupon.id] !== undefined ? quotaEdits[coupon.id] : coupon.available_coupons;
    const target = Math.max(0, current + delta);
    setQuotaEdits((prev) => ({ ...prev, [coupon.id]: target }));
    setSavingQuotaId(coupon.id);
    const res = await updateAvailableCount(coupon.id, target);
    setSavingQuotaId(null);
    if (res.success) {
      toast.success(`Updated ${coupon.code} available quota to ${target}`);
      setQuotaEdits((prev) => {
        const next = { ...prev };
        delete next[coupon.id];
        return next;
      });
    } else {
      toast.error(res.error || "Failed to update quota");
    }
  };

  const handleSaveQuotaInput = async (coupon: Coupon) => {
    const target = quotaEdits[coupon.id];
    if (target === undefined) return;
    setSavingQuotaId(coupon.id);
    const res = await updateAvailableCount(coupon.id, target);
    setSavingQuotaId(null);
    if (res.success) {
      toast.success(`Updated ${coupon.code} available quota to ${target}`);
      setQuotaEdits((prev) => {
        const next = { ...prev };
        delete next[coupon.id];
        return next;
      });
    } else {
      toast.error(res.error || "Failed to update quota");
    }
  };

  // Filtered coupons
  const filteredCoupons = coupons.filter((c) => {
    if (couponSearch.trim()) {
      const q = couponSearch.toLowerCase();
      const matchCode = c.code.toLowerCase().includes(q);
      const matchDesc = (c.description || "").toLowerCase().includes(q);
      if (!matchCode && !matchDesc) return false;
    }

    if (couponFilter === "active" && (!c.is_active || c.available_coupons <= 0)) return false;
    if (couponFilter === "inactive" && c.is_active) return false;
    if (couponFilter === "free_delivery" && !c.is_free_delivery) return false;
    if (couponFilter === "depleted" && c.available_coupons > 0) return false;
    if (couponFilter === "25_off" && c.discount_percent !== 25) return false;
    if (couponFilter === "35_off" && c.discount_percent !== 35) return false;
    if (couponFilter === "bottle_allowed" && c.allow_free_bottle === false) return false;
    if (couponFilter === "bottle_disallowed" && c.allow_free_bottle !== false) return false;

    return true;
  });

  const totalActiveCoupons = coupons.filter((c) => c.is_active && c.available_coupons > 0).length;
  const totalCouponsCount = coupons.length;
  const totalUsedCount = coupons.reduce((acc, c) => acc + (c.used_count || 0), 0);
  const totalAvailableQuota = coupons.reduce((acc, c) => acc + (c.available_coupons || 0), 0);
  const freeDeliveryCount = coupons.filter((c) => c.is_free_delivery).length;

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

          <button
            onClick={() => setActiveTab("coupons")}
            className={cn(
              "flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer",
              activeTab === "coupons"
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                : "text-muted-foreground hover:text-foreground hover:bg-card/70 border border-transparent"
            )}
          >
            <Ticket className="w-4 h-4" />
            <span>Coupons & Discounts</span>
            <span
              className={cn(
                "px-2 py-0.5 rounded-full text-xs font-bold",
                activeTab === "coupons"
                  ? "bg-white/20 text-white"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {totalActiveCoupons} Active
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

                  const currentEffectiveMrp = getMRP(product.slug);
                  const currentMrp = mrpEdits[product.slug] !== undefined ? mrpEdits[product.slug] : currentEffectiveMrp;
                  const isMrpDirty = mrpEdits[product.slug] !== undefined && mrpEdits[product.slug] !== currentEffectiveMrp;
                  const isSavingMrp = savingMrpSlug === product.slug;

                  const displayImage = (getMainImage ? getMainImage(product.slug) : null) || product.image;
                  const productImages = getImages ? getImages(product.slug) : [product.image];
                  const hasCustomPhotos = Array.isArray(inventory[product.slug]?.images) && (inventory[product.slug]?.images?.length ?? 0) > 0;

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
                          <div
                            onClick={() => setSelectedProductForImages(product)}
                            className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-background border border-border/60 shrink-0 p-1 flex items-center justify-center cursor-pointer group/img"
                            title="Click to add or remove product pictures"
                          >
                            <img
                              src={displayImage}
                              alt={product.name}
                              className="w-full h-full object-contain group-hover/img:scale-110 transition-transform duration-300"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                              <ImageIcon className="w-5 h-5 text-white" />
                            </div>
                            <span className="absolute bottom-1 right-1 bg-black/70 text-white font-mono text-[9px] px-1.5 py-0.5 rounded backdrop-blur-xs">
                              {productImages.length}
                            </span>
                          </div>

                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-foreground text-base sm:text-lg">{product.name}</span>
                              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 uppercase tracking-wide">
                                {CATEGORY_LABELS[product.category] || product.category}
                              </span>
                            </div>

                            <p className="text-xs text-muted-foreground">{product.tagline}</p>

                            <div className="flex items-center gap-2.5 text-xs pt-1.5 flex-wrap">
                              {/* Manage Pictures Button */}
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedProductForImages(product)}
                                className="h-7 px-2.5 rounded-lg text-xs font-semibold border-border/80 hover:bg-primary/10 hover:text-primary shadow-xs cursor-pointer gap-1.5"
                                title="Add or remove product pictures"
                              >
                                <ImageIcon className="w-3.5 h-3.5 text-primary" />
                                <span>Pictures ({productImages.length})</span>
                                {hasCustomPhotos && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" title="Custom photos active" />
                                )}
                              </Button>

                              {/* Inline MRP edit control */}
                              <div className="flex items-center bg-background border border-border/80 rounded-xl px-2.5 py-1 shadow-xs">
                                <span className="text-xs text-muted-foreground font-semibold mr-1">MRP: ₹</span>
                                <input
                                  type="number"
                                  min="1"
                                  value={currentMrp}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value, 10);
                                    setMrpEdits((prev) => ({
                                      ...prev,
                                      [product.slug]: isNaN(val) ? 0 : Math.max(0, val),
                                    }));
                                  }}
                                  disabled={isSavingMrp}
                                  className="w-16 text-center font-mono font-bold text-xs bg-transparent outline-none border-none text-foreground"
                                  title="Edit product MRP"
                                />
                              </div>

                              {isMrpDirty && (
                                <Button
                                  type="button"
                                  size="sm"
                                  disabled={isSavingMrp}
                                  onClick={() => handleSaveMRP(product.slug, currentMrp)}
                                  className="h-7 px-2.5 rounded-lg text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs cursor-pointer gap-1"
                                >
                                  {isSavingMrp ? (
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <CheckCircle2 className="w-3 h-3" />
                                  )}
                                  Save MRP
                                </Button>
                              )}

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
        {/* ========================================================= */}
        {/* TAB 3: COUPONS & DISCOUNTS MANAGEMENT                      */}
        {/* ========================================================= */}
        {activeTab === "coupons" && (
          <div className="space-y-8 animate-fade-in">
            {/* Supabase Status Banner */}
            <div
              className={cn(
                "p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs",
                isSupabaseOnline
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
                  : "bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300"
              )}
            >
              <div className="flex items-center gap-2.5">
                <ShieldCheck className={cn("w-5 h-5 shrink-0", isSupabaseOnline ? "text-emerald-600" : "text-amber-600")} />
                <div>
                  <p className="font-semibold text-sm">
                    {isSupabaseOnline ? "Live Supabase Database Sync Active" : "Local Storage Engine (Active & Ready)"}
                  </p>
                  <p className="opacity-90">
                    {isSupabaseOnline
                      ? "Coupons are synced with PostgreSQL in real-time. Whenever a customer pays, availability decrements automatically."
                      : "Coupons are stored in local storage cache and fully operational. For cloud sync, run the SQL script in your Supabase Editor."}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRefreshCoupons}
                  disabled={isRefreshingCoupons}
                  className="rounded-xl h-8 text-xs gap-1.5 cursor-pointer"
                >
                  <RefreshCw className={cn("w-3.5 h-3.5", isRefreshingCoupons && "animate-spin")} />
                  Refresh
                </Button>
              </div>
            </div>

            {/* 4 Stat Overview Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-card border border-border/60 rounded-2xl p-4 sm:p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Coupons</span>
                  <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-600">
                    <Ticket className="w-4 h-4" />
                  </div>
                </div>
                <div className="font-display text-2xl sm:text-3xl font-black text-foreground">
                  {totalActiveCoupons}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  out of {totalCouponsCount} configured codes
                </p>
              </div>

              <div className="bg-card border border-border/60 rounded-2xl p-4 sm:p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Usages</span>
                  <div className="p-2 rounded-xl bg-primary/15 text-primary">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="font-display text-2xl sm:text-3xl font-black text-foreground">
                  {totalUsedCount}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  redeemed on paid customer orders
                </p>
              </div>

              <div className="bg-card border border-border/60 rounded-2xl p-4 sm:p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Available</span>
                  <div className="p-2 rounded-xl bg-blue-500/15 text-blue-600">
                    <Boxes className="w-4 h-4" />
                  </div>
                </div>
                <div className="font-display text-2xl sm:text-3xl font-black text-foreground">
                  {totalAvailableQuota}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  total coupons left for customers
                </p>
              </div>

              <div className="bg-card border border-border/60 rounded-2xl p-4 sm:p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Special Offers</span>
                  <div className="p-2 rounded-xl bg-amber-500/15 text-amber-600">
                    <Percent className="w-4 h-4" />
                  </div>
                </div>
                <div className="font-display text-2xl sm:text-3xl font-black text-foreground">
                  25% & 35%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {freeDeliveryCount} include Free Delivery
                </p>
              </div>
            </div>

            {/* Free Bottle Promotion Quick Control Banner */}
            <div className="bg-gradient-to-r from-amber-500/10 via-primary/10 to-amber-500/10 border-2 border-primary/30 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-primary text-white flex items-center justify-center shrink-0 shadow-md">
                  <Gift className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-display font-bold text-lg text-foreground">
                      Free Stainless Steel Bottle Promotion
                    </h3>
                    <Badge
                      className={cn(
                        "text-xs font-semibold px-2.5 py-0.5",
                        isFreeBottleActive
                          ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30"
                          : "bg-muted text-muted-foreground border-border"
                      )}
                    >
                      {isFreeBottleActive ? "Active Across Website & Cart" : "Offer Disabled"}
                    </Badge>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                    Controls the auto-gift steel bottle (₹300 value) on orders above ₹1,200, the homepage promo section, the interactive offer popup, and the <span className="font-mono font-semibold text-foreground">FREEBOTTLE</span> coupon.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end md:self-center shrink-0 bg-background/90 px-4 py-2.5 rounded-xl border border-border shadow-sm">
                <span className="text-xs sm:text-sm font-semibold text-foreground">
                  {isFreeBottleActive ? "Promotion Enabled" : "Promotion Disabled"}
                </span>
                <Switch
                  checked={isFreeBottleActive}
                  disabled={isTogglingFreeBottle}
                  onCheckedChange={handleToggleFreeBottleOffer}
                  className="data-[state=checked]:bg-emerald-500"
                />
              </div>
            </div>

            {/* Filter and Action Bar */}
            <div className="bg-card border border-border/60 rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by code (e.g. SAVE25, FOMO35) or description..."
                    value={couponSearch}
                    onChange={(e) => setCouponSearch(e.target.value)}
                    className="pl-9 bg-background/50 rounded-xl"
                  />
                </div>
                <div className="min-w-[180px]">
                  <Select value={couponFilter} onValueChange={setCouponFilter}>
                    <SelectTrigger className="bg-background/50 border-border rounded-xl">
                      <SelectValue placeholder="Filter coupons" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="all">All Coupons ({coupons.length})</SelectItem>
                      <SelectItem value="active">Active & Available ({totalActiveCoupons})</SelectItem>
                      <SelectItem value="25_off">25% Off Only ({coupons.filter((c) => c.discount_percent === 25).length})</SelectItem>
                      <SelectItem value="35_off">35% Off Only ({coupons.filter((c) => c.discount_percent === 35).length})</SelectItem>
                      <SelectItem value="free_delivery">Free Delivery ({freeDeliveryCount})</SelectItem>
                      <SelectItem value="bottle_allowed">Free Bottle Allowed ({coupons.filter((c) => c.allow_free_bottle !== false).length})</SelectItem>
                      <SelectItem value="bottle_disallowed">Free Bottle Excluded ({coupons.filter((c) => c.allow_free_bottle === false).length})</SelectItem>
                      <SelectItem value="depleted">Depleted / 0 Left ({coupons.filter((c) => c.available_coupons <= 0).length})</SelectItem>
                      <SelectItem value="inactive">Inactive / Disabled ({coupons.filter((c) => !c.is_active).length})</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <Button
                  onClick={handleOpenAddModal}
                  className="rounded-xl font-bold gap-2 cursor-pointer shadow-md shadow-primary/20"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Coupon</span>
                </Button>
              </div>
            </div>

            {/* Coupons Cards / Grid */}
            {couponsLoading ? (
              <div className="py-16 text-center text-muted-foreground">
                <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto mb-3" />
                <p>Loading coupons…</p>
              </div>
            ) : filteredCoupons.length === 0 ? (
              <div className="bg-card border border-border/50 rounded-2xl p-12 text-center text-muted-foreground">
                <Ticket className="w-12 h-12 mx-auto mb-3 opacity-30 text-primary" />
                <p className="font-semibold text-foreground text-lg mb-1">No coupons found</p>
                <p className="text-sm text-muted-foreground mb-4">
                  {couponSearch || couponFilter !== "all"
                    ? "No coupons match your filter or search criteria."
                    : "No coupons created yet."}
                </p>
                <Button variant="outline" onClick={handleOpenAddModal} className="rounded-xl">
                  Create First Coupon
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredCoupons.map((coupon) => {
                  const isDepleted = coupon.available_coupons <= 0;
                  const isLow = coupon.available_coupons > 0 && coupon.available_coupons <= 5;
                  const usageRate =
                    coupon.total_coupons > 0
                      ? Math.min(100, Math.round((coupon.used_count / coupon.total_coupons) * 100))
                      : 0;

                  const currentInput =
                    quotaEdits[coupon.id] !== undefined ? quotaEdits[coupon.id] : coupon.available_coupons;
                  const isDirty = currentInput !== coupon.available_coupons;
                  const isSavingThis = savingQuotaId === coupon.id;

                  return (
                    <motion.div
                      key={coupon.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "bg-card border rounded-2xl p-5 flex flex-col justify-between gap-4 transition-all shadow-sm",
                        !coupon.is_active
                          ? "border-border/40 opacity-75 bg-card/60"
                          : isDepleted
                          ? "border-destructive/30"
                          : "border-border/70 hover:border-primary/40 hover:shadow-md"
                      )}
                    >
                      {/* Top Header */}
                      <div>
                        <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-black text-lg sm:text-xl text-primary tracking-wider bg-primary/10 px-3 py-1 rounded-xl border border-primary/20">
                              {coupon.code}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyCouponCode(coupon.code)}
                              className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                              title="Copy coupon code"
                            >
                              {copiedCouponCode === coupon.code ? (
                                <Check className="w-4 h-4 text-emerald-500" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                            <Badge
                              variant={coupon.is_active ? "default" : "outline"}
                              className={cn(
                                "text-xs font-semibold px-2 py-0.5",
                                coupon.is_active
                                  ? isDepleted
                                    ? "bg-destructive/15 text-destructive border-destructive/30"
                                    : "bg-emerald-500/15 text-emerald-600 border-emerald-500/30"
                                  : "text-muted-foreground"
                              )}
                            >
                              {!coupon.is_active
                                ? "Disabled"
                                : isDepleted
                                ? "Depleted (0 Left)"
                                : isLow
                                ? "Low Quota"
                                : "Active"}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-1.5 flex-wrap">
                            {coupon.discount_percent > 0 && (
                              <Badge className="bg-primary/15 text-primary border-primary/30 font-bold text-xs">
                                {coupon.discount_percent}% OFF
                              </Badge>
                            )}
                            {coupon.is_free_delivery ? (
                              <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 font-bold text-xs flex items-center gap-1">
                                <Truck className="w-3 h-3" />
                                Free Delivery
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-muted-foreground text-xs font-medium">
                                Standard Delivery
                              </Badge>
                            )}
                            {coupon.allow_free_bottle !== false ? (
                              <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30 font-bold text-xs flex items-center gap-1">
                                <Gift className="w-3 h-3" />
                                Bottle on ₹1.2k+
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-muted-foreground text-xs font-medium flex items-center gap-1">
                                <Gift className="w-3 h-3 opacity-50" />
                                No Bottle
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-xs sm:text-sm text-foreground/80 mt-1 line-clamp-2">
                          {coupon.description || "Custom discount coupon"}
                        </p>

                        {coupon.min_order_amount > 0 && (
                          <p className="text-[11px] text-muted-foreground mt-1">
                            Min. order amount: ₹{coupon.min_order_amount.toFixed(2)}
                          </p>
                        )}
                      </div>

                      {/* Usage & Available Quota Section */}
                      <div className="bg-background/60 rounded-xl p-3 border border-border/50 space-y-2.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground font-medium">Redemption Progress</span>
                          <span className="font-semibold text-foreground">
                            {coupon.used_count} used / {coupon.total_coupons} total limit ({usageRate}%)
                          </span>
                        </div>

                        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-300",
                              isDepleted
                                ? "bg-destructive"
                                : isLow
                                ? "bg-amber-500"
                                : "bg-primary"
                            )}
                            style={{ width: `${Math.min(100, Math.max(0, usageRate))}%` }}
                          />
                        </div>

                        {/* Available Quota Quick Edit */}
                        <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-medium text-muted-foreground">Available Quota:</span>
                            <span
                              className={cn(
                                "text-xs font-bold px-2 py-0.5 rounded-md",
                                isDepleted
                                  ? "bg-destructive/15 text-destructive"
                                  : isLow
                                  ? "bg-amber-500/15 text-amber-600"
                                  : "bg-emerald-500/15 text-emerald-600"
                              )}
                            >
                              {coupon.available_coupons} left
                            </span>
                          </div>

                          {/* Quick Adjust Buttons */}
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => handleQuickAdjustQuota(coupon, -10)}
                              disabled={isSavingThis || coupon.available_coupons <= 0}
                              className="h-7 px-2 text-xs rounded-lg cursor-pointer"
                              title="Decrease available by 10"
                            >
                              -10
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => handleQuickAdjustQuota(coupon, -1)}
                              disabled={isSavingThis || coupon.available_coupons <= 0}
                              className="h-7 w-7 p-0 text-xs rounded-lg cursor-pointer"
                              title="Decrease available by 1"
                            >
                              -1
                            </Button>

                            <Input
                              type="number"
                              min="0"
                              value={currentInput}
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10);
                                setQuotaEdits((prev) => ({
                                  ...prev,
                                  [coupon.id]: isNaN(val) ? 0 : Math.max(0, val),
                                }));
                              }}
                              className="w-16 h-7 text-xs text-center px-1 font-bold rounded-lg"
                            />

                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => handleQuickAdjustQuota(coupon, 1)}
                              disabled={isSavingThis}
                              className="h-7 w-7 p-0 text-xs rounded-lg cursor-pointer"
                              title="Increase available by 1"
                            >
                              +1
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => handleQuickAdjustQuota(coupon, 10)}
                              disabled={isSavingThis}
                              className="h-7 px-2 text-xs rounded-lg cursor-pointer"
                              title="Increase available by 10"
                            >
                              +10
                            </Button>

                            {isDirty && (
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => handleSaveQuotaInput(coupon)}
                                disabled={isSavingThis}
                                className="h-7 px-2.5 text-xs rounded-lg font-bold bg-primary text-primary-foreground gap-1 cursor-pointer"
                              >
                                {isSavingThis ? (
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Check className="w-3 h-3" />
                                )}
                                Save
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Free Bottle Allowance Toggle */}
                      <div className="flex items-center justify-between text-xs py-2 px-3 rounded-xl bg-background/60 border border-border/50">
                        <div className="flex items-center gap-2">
                          <Gift
                            className={cn(
                              "w-4 h-4 shrink-0",
                              coupon.allow_free_bottle !== false ? "text-amber-500" : "text-muted-foreground/50"
                            )}
                          />
                          <div className="flex flex-col text-left">
                            <span className="font-semibold text-foreground text-xs leading-none">
                              Free Bottle on ₹1,200+ (After Discount)
                            </span>
                            <span className="text-[10px] text-muted-foreground mt-0.5">
                              {coupon.allow_free_bottle !== false
                                ? "Allowed if cart stays ≥ ₹1,200 after applying this coupon"
                                : "Cannot be combined with Free Bottle offer"}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={cn(
                              "text-[11px] font-bold",
                              coupon.allow_free_bottle !== false ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"
                            )}
                          >
                            {coupon.allow_free_bottle !== false ? "Allowed" : "Excluded"}
                          </span>
                          <Switch
                            checked={coupon.allow_free_bottle !== false}
                            disabled={savingBottleId === coupon.id}
                            onCheckedChange={(checked) => handleToggleCouponBottleAllowance(coupon, checked)}
                            className="data-[state=checked]:bg-amber-500"
                          />
                        </div>
                      </div>

                      {/* Card Bottom Controls */}
                      <div className="flex items-center justify-between gap-3 pt-2 border-t border-border/40 flex-wrap">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={coupon.is_active}
                            onCheckedChange={() => handleToggleCouponStatus(coupon)}
                            id={`switch-${coupon.id}`}
                          />
                          <label
                            htmlFor={`switch-${coupon.id}`}
                            className="text-xs font-medium cursor-pointer select-none text-muted-foreground hover:text-foreground"
                          >
                            {coupon.is_active ? "Enabled" : "Disabled"}
                          </label>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenEditModal(coupon)}
                            className="h-8 px-3 rounded-xl text-xs gap-1.5 cursor-pointer font-semibold"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            Edit Details
                          </Button>

                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeletingCoupon(coupon)}
                            className="h-8 px-2.5 rounded-xl text-xs text-destructive hover:bg-destructive/10 cursor-pointer"
                            title="Delete coupon"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
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

      {/* Add Coupon Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-md bg-card border-border rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Add New Coupon</DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs">
              Create a custom coupon code with specific discount rates, delivery perks, and availability quota.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-sm">
            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">Coupon Code</label>
              <Input
                placeholder="e.g. SAVE25, FESTIVE35"
                value={newCouponCode}
                onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())}
                className="font-mono uppercase font-bold rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Discount (%)</label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={newDiscountPercent}
                  onChange={(e) => setNewDiscountPercent(Number(e.target.value) || 0)}
                  className="rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Min. Order (₹)</label>
                <Input
                  type="number"
                  min="0"
                  value={newMinOrder}
                  onChange={(e) => setNewMinOrder(Number(e.target.value) || 0)}
                  className="rounded-xl font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Total Quota (Limit)</label>
                <Input
                  type="number"
                  min="0"
                  value={newTotalCoupons}
                  onChange={(e) => setNewTotalCoupons(Number(e.target.value) || 0)}
                  className="rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Available Now</label>
                <Input
                  type="number"
                  min="0"
                  value={newAvailableCoupons}
                  onChange={(e) => setNewAvailableCoupons(Number(e.target.value) || 0)}
                  className="rounded-xl font-bold"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-background border border-border/70">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-foreground block">Free Delivery Perk</span>
                <span className="text-[11px] text-muted-foreground">Grant ₹0 free delivery when this coupon is applied</span>
              </div>
              <Switch checked={newIsFreeDelivery} onCheckedChange={setNewIsFreeDelivery} />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-background border border-border/70">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Gift className="w-3.5 h-3.5 text-amber-500" />
                  Allow Free Bottle on ₹1,200+ (After Discount)
                </span>
                <span className="text-[11px] text-muted-foreground block">
                  Allow customers to get the Free Bottle if their order remains ≥ ₹1,200 after applying this coupon
                </span>
              </div>
              <Switch
                checked={newAllowFreeBottle}
                onCheckedChange={setNewAllowFreeBottle}
                className="data-[state=checked]:bg-amber-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">Description</label>
              <Input
                placeholder="e.g. 25% OFF with Free Delivery"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="rounded-xl text-xs"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-background border border-border/70">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-foreground block">Active Status</span>
                <span className="text-[11px] text-muted-foreground">Enable coupon immediately for customers</span>
              </div>
              <Switch checked={newIsActive} onCheckedChange={setNewIsActive} />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button
              onClick={handleCreateNewCoupon}
              disabled={isSubmittingNewCoupon || !newCouponCode.trim()}
              className="rounded-xl font-bold gap-1.5"
            >
              {isSubmittingNewCoupon && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              Create Coupon
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Coupon Modal */}
      <Dialog open={!!editingCoupon} onOpenChange={(open) => !open && setEditingCoupon(null)}>
        <DialogContent className="max-w-md bg-card border-border rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Edit Coupon</DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs">
              Modify the coupon code, available quotas, discount percentage, and perks.
            </DialogDescription>
          </DialogHeader>

          {editingCoupon && (
            <div className="space-y-4 py-2 text-sm">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Coupon Code</label>
                <Input
                  value={editCode}
                  onChange={(e) => setEditCode(e.target.value.toUpperCase())}
                  className="font-mono uppercase font-bold rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">Discount (%)</label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={editDiscountPercent}
                    onChange={(e) => setEditDiscountPercent(Number(e.target.value) || 0)}
                    className="rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">Min. Order (₹)</label>
                  <Input
                    type="number"
                    min="0"
                    value={editMinOrder}
                    onChange={(e) => setEditMinOrder(Number(e.target.value) || 0)}
                    className="rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">Total Quota (Limit)</label>
                  <Input
                    type="number"
                    min="0"
                    value={editTotalCoupons}
                    onChange={(e) => setEditTotalCoupons(Number(e.target.value) || 0)}
                    className="rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">Available Count</label>
                  <Input
                    type="number"
                    min="0"
                    value={editAvailableCoupons}
                    onChange={(e) => setEditAvailableCoupons(Number(e.target.value) || 0)}
                    className="rounded-xl font-bold text-primary"
                  />
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-muted/50 border border-border/50 text-xs text-muted-foreground flex items-center justify-between">
                <span>Current Usage Count:</span>
                <span className="font-bold text-foreground">{editingCoupon.used_count} times redeemed</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-background border border-border/70">
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-foreground block">Free Delivery Perk</span>
                  <span className="text-[11px] text-muted-foreground">Orders qualify for ₹0 free delivery</span>
                </div>
                <Switch checked={editIsFreeDelivery} onCheckedChange={setEditIsFreeDelivery} />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-background border border-border/70">
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Gift className="w-3.5 h-3.5 text-amber-500" />
                    Allow Free Bottle on ₹1,200+ (After Discount)
                  </span>
                  <span className="text-[11px] text-muted-foreground block">
                    Allow customers to get the Free Bottle if their order remains ≥ ₹1,200 after applying this coupon
                  </span>
                </div>
                <Switch
                  checked={editAllowFreeBottle}
                  onCheckedChange={setEditAllowFreeBottle}
                  className="data-[state=checked]:bg-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Description</label>
                <Input
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="rounded-xl text-xs"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-background border border-border/70">
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-foreground block">Active Status</span>
                  <span className="text-[11px] text-muted-foreground">Allow customers to redeem this coupon</span>
                </div>
                <Switch checked={editIsActive} onCheckedChange={setEditIsActive} />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setEditingCoupon(null)} className="rounded-xl">
              Cancel
            </Button>
            <Button
              onClick={handleSaveEditCoupon}
              disabled={isSubmittingEdit || !editCode.trim()}
              className="rounded-xl font-bold gap-1.5"
            >
              {isSubmittingEdit && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Modal */}
      <Dialog open={!!deletingCoupon} onOpenChange={(open) => !open && setDeletingCoupon(null)}>
        <DialogContent className="max-w-sm bg-card border-border rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-destructive flex items-center gap-2">
              <Trash2 className="w-5 h-5" /> Delete Coupon
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Are you sure you want to permanently delete coupon{" "}
              <strong className="text-foreground">{deletingCoupon?.code}</strong>? Customers will no longer be able to use it.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0 mt-2">
            <Button variant="outline" onClick={() => setDeletingCoupon(null)} className="rounded-xl">
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDeleteCoupon}
              disabled={isDeletingCoupon}
              className="rounded-xl font-bold gap-1.5"
            >
              {isDeletingCoupon && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}

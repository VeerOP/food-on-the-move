import { variantLabel } from "@/lib/catalog";

export const OWNER_WHATSAPP = "918291102006"; // +91 8291102006

export type OrderNotifyItem = {
  name: string;
  quantity: number;
  lineTotal: number;
  variant?: string;
  packItems?: string[];
};

export type OrderNotifyPayload = {
  orderId: string;
  customerName: string;
  customerPhone: string;
  address: string;
  landmark?: string | null;
  pincode?: string | null;
  mapsUrl?: string | null;
  distanceKm: number;
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentStatus: string;
  upiReference?: string | null;
  items: OrderNotifyItem[];
  createdAt?: string;
};

export function buildWhatsAppOrderMessage(o: OrderNotifyPayload) {
  const when = o.createdAt ? new Date(o.createdAt) : new Date();
  const lines = [
    `🍽️ *New Order* #${o.orderId.slice(0, 8)}`,
    `🕒 ${when.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}`,
    ``,
    `👤 ${o.customerName}`,
    `📞 ${o.customerPhone}`,
    `📍 ${o.address}${o.pincode ? ` — ${o.pincode}` : ""}`,
    o.landmark ? `🧭 Landmark: ${o.landmark}` : null,
    o.mapsUrl ? `🗺️ ${o.mapsUrl}` : null,
    `📏 ${o.distanceKm.toFixed(2)} km from store`,
    ``,
    `*Items:*`,
    ...o.items.map((it) => {
      const v = it.variant ? ` [${variantLabel(it.variant as any)}]` : "";
      const pack = it.packItems && it.packItems.length ? `\n     ↳ ${it.packItems.join(", ")}` : "";
      return `• ${it.name}${v} × ${it.quantity} — ₹${it.lineTotal.toFixed(2)}${pack}`;
    }),
    ``,
    `Subtotal: ₹${o.subtotal.toFixed(2)}`,
    `Delivery: ${o.deliveryFee === 0 ? "FREE" : `₹${o.deliveryFee.toFixed(2)}`}`,
    `*Total:* ₹${o.total.toFixed(2)}`,
    ``,
    `*Payment:* ${o.paymentStatus}${o.upiReference ? ` (Ref: ${o.upiReference})` : ""}`,
  ].filter(Boolean);
  return (lines as string[]).join("\n");
}

export function whatsappLink(message: string) {
  return `https://wa.me/${OWNER_WHATSAPP}?text=${encodeURIComponent(message)}`;
}

export function googleMapsLink(lat: number, lng: number) {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

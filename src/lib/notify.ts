import { variantLabel } from "@/lib/catalog";

export const OWNER_WHATSAPP = "919152856405"; // +91 9152856405

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
  const firstName = o.customerName ? o.customerName.trim().split(/\s+/)[0] : "there";
  const shortId = o.orderId.length > 8 ? o.orderId.slice(0, 8) : o.orderId;

  const itemLines = o.items.map((it) => {
    const v = it.variant ? ` [${variantLabel(it.variant as any)}]` : "";
    const pack = it.packItems && it.packItems.length ? `\n   ↳ ${it.packItems.join(", ")}` : "";
    return `• ${it.name}${v} × ${it.quantity} — ₹${it.lineTotal.toFixed(2)}${pack}`;
  });

  const lines = [
    `Hi ${firstName},`,
    ``,
    `Thank you for your order with Food on the Move.`,
    ``,
    `Your order has been confirmed successfully.`,
    ``,
    `*Order ID:* #${shortId}`,
    `*Order Total:* ₹${o.total.toFixed(2)}`,
    ``,
    `*Items Ordered:*`,
    ...itemLines,
    ``,
    `We’ll notify you once your order is shipped.`,
    ``,
    `Thank you for shopping with us.`,
    ``,
    `Team Food on the Move`,
  ];
  return lines.join("\n");
}

export function cleanPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 10) return `91${cleaned}`;
  return cleaned;
}

export function whatsappLink(message: string) {
  return `https://wa.me/${OWNER_WHATSAPP}?text=${encodeURIComponent(message)}`;
}

export function customerWhatsappLink(phone: string, message: string) {
  const formattedPhone = cleanPhoneNumber(phone);
  return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
}

export function buildCustomerStatusMessage(customerName: string, orderId: string, status: string) {
  const firstName = customerName ? customerName.trim().split(/\s+/)[0] : "there";
  const shortId = orderId.length > 8 ? orderId.slice(0, 8) : orderId;
  return `Hi ${firstName},\n\nThis is Food on the Move regarding your order #${shortId}.\nStatus: *${status}*\n\nThank you for choosing us! 🍿🍪\n\nTeam Food on the Move`;
}

export function googleMapsLink(lat: number, lng: number) {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

export async function sendOrderEmailNotification(payload: {
  order_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string | null;
  delivery_address: string;
  landmark?: string | null;
  pincode?: string | null;
  delivery_distance_km?: number | null;
  maps_url?: string | null;
  subtotal_inr: number;
  delivery_fee_inr: number;
  total_inr: number;
  payment_id?: string | null;
  items: Array<{
    product_name: string;
    quantity: number;
    price_inr?: number;
    line_total_inr: number;
    variant?: string;
  }>;
}) {
  try {
    const res = await fetch("/api/send-order-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    console.log("Order email notification response:", data);
    return data;
  } catch (err) {
    console.error("Failed to send order email notification:", err);
    return { success: false, error: (err as any)?.message };
  }
}


import Razorpay from "razorpay";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // Safely handle both parsed and stringified JSON bodies
  const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  const { amount, currency, receipt } = body || {};

  if (amount === undefined || amount === null) {
    return res.status(400).json({ error: "Amount is required" });
  }

  if (amount < 100) {
    return res.status(400).json({ error: "Amount must be at least 100 paise (₹1)" });
  }

  const rawKeyId = process.env.VITE_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || "";
  const rawKeySecret = process.env.RAZORPAY_KEY_SECRET || "";

  // Strip accidental quotes or whitespace
  const keyId = rawKeyId.replace(/['"\s]/g, "").trim();
  const keySecret = rawKeySecret.replace(/['"\s]/g, "").trim();

  if (!keyId || !keySecret) {
    return res.status(500).json({ error: "Razorpay credentials are not configured on the server" });
  }

  try {
    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const order = await razorpay.orders.create({
      amount: Math.round(amount),
      currency: currency || "INR",
      receipt: receipt || `receipt_${Date.now()}`,
    });

    return res.status(200).json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: keyId,
    });
  } catch (error: any) {
    console.error("Razorpay order creation error:", error);
    let errorDescription = error?.error?.description || error?.message || (typeof error === "string" ? error : "Failed to create Razorpay order");
    if (errorDescription.toLowerCase().includes("authentication failed")) {
      errorDescription = "Razorpay Authentication Failed: Invalid Key ID or Key Secret configured in .env";
    }
    return res.status(500).json({ error: errorDescription });
  }
}

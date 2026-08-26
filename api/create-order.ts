import Razorpay from "razorpay";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { amount, currency, receipt } = req.body;

  if (amount === undefined || amount === null) {
    return res.status(400).json({ error: "Amount is required" });
  }

  if (amount < 100) {
    return res.status(400).json({ error: "Amount must be at least 100 paise (₹1)" });
  }

  const keyId = process.env.VITE_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

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
    });
  } catch (error: any) {
    console.error("Razorpay order creation error:", error);
    return res.status(500).json({ error: error.message || "Failed to create Razorpay order" });
  }
}

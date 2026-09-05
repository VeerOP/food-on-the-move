import crypto from "crypto";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = body || {};

  if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
    return res.status(400).json({ error: "Missing required signature verification fields" });
  }

  const rawKeySecret = process.env.RAZORPAY_KEY_SECRET || process.env.VITE_RAZORPAY_KEY_SECRET || process.env.RAZORPAY_SECRET || "";
  const keySecret = rawKeySecret.replace(/['"\s]/g, "").trim();

  if (!keySecret) {
    return res.status(500).json({ error: "Razorpay credentials are not configured in Vercel environment variables. Please configure RAZORPAY_KEY_SECRET." });
  }

  try {
    const text = razorpay_order_id + "|" + razorpay_payment_id;
    const generatedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(text)
      .digest("hex");

    if (generatedSignature === razorpay_signature) {
      return res.status(200).json({ success: true, message: "Payment verified successfully" });
    } else {
      return res.status(400).json({ success: false, error: "Payment signature mismatch" });
    }
  } catch (error: any) {
    console.error("Razorpay verification error:", error);
    const errorDescription = error?.error?.description || error?.message || "Signature verification failed";
    return res.status(500).json({ error: errorDescription });
  }
}

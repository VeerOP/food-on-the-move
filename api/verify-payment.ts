import crypto from "crypto";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

  if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
    return res.status(400).json({ error: "Missing required signature verification fields" });
  }

  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keySecret) {
    return res.status(500).json({ error: "Razorpay credentials are not configured on the server" });
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
    return res.status(500).json({ error: error.message || "Signature verification failed" });
  }
}

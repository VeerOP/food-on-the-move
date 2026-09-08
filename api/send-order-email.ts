import nodemailer from "nodemailer";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const {
      order_id,
      customer_name,
      customer_phone,
      customer_email,
      delivery_address,
      landmark,
      pincode,
      delivery_distance_km,
      maps_url,
      subtotal_inr,
      delivery_fee_inr,
      total_inr,
      payment_id,
      items = [],
    } = body || {};

    if (!order_id) {
      return res.status(400).json({ error: "order_id is required" });
    }

    const shortId = typeof order_id === "string" ? order_id.slice(0, 8).toUpperCase() : String(order_id);
    const dateFormatted = new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      dateStyle: "medium",
      timeStyle: "short",
    });

    const targetEmail = "sevenchakras.india@gmail.com";

    // Build items HTML table rows
    const itemsRowsHtml = (items || [])
      .map((item: any) => {
        const name = item.product_name || item.name || "Product";
        const variant = item.variant ? ` (${item.variant})` : "";
        const qty = item.quantity || item.qty || 1;
        const price = Number(item.price_inr ?? item.price ?? 0);
        const lineTotal = Number(item.line_total_inr ?? price * qty);

        return `
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 12px 8px; font-size: 14px; color: #1f2937; font-weight: 500;">
              ${name}<span style="color: #6b7280; font-size: 12px;">${variant}</span>
            </td>
            <td style="padding: 12px 8px; font-size: 14px; color: #4b5563; text-align: center;">
              × ${qty}
            </td>
            <td style="padding: 12px 8px; font-size: 14px; color: #4b5563; text-align: right;">
              ₹${price.toFixed(2)}
            </td>
            <td style="padding: 12px 8px; font-size: 14px; color: #111827; font-weight: 600; text-align: right;">
              ₹${lineTotal.toFixed(2)}
            </td>
          </tr>
        `;
      })
      .join("");

    // Build complete responsive HTML Email template
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Order #${shortId}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f3f4f6; margin: 0; padding: 20px; color: #1f2937;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border: 1px solid #e5e7eb;">
          
          <!-- Header Banner -->
          <div style="background: linear-gradient(135deg, #d97706 0%, #ea580c 100%); padding: 28px 24px; text-align: center; color: #ffffff;">
            <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 0.5px;">FOOD ON THE MOVE</h1>
            <p style="margin: 6px 0 0 0; font-size: 15px; opacity: 0.95;">🎉 New Paid Order Received!</p>
            <div style="display: inline-block; background: rgba(255,255,255,0.2); padding: 4px 14px; border-radius: 20px; font-size: 13px; font-weight: bold; margin-top: 10px;">
              Order #${shortId} • ${dateFormatted} IST
            </div>
          </div>

          <!-- Body Content -->
          <div style="padding: 24px;">
            
            <!-- Customer & Payment Summary Card -->
            <div style="background: #fafaf9; border-radius: 12px; padding: 16px; margin-bottom: 20px; border: 1px solid #e7e5e4;">
              <h2 style="margin: 0 0 12px 0; font-size: 15px; text-transform: uppercase; color: #ea580c; letter-spacing: 0.5px; font-weight: 700;">
                Customer & Payment Info
              </h2>
              <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
                <tr>
                  <td style="padding: 4px 0; color: #6b7280; width: 130px;">Customer Name:</td>
                  <td style="padding: 4px 0; font-weight: 600; color: #111827;">${customer_name || "Guest Customer"}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #6b7280;">Phone Number:</td>
                  <td style="padding: 4px 0; font-weight: 600; color: #111827;">
                    <a href="tel:${customer_phone}" style="color: #ea580c; text-decoration: none;">${customer_phone || "Not provided"}</a>
                  </td>
                </tr>
                ${customer_email ? `
                <tr>
                  <td style="padding: 4px 0; color: #6b7280;">Email:</td>
                  <td style="padding: 4px 0; font-weight: 600; color: #111827;">${customer_email}</td>
                </tr>` : ""}
                <tr>
                  <td style="padding: 4px 0; color: #6b7280;">Payment Status:</td>
                  <td style="padding: 4px 0;">
                    <span style="background: #dcfce7; color: #15803d; padding: 2px 8px; border-radius: 6px; font-weight: 700; font-size: 12px;">
                      PAID (Razorpay)
                    </span>
                  </td>
                </tr>
                ${payment_id ? `
                <tr>
                  <td style="padding: 4px 0; color: #6b7280;">Payment ID:</td>
                  <td style="padding: 4px 0; font-family: monospace; font-size: 13px; color: #374151;">${payment_id}</td>
                </tr>` : ""}
              </table>
            </div>

            <!-- Delivery Details Card -->
            <div style="background: #fafaf9; border-radius: 12px; padding: 16px; margin-bottom: 20px; border: 1px solid #e7e5e4;">
              <h2 style="margin: 0 0 12px 0; font-size: 15px; text-transform: uppercase; color: #ea580c; letter-spacing: 0.5px; font-weight: 700;">
                Delivery Destination
              </h2>
              <p style="margin: 0 0 6px 0; font-size: 14px; font-weight: 600; color: #1f2937; line-height: 1.4;">
                ${delivery_address || "Address not provided"}
              </p>
              ${landmark ? `<p style="margin: 0 0 6px 0; font-size: 13px; color: #4b5563;"><strong>Landmark:</strong> ${landmark}</p>` : ""}
              ${pincode ? `<p style="margin: 0 0 6px 0; font-size: 13px; color: #4b5563;"><strong>Pincode:</strong> ${pincode}</p>` : ""}
              ${delivery_distance_km ? `<p style="margin: 0 0 10px 0; font-size: 13px; color: #6b7280;"><strong>Distance:</strong> ${Number(delivery_distance_km).toFixed(2)} km from hub</p>` : ""}
              ${maps_url ? `
                <div style="margin-top: 12px;">
                  <a href="${maps_url}" target="_blank" style="display: inline-block; background: #ea580c; color: #ffffff; text-decoration: none; padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 600;">
                    📍 Open in Google Maps
                  </a>
                </div>
              ` : ""}
            </div>

            <!-- Items Ordered Table -->
            <div style="margin-bottom: 20px;">
              <h2 style="margin: 0 0 12px 0; font-size: 15px; text-transform: uppercase; color: #ea580c; letter-spacing: 0.5px; font-weight: 700;">
                Items Ordered
              </h2>
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="background: #f3f4f6; text-align: left;">
                    <th style="padding: 8px; font-size: 12px; color: #4b5563; font-weight: 700; text-transform: uppercase;">Item</th>
                    <th style="padding: 8px; font-size: 12px; color: #4b5563; font-weight: 700; text-transform: uppercase; text-align: center;">Qty</th>
                    <th style="padding: 8px; font-size: 12px; color: #4b5563; font-weight: 700; text-transform: uppercase; text-align: right;">Price</th>
                    <th style="padding: 8px; font-size: 12px; color: #4b5563; font-weight: 700; text-transform: uppercase; text-align: right;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsRowsHtml || `<tr><td colspan="4" style="padding: 12px; text-align: center; color: #6b7280;">No item details attached</td></tr>`}
                </tbody>
              </table>
            </div>

            <!-- Totals Card -->
            <div style="background: #fff7ed; border-radius: 12px; padding: 16px; border: 1px solid #ffedd5;">
              <table style="width: 100%; font-size: 14px;">
                <tr>
                  <td style="padding: 4px 0; color: #6b7280;">Subtotal:</td>
                  <td style="padding: 4px 0; text-align: right; font-weight: 600; color: #111827;">₹${Number(subtotal_inr || 0).toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #6b7280;">Delivery Fee:</td>
                  <td style="padding: 4px 0; text-align: right; font-weight: 600; color: #111827;">
                    ${Number(delivery_fee_inr || 0) === 0 ? '<span style="color: #15803d; font-weight: bold;">FREE</span>' : `₹${Number(delivery_fee_inr || 0).toFixed(2)}`}
                  </td>
                </tr>
                <tr style="border-top: 2px solid #fed7aa;">
                  <td style="padding: 10px 0 0 0; font-size: 17px; font-weight: 800; color: #111827;">Total Paid:</td>
                  <td style="padding: 10px 0 0 0; font-size: 18px; font-weight: 800; text-align: right; color: #ea580c;">₹${Number(total_inr || 0).toFixed(2)}</td>
                </tr>
              </table>
            </div>

          </div>

          <!-- Footer -->
          <div style="background: #f9fafb; padding: 16px 24px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb;">
            Food On The Move • Automated Order Notification System<br>
            Sent directly to <a href="mailto:${targetEmail}" style="color: #6b7280;">${targetEmail}</a>
          </div>
        </div>
      </body>
      </html>
    `;

    // Attempt email delivery through configured transports
    const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
    const smtpPort = Number(process.env.SMTP_PORT || 465);
    const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER || targetEmail;
    const smtpPass = (process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASSWORD || "").replace(/['"\s]/g, "").trim();

    const resendApiKey = (process.env.RESEND_API_KEY || "").replace(/['"\s]/g, "").trim();

    let emailSent = false;
    let transportMethod = "";
    let errorDetail = null;

    // 1. Try Resend API if key is available
    if (resendApiKey) {
      try {
        const resendRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: "Food On The Move Orders <orders@foodonthemove.in>",
            to: [targetEmail],
            subject: `🎉 New Paid Order #${shortId} (₹${Number(total_inr || 0).toFixed(0)}) - ${customer_name || "Customer"}`,
            html: emailHtml,
          }),
        });

        if (resendRes.ok) {
          emailSent = true;
          transportMethod = "Resend API";
        } else {
          const errBody = await resendRes.text();
          console.warn("Resend API attempt response:", errBody);
        }
      } catch (err: any) {
        console.warn("Resend API failed, falling back to SMTP:", err?.message);
        errorDetail = err?.message;
      }
    }

    // 2. Try Nodemailer / SMTP
    if (!emailSent && smtpPass) {
      try {
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpPort === 465,
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });

        await transporter.sendMail({
          from: `"Food On The Move" <${smtpUser}>`,
          to: targetEmail,
          subject: `🎉 New Paid Order #${shortId} (₹${Number(total_inr || 0).toFixed(0)}) - ${customer_name || "Customer"}`,
          html: emailHtml,
        });

        emailSent = true;
        transportMethod = "Nodemailer SMTP";
      } catch (err: any) {
        console.error("Nodemailer SMTP error:", err);
        errorDetail = err?.message;
      }
    }

    // Return status
    return res.status(200).json({
      success: true,
      delivered: emailSent,
      transport: transportMethod || "Ready (configured)",
      recipient: targetEmail,
      order_id,
      note: emailSent
        ? `Order email sent successfully to ${targetEmail}`
        : "Email generated. Configure SMTP_PASS / GMAIL_APP_PASSWORD or RESEND_API_KEY in Vercel Environment Variables for live SMTP dispatch.",
    });
  } catch (error: any) {
    console.error("send-order-email error:", error);
    return res.status(500).json({
      error: error?.message || "Failed to process order email",
    });
  }
}

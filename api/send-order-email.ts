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

    const storeEmail = process.env.ADMIN_EMAIL || process.env.STORE_EMAIL || "sevenchakras.india@gmail.com";
    const brandName = "Seven Chakras";
    const subBrand = "Food On The Move";
    const supportPhone = "+91 9152856405";

    // Build items HTML table rows
    const itemsRowsHtml = (items || [])
      .map((item: any) => {
        const name = item.product_name || item.name || "Product";
        const variant = item.variant ? ` (${item.variant})` : "";
        const packInfo = Array.isArray(item.pack_items) && item.pack_items.length > 0
          ? `<div style="color: #6b7280; font-size: 11px; margin-top: 2px;">Includes: ${item.pack_items.join(", ")}</div>`
          : "";
        const qty = item.quantity || item.qty || 1;
        const price = Number(item.price_inr ?? item.price ?? (item.line_total_inr ? item.line_total_inr / qty : 0));
        const lineTotal = Number(item.line_total_inr ?? price * qty);

        return `
          <tr style="border-bottom: 1px solid #f0f0f0;">
            <td style="padding: 12px 8px; font-size: 14px; color: #1f2937; font-weight: 500;">
              ${name}<span style="color: #ea580c; font-size: 12px; font-weight: 600;">${variant}</span>
              ${packInfo}
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

    // -------------------------------------------------------------
    // TEMPLATE 1: Customer Order Confirmation Email (from Seven Chakras)
    // -------------------------------------------------------------
    const customerEmailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Confirmation #${shortId}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #fafaf9; margin: 0; padding: 20px; color: #1f2937;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e7e5e4;">
          
          <!-- Header Banner -->
          <div style="background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
            <div style="font-size: 12px; letter-spacing: 2px; text-transform: uppercase; font-weight: 700; opacity: 0.9; margin-bottom: 4px;">
              ${brandName} presents
            </div>
            <h1 style="margin: 0; font-size: 26px; font-weight: 800; letter-spacing: 0.5px;">${subBrand.toUpperCase()}</h1>
            <p style="margin: 8px 0 0 0; font-size: 16px; font-weight: 500;">🎉 Order Confirmed!</p>
            <div style="display: inline-block; background: rgba(255,255,255,0.2); padding: 5px 16px; border-radius: 20px; font-size: 13px; font-weight: bold; margin-top: 12px;">
              Order #${shortId} • ${dateFormatted} IST
            </div>
          </div>

          <!-- Body Content -->
          <div style="padding: 24px;">
            
            <!-- Friendly Greeting -->
            <div style="margin-bottom: 20px; border-bottom: 1px solid #f3f4f6; pb-4;">
              <p style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #111827;">
                Hi ${customer_name || "there"},
              </p>
              <p style="margin: 0 0 14px 0; font-size: 14px; color: #4b5563; line-height: 1.6;">
                Thank you for choosing <strong>${subBrand}</strong> by <strong>${brandName}</strong>! Your payment has been received and your order is confirmed. We are packing your freshly prepared snacks with love and care.
              </p>
            </div>

            <!-- Delivery Details Card -->
            <div style="background: #fafaf9; border-radius: 12px; padding: 18px; margin-bottom: 22px; border: 1px solid #e7e5e4;">
              <h2 style="margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; color: #ea580c; letter-spacing: 0.5px; font-weight: 700;">
                📍 Delivery Details
              </h2>
              <p style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600; color: #111827;">
                ${customer_name || "Customer"} (${customer_phone || "Phone provided"})
              </p>
              <p style="margin: 0 0 4px 0; font-size: 14px; color: #374151; line-height: 1.5;">
                ${delivery_address || "Address"}
              </p>
              ${landmark ? `<p style="margin: 0 0 4px 0; font-size: 13px; color: #6b7280;"><strong>Landmark:</strong> ${landmark}</p>` : ""}
              ${pincode ? `<p style="margin: 0 0 4px 0; font-size: 13px; color: #6b7280;"><strong>Pincode:</strong> ${pincode}</p>` : ""}
            </div>

            <!-- Items Ordered Table -->
            <div style="margin-bottom: 22px;">
              <h2 style="margin: 0 0 12px 0; font-size: 14px; text-transform: uppercase; color: #ea580c; letter-spacing: 0.5px; font-weight: 700;">
                🍿 Items in Your Order
              </h2>
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="background: #f3f4f6; text-align: left;">
                    <th style="padding: 10px 8px; font-size: 12px; color: #4b5563; font-weight: 700; text-transform: uppercase;">Item</th>
                    <th style="padding: 10px 8px; font-size: 12px; color: #4b5563; font-weight: 700; text-transform: uppercase; text-align: center;">Qty</th>
                    <th style="padding: 10px 8px; font-size: 12px; color: #4b5563; font-weight: 700; text-transform: uppercase; text-align: right;">Price</th>
                    <th style="padding: 10px 8px; font-size: 12px; color: #4b5563; font-weight: 700; text-transform: uppercase; text-align: right;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsRowsHtml || `<tr><td colspan="4" style="padding: 12px; text-align: center; color: #6b7280;">Order items attached</td></tr>`}
                </tbody>
              </table>
            </div>

            <!-- Price Breakdown Card -->
            <div style="background: #fff7ed; border-radius: 12px; padding: 18px; border: 1px solid #ffedd5; margin-bottom: 22px;">
              <table style="width: 100%; font-size: 14px;">
                <tr>
                  <td style="padding: 5px 0; color: #6b7280;">Subtotal:</td>
                  <td style="padding: 5px 0; text-align: right; font-weight: 600; color: #111827;">₹${Number(subtotal_inr || 0).toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; color: #6b7280;">Delivery Fee:</td>
                  <td style="padding: 5px 0; text-align: right; font-weight: 600; color: #111827;">
                    ${Number(delivery_fee_inr || 0) === 0 ? '<span style="color: #15803d; font-weight: bold;">FREE</span>' : `₹${Number(delivery_fee_inr || 0).toFixed(2)}`}
                  </td>
                </tr>
                <tr style="border-top: 2px solid #fed7aa;">
                  <td style="padding: 10px 0 0 0; font-size: 16px; font-weight: 800; color: #111827;">Total Paid:</td>
                  <td style="padding: 10px 0 0 0; font-size: 18px; font-weight: 800; text-align: right; color: #ea580c;">₹${Number(total_inr || 0).toFixed(2)}</td>
                </tr>
                ${payment_id ? `
                <tr>
                  <td style="padding: 6px 0 0 0; font-size: 12px; color: #9ca3af;">Razorpay Payment ID:</td>
                  <td style="padding: 6px 0 0 0; font-size: 12px; font-family: monospace; text-align: right; color: #6b7280;">${payment_id}</td>
                </tr>` : ""}
              </table>
            </div>

            <!-- Support & Contact -->
            <div style="background: #f0fdf4; border-radius: 12px; padding: 16px; border: 1px solid #dcfce7; text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 14px; font-weight: 600; color: #166534;">
                Need help or have questions about your delivery?
              </p>
              <p style="margin: 0; font-size: 13px; color: #15803d;">
                Email us at <a href="mailto:${storeEmail}" style="color: #166534; font-weight: bold; text-decoration: underline;">${storeEmail}</a> or WhatsApp us at <a href="https://wa.me/919152856405" style="color: #166534; font-weight: bold; text-decoration: underline;">${supportPhone}</a>
              </p>
            </div>

          </div>

          <!-- Footer -->
          <div style="background: #f9fafb; padding: 20px 24px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb;">
            <strong>${subBrand}</strong> • A Registered Trademark of <strong>${brandName}</strong><br>
            Mumbai, India • Thank you for supporting our journey!
          </div>
        </div>
      </body>
      </html>
    `;

    // -------------------------------------------------------------
    // TEMPLATE 2: Store Notification Email (to Seven Chakras)
    // -------------------------------------------------------------
    const adminEmailHtml = `
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
            <div style="font-size: 12px; letter-spacing: 2px; text-transform: uppercase; font-weight: 700; opacity: 0.9; margin-bottom: 4px;">
              ${brandName} Store Alert
            </div>
            <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 0.5px;">${subBrand.toUpperCase()}</h1>
            <p style="margin: 6px 0 0 0; font-size: 15px; opacity: 0.95;">🎉 New Paid Order Received!</p>
            <div style="display: inline-block; background: rgba(255,255,255,0.2); padding: 4px 14px; border-radius: 20px; font-size: 13px; font-weight: bold; margin-top: 10px;">
              Order #${shortId} • ${dateFormatted} IST
            </div>
          </div>

          <!-- Body Content -->
          <div style="padding: 24px;">
            
            <!-- Customer & Payment Summary Card -->
            <div style="background: #fafaf9; border-radius: 12px; padding: 16px; margin-bottom: 20px; border: 1px solid #e7e5e4;">
              <h2 style="margin: 0 0 12px 0; font-size: 14px; text-transform: uppercase; color: #ea580c; letter-spacing: 0.5px; font-weight: 700;">
                Customer & Payment Info
              </h2>
              <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
                <tr>
                  <td style="padding: 5px 0; color: #6b7280; width: 130px;">Customer Name:</td>
                  <td style="padding: 5px 0; font-weight: 600; color: #111827;">${customer_name || "Guest Customer"}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; color: #6b7280;">Phone Number:</td>
                  <td style="padding: 5px 0; font-weight: 600; color: #111827;">
                    <a href="tel:${customer_phone}" style="color: #ea580c; text-decoration: none;">${customer_phone || "Not provided"}</a>
                    ${customer_phone ? `&nbsp;(<a href="https://wa.me/91${customer_phone.replace(/\\D/g, '').slice(-10)}" target="_blank" style="color: #15803d; text-decoration: none; font-weight: 600;">Chat on WhatsApp</a>)` : ""}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; color: #6b7280;">Email:</td>
                  <td style="padding: 5px 0; font-weight: 600; color: #111827;">
                    ${customer_email ? `<a href="mailto:${customer_email}" style="color: #ea580c; text-decoration: none;">${customer_email}</a>` : '<span style="color: #9ca3af; font-weight: normal;">Not provided</span>'}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; color: #6b7280;">Payment Status:</td>
                  <td style="padding: 5px 0;">
                    <span style="background: #dcfce7; color: #15803d; padding: 2px 8px; border-radius: 6px; font-weight: 700; font-size: 12px;">
                      PAID (Razorpay)
                    </span>
                  </td>
                </tr>
                ${payment_id ? `
                <tr>
                  <td style="padding: 5px 0; color: #6b7280;">Payment ID:</td>
                  <td style="padding: 5px 0; font-family: monospace; font-size: 13px; color: #374151;">${payment_id}</td>
                </tr>` : ""}
              </table>
            </div>

            <!-- Delivery Details Card -->
            <div style="background: #fafaf9; border-radius: 12px; padding: 16px; margin-bottom: 20px; border: 1px solid #e7e5e4;">
              <h2 style="margin: 0 0 12px 0; font-size: 14px; text-transform: uppercase; color: #ea580c; letter-spacing: 0.5px; font-weight: 700;">
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
              <h2 style="margin: 0 0 12px 0; font-size: 14px; text-transform: uppercase; color: #ea580c; letter-spacing: 0.5px; font-weight: 700;">
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
            ${brandName} • Automated Order Notification System<br>
            Sent directly to <a href="mailto:${storeEmail}" style="color: #6b7280;">${storeEmail}</a>
          </div>
        </div>
      </body>
      </html>
    `;

    // -------------------------------------------------------------
    // DISPATCH LOGIC (Customer Confirmation & Store Alert)
    // -------------------------------------------------------------
    const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
    const smtpPort = Number(process.env.SMTP_PORT || 465);
    const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER || storeEmail;
    const smtpPass = (process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASSWORD || "").replace(/['"\s]/g, "").trim();

    const resendApiKey = (process.env.RESEND_API_KEY || "").replace(/['"\s]/g, "").trim();

    let adminEmailSent = false;
    let customerEmailSent = false;
    let transportMethod = "";
    const dispatchErrors: string[] = [];

    const senderFromHeader = `"${brandName}" <${smtpUser}>`;
    const adminSubject = `🎉 New Paid Order #${shortId} (₹${Number(total_inr || 0).toFixed(0)}) - ${customer_name || "Customer"}`;
    const customerSubject = `Order Confirmed! Your Food On The Move Order #${shortId} has been placed 🎉`;

    // Method A: Nodemailer SMTP
    if (smtpPass) {
      transportMethod = "Nodemailer SMTP";
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      const promises: Promise<any>[] = [];

      // 1. Send Store Notification to Seven Chakras
      promises.push(
        transporter.sendMail({
          from: senderFromHeader,
          to: storeEmail,
          replyTo: customer_email || undefined,
          subject: adminSubject,
          html: adminEmailHtml,
        }).then(() => {
          adminEmailSent = true;
        }).catch((err) => {
          console.error("Failed to send admin notification email:", err);
          dispatchErrors.push(`Admin email error: ${err?.message}`);
        })
      );

      // 2. Send Order Confirmation to Customer (if email is available)
      if (customer_email && typeof customer_email === "string" && customer_email.includes("@")) {
        promises.push(
          transporter.sendMail({
            from: senderFromHeader,
            to: customer_email.trim(),
            replyTo: storeEmail,
            subject: customerSubject,
            html: customerEmailHtml,
          }).then(() => {
            customerEmailSent = true;
          }).catch((err) => {
            console.error("Failed to send customer confirmation email:", err);
            dispatchErrors.push(`Customer email error: ${err?.message}`);
          })
        );
      }

      await Promise.allSettled(promises);
    }
    // Method B: Resend API (Fallback if RESEND_API_KEY is configured)
    else if (resendApiKey) {
      transportMethod = "Resend API";
      const resendSender = `"${brandName}" <orders@foodonthemove.in>`;
      const promises: Promise<any>[] = [];

      // 1. Send Store Notification
      promises.push(
        fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: resendSender,
            to: [storeEmail],
            reply_to: customer_email || undefined,
            subject: adminSubject,
            html: adminEmailHtml,
          }),
        }).then(async (r) => {
          if (r.ok) adminEmailSent = true;
          else dispatchErrors.push(`Resend admin error: ${await r.text()}`);
        }).catch((err) => {
          dispatchErrors.push(`Resend admin error: ${err?.message}`);
        })
      );

      // 2. Send Customer Confirmation
      if (customer_email && typeof customer_email === "string" && customer_email.includes("@")) {
        promises.push(
          fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${resendApiKey}`,
            },
            body: JSON.stringify({
              from: resendSender,
              to: [customer_email.trim()],
              reply_to: storeEmail,
              subject: customerSubject,
              html: customerEmailHtml,
            }),
          }).then(async (r) => {
            if (r.ok) customerEmailSent = true;
            else dispatchErrors.push(`Resend customer error: ${await r.text()}`);
          }).catch((err) => {
            dispatchErrors.push(`Resend customer error: ${err?.message}`);
          })
        );
      }

      await Promise.allSettled(promises);
    }

    const hasConfig = Boolean(smtpPass || resendApiKey);

    return res.status(200).json({
      success: true,
      delivered: {
        store_notification: adminEmailSent,
        customer_confirmation: customerEmailSent,
      },
      transport: transportMethod || (hasConfig ? "Configured" : "Awaiting Credentials"),
      recipients: {
        store: storeEmail,
        customer: customer_email || null,
      },
      order_id,
      errors: dispatchErrors.length > 0 ? dispatchErrors : undefined,
      note: hasConfig
        ? `Emails processed. Store sent: ${adminEmailSent}, Customer sent: ${customerEmailSent}`
        : "Email templates ready. Configure GMAIL_APP_PASSWORD / SMTP_PASS or RESEND_API_KEY in environment variables for live SMTP dispatch.",
    });
  } catch (error: any) {
    console.error("send-order-email error:", error);
    return res.status(500).json({
      error: error?.message || "Failed to process order email",
    });
  }
}

import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

const getJsonBody = (req: any): Promise<any> => {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk: any) => {
      body += chunk;
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
  });
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    base: "./",
    build: {
      outDir: "docs",
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: {
            "vendor-react": ["react", "react-dom", "react-router-dom"],
            "vendor-ui": ["framer-motion", "lucide-react"],
            "vendor-supabase": ["@supabase/supabase-js"],
          },
        },
      },
    },
    server: {
      host: "0.0.0.0",
      port: 8080,
    },
    plugins: [
      react(),
      {
        name: "api-mock-endpoints",
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.url === "/api/create-order" && req.method === "POST") {
              try {
                const body = await getJsonBody(req);
                const { amount, currency, receipt } = body;

                if (amount === undefined || amount < 100) {
                  res.statusCode = 400;
                  res.setHeader("Content-Type", "application/json");
                  res.end(JSON.stringify({ error: "Amount must be at least 100 paise" }));
                  return;
                }

                const keyId = env.VITE_RAZORPAY_KEY_ID;
                const keySecret = env.RAZORPAY_KEY_SECRET;

                if (!keyId || !keySecret) {
                  res.statusCode = 500;
                  res.setHeader("Content-Type", "application/json");
                  res.end(JSON.stringify({ error: "Razorpay credentials are not configured in .env" }));
                  return;
                }

                const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
                const response = await fetch("https://api.razorpay.com/v1/orders", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Basic ${auth}`,
                  },
                  body: JSON.stringify({
                    amount: Math.round(amount),
                    currency: currency || "INR",
                    receipt: receipt || `receipt_${Date.now()}`,
                  }),
                });

                const data = await response.json();
                if (!response.ok) {
                  throw new Error(data.error?.description || "Razorpay API error");
                }

                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({
                  order_id: data.id,
                  amount: data.amount,
                  currency: data.currency,
                }));
              } catch (err: any) {
                res.statusCode = 500;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ error: err.message || "Failed to create order" }));
              }
            } else if (req.url === "/api/verify-payment" && req.method === "POST") {
              try {
                const body = await getJsonBody(req);
                const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = body;

                if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
                  res.statusCode = 400;
                  res.setHeader("Content-Type", "application/json");
                  res.end(JSON.stringify({ error: "Missing required signature fields" }));
                  return;
                }

                const keySecret = env.RAZORPAY_KEY_SECRET;
                if (!keySecret) {
                  res.statusCode = 500;
                  res.setHeader("Content-Type", "application/json");
                  res.end(JSON.stringify({ error: "Razorpay secret key not configured" }));
                  return;
                }

                const crypto = await import("crypto");
                const text = razorpay_order_id + "|" + razorpay_payment_id;
                const generatedSignature = crypto
                  .createHmac("sha256", keySecret)
                  .update(text)
                  .digest("hex");

                if (generatedSignature === razorpay_signature) {
                  res.statusCode = 200;
                  res.setHeader("Content-Type", "application/json");
                  res.end(JSON.stringify({ success: true, message: "Payment verified successfully" }));
                } else {
                  res.statusCode = 400;
                  res.setHeader("Content-Type", "application/json");
                  res.end(JSON.stringify({ success: false, error: "Payment signature mismatch" }));
                }
              } catch (err: any) {
                res.statusCode = 500;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ error: err.message || "Verification failed" }));
              }
            } else {
              next();
            }
          });
        }
      }
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});

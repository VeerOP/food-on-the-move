import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/hooks/use-theme";
import { AuthProvider } from "@/hooks/use-auth";
import { CartProvider } from "@/hooks/use-cart";
import { lazy, Suspense } from "react";
import Index from "./pages/Index";

const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Auth = lazy(() => import("./pages/Auth"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Pay = lazy(() => import("./pages/Pay"));
const Orders = lazy(() => import("./pages/Orders"));
const Admin = lazy(() => import("./pages/Admin"));
const Terms = lazy(() => import("./pages/Terms"));
const Hampers = lazy(() => import("./pages/Hampers"));
const Products = lazy(() => import("./pages/Products"));

const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <HashRouter>
          <AuthProvider>
            <CartProvider>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/product/:slug" element={<ProductDetail />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/pay/:id" element={<Pay />} />
                  <Route path="/orders" element={<Orders />} />
                  <Route path="/admin" element={<Admin />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/hampers" element={<Hampers />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </CartProvider>
          </AuthProvider>
        </HashRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

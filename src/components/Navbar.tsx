import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronDown, ShoppingCart, User, LogOut, Package, Shield } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { useIsAdmin } from "@/hooks/use-admin";
import logo from "@/assets/logo-new.png";

const navLinks = [
  { name: "Home", href: "#home" },
  { name: "Products", href: "#products" },
  { name: "About", href: "#about" },
  { name: "Contact", href: "#contact" },
];

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { count } = useCart();
  const { isAdmin } = useIsAdmin();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navigateToSection = (href: string) => {
    navigate({ pathname: "/", hash: href });
    setIsMobileMenuOpen(false);
  };

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();

    // If we're already on home, keep smooth scrolling behavior.
    if (location.pathname === "/") {
      const id = href.replace("#", "");
      const el = document.getElementById(id);
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    // Always update URL hash (and navigate home if needed).
    navigateToSection(href);
  };

  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();

    if (location.pathname === "/") {
      const el = document.getElementById("home");
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    navigateToSection("#home");
  };

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-background/90 backdrop-blur-lg border-b border-border/50" : "bg-transparent"
      }`}
    >
      <div className="section-container">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <motion.a
            href="#home"
            onClick={handleLogoClick}
            className="flex items-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <img
              alt="Food On The Move"
              className="h-16 md:h-20 w-auto"
              src={logo}
            />
          </motion.a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link, index) => {
              if (link.name === "Products") {
                return (
                  <div key={link.name}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <motion.button
                          className="text-muted-foreground hover:text-foreground transition-colors duration-300 font-medium flex items-center gap-1 cursor-pointer focus:outline-none bg-transparent border-0 outline-none"
                          initial={{ opacity: 0, y: -20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          whileHover={{ y: -2 }}
                        >
                          {link.name} <ChevronDown size={14} className="mt-0.5" />
                        </motion.button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-60 mt-2 rounded-2xl border border-border/50 bg-background/95 backdrop-blur-md shadow-xl p-1.5">
                        <DropdownMenuItem 
                          className="cursor-pointer py-2.5 px-3.5 rounded-xl hover:bg-primary/10 transition-colors focus:bg-primary/10"
                          onClick={() => navigate("/products")}
                        >
                          <div className="flex flex-col">
                            <span className="font-semibold text-sm text-primary">All Products Catalog</span>
                            <span className="text-xs text-muted-foreground">Puffs, Cookies, Sweets, Sticks</span>
                          </div>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="my-1 bg-border/50" />
                        <DropdownMenuItem 
                          className="cursor-pointer py-2.5 px-3.5 rounded-xl hover:bg-primary/10 transition-colors focus:bg-primary/10"
                          onClick={() => {
                            if (location.pathname === "/") {
                              const el = document.getElementById("products");
                              el?.scrollIntoView({ behavior: "smooth", block: "start" });
                            } else {
                              navigate("/#products");
                            }
                          }}
                        >
                          <div className="flex flex-col">
                            <span className="font-semibold text-sm">Featured Puffs</span>
                            <span className="text-xs text-muted-foreground">Corn, Jowar, Quinoa, Multigrain</span>
                          </div>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="my-1 bg-border/50" />
                        <DropdownMenuItem 
                          className="cursor-pointer py-2.5 px-3.5 rounded-xl hover:bg-primary/10 transition-colors focus:bg-primary/10"
                          onClick={() => navigate("/hampers")}
                        >
                          <div className="flex flex-col">
                            <span className="font-semibold text-sm">Hampers & Gift Boxes</span>
                            <span className="text-xs text-muted-foreground">Gifting bundles with MOQ</span>
                          </div>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              }
              return (
                <motion.a
                  key={link.name}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className="text-muted-foreground hover:text-foreground transition-colors duration-300 font-medium"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -2 }}
                >
                  {link.name}
                </motion.a>
              );
            })}
            <ThemeToggle />
            <Link to="/cart" className="relative p-2 text-foreground hover:text-primary transition-colors">
              <ShoppingCart size={22} />
              {count > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {count}
                </span>
              )}
            </Link>
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <User size={20} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate("/orders")}>
                    <Package className="w-4 h-4 mr-2" /> My Orders
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/cart")}>
                    <ShoppingCart className="w-4 h-4 mr-2" /> Cart
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem onClick={() => navigate("/admin")}>
                      <Shield className="w-4 h-4 mr-2" /> Admin Dashboard
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut}>
                    <LogOut className="w-4 h-4 mr-2" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="ticket" size="sm" onClick={() => navigate("/auth")}>
                Sign In
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-foreground"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-background/95 backdrop-blur-lg border-b border-border"
          >
            <div className="section-container py-6 flex flex-col gap-4">
              {navLinks.map((link) => {
                if (link.name === "Products") {
                  return (
                    <div key={link.name} className="flex flex-col gap-2 pl-3 border-l-2 border-primary/30 py-1">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Products</span>
                      <a
                        href="#products"
                        onClick={(e) => {
                          e.preventDefault();
                          setIsMobileMenuOpen(false);
                          if (location.pathname === "/") {
                            const el = document.getElementById("products");
                            el?.scrollIntoView({ behavior: "smooth", block: "start" });
                          } else {
                            navigate("/#products");
                          }
                        }}
                        className="text-lg font-medium text-foreground hover:text-primary transition-colors py-1 pl-2"
                      >
                        Individual Puffs
                      </a>
                      <Link
                        to="/hampers"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="text-lg font-medium text-foreground hover:text-primary transition-colors py-1 pl-2"
                      >
                        Hampers & Gift Boxes
                      </Link>
                    </div>
                  );
                }
                return (
                  <a
                    key={link.name}
                    href={link.href}
                    onClick={(e) => handleNavClick(e, link.href)}
                    className="text-lg font-medium text-muted-foreground hover:text-foreground transition-colors py-2"
                  >
                    {link.name}
                  </a>
                );
              })}
              <Link to="/cart" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-2 py-2">
                <ShoppingCart size={20} /> Cart {count > 0 && <span className="bg-primary text-primary-foreground text-xs px-2 rounded-full">{count}</span>}
              </Link>
              {user ? (
                <>
                  <Link to="/orders" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-2 py-2">
                    <Package size={20} /> My Orders
                  </Link>
                  {isAdmin && (
                    <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-2 py-2">
                      <Shield size={20} /> Admin Dashboard
                    </Link>
                  )}
                  <Button variant="outline" onClick={() => { signOut(); setIsMobileMenuOpen(false); }}>
                    <LogOut className="w-4 h-4 mr-2" /> Sign out
                  </Button>
                </>
              ) : (
                <Button variant="ticket" onClick={() => { navigate("/auth"); setIsMobileMenuOpen(false); }}>
                  Sign In
                </Button>
              )}
              <div className="flex items-center justify-between mt-4">
                <ThemeToggle />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
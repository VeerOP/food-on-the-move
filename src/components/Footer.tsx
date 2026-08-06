import { Instagram, Mail, Linkedin, Github, Code } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import logo from "@/assets/logo-new.png";

export function Footer() {
  const navigate = useNavigate();

  const scrollToSection = (id: string) => {
    navigate({ pathname: "/", hash: `#${id}` });
    setTimeout(() => {
      const el = document.getElementById(id);
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const scrollToProduct = (productSlug: string) => {
    navigate(`/product/${productSlug}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="py-12 bg-background border-t border-border/30">
      <div className="section-container">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
          
          {/* Brand */}
          <div className="md:col-span-1">
            <img 
              src={logo} 
              alt="Food On The Move" 
              className="h-12 w-auto mb-4"
            />
            <p className="text-muted-foreground text-sm">
              Snack Smart. Snack Bold.
            </p>
          </div>

          {/* Products */}
          <div>
            <h4 className="text-foreground font-semibold mb-4 text-sm uppercase tracking-wider">
              Products
            </h4>
            <ul className="space-y-2">
              <li>
                <button 
                  onClick={() => scrollToProduct("woh-corn-thi")}
                  className="text-muted-foreground text-sm hover:text-primary transition-colors text-left"
                >
                  Woh Corn Thi
                </button>
              </li>
              <li>
                <button 
                  onClick={() => scrollToProduct("yeh-jowaari-hai-deewani")}
                  className="text-muted-foreground text-sm hover:text-primary transition-colors text-left"
                >
                  Yeh Jowaari Hai Deewani
                </button>
              </li>
              <li>
                <button 
                  onClick={() => scrollToProduct("quinoa-se-quinoa-tak")}
                  className="text-muted-foreground text-sm hover:text-primary transition-colors text-left"
                >
                  Quinoa Se Quinoa Tak
                </button>
              </li>
              <li>
                <button 
                  onClick={() => scrollToProduct("hum-saath-saath-hai")}
                  className="text-muted-foreground text-sm hover:text-primary transition-colors text-left"
                >
                  Hum Saath Saath Hai
                </button>
              </li>
              <li>
                <Link
                  to="/products"
                  className="text-primary font-medium text-sm hover:underline transition-colors text-left block pt-1"
                >
                  View All Products →
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-foreground font-semibold mb-4 text-sm uppercase tracking-wider">
              Quick Links
            </h4>
            <ul className="space-y-2">
              <li>
                <button 
                  onClick={() => scrollToSection("home")}
                  className="text-muted-foreground text-sm hover:text-primary transition-colors text-left"
                >
                  Home
                </button>
              </li>
              <li>
                <button 
                  onClick={() => scrollToSection("products")}
                  className="text-muted-foreground text-sm hover:text-primary transition-colors text-left"
                >
                  Products
                </button>
              </li>
              <li>
                <button 
                  onClick={() => scrollToSection("about")}
                  className="text-muted-foreground text-sm hover:text-primary transition-colors text-left"
                >
                  About Us
                </button>
              </li>
              <li>
                <button 
                  onClick={() => scrollToSection("contact")}
                  className="text-muted-foreground text-sm hover:text-primary transition-colors text-left"
                >
                  Contact
                </button>
              </li>
              <li>
                <Link
                  to="/terms"
                  className="text-muted-foreground text-sm hover:text-primary transition-colors text-left"
                >
                  Terms & Conditions
                </Link>
              </li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h4 className="text-foreground font-semibold mb-4 text-sm uppercase tracking-wider">
              Connect
            </h4>
            <div className="flex items-center gap-4 mb-4">
              <a
                href="https://www.instagram.com/foodonthemove_india?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Instagram size={20} />
              </a>
              <a
                href="https://www.linkedin.com/in/vedaansh-shah-a254a0230/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Linkedin size={20} />
              </a>
              <a
                href="mailto:sevenchakras.india@gmail.com"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Mail size={20} />
              </a>
            </div>
            <p className="text-muted-foreground text-sm">
              sevenchakras.india@gmail.com
            </p>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-6 border-t border-border/20 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-muted-foreground/60 text-xs">
            © {new Date().getFullYear()} Food On The Move. All Rights Reserved.
          </p>
          <div className="flex flex-col md:flex-row items-center gap-4">
            <p className="text-muted-foreground/50 text-xs">
              A Registered Trademark of Seven Chakras India
            </p>
            <div className="flex items-center gap-2 text-muted-foreground/50 text-xs">
              <Code size={12} />
              <span>Developed by</span>
              <a
                href="https://www.linkedin.com/in/veer-nagda-9a3761286/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors"
              >
                <Linkedin size={14} />
              </a>
              <a
                href="https://github.com/VeerOP"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors"
              >
                <Github size={14} />
              </a>
              <span>Veer Nagda</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

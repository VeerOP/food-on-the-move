import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Mail, MapPin, Instagram, ArrowUpRight } from "lucide-react";
import { EnquiryForm } from "@/components/EnquiryForm";

export function ContactSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="contact" className="py-24 relative isolate overflow-hidden bg-gradient-to-b from-background via-card/20 to-background">
      {/* Background Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/10 rounded-full blur-[150px] -z-10"
      />

      <div className="section-container relative z-10" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto"
        >
          <span className="text-primary font-semibold uppercase tracking-wider text-sm">
            Get In Touch
          </span>
          <h2 className="font-display text-5xl md:text-6xl lg:text-7xl mt-4 mb-6 text-foreground">
            LET'S <span className="text-gradient">CONNECT</span>
          </h2>
          <p className="text-muted-foreground text-lg mb-12">
            Whether you're a retailer, distributor, or simply a snack lover, 
            let's collaborate to bring better snacking to every shelf and every home.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
          {/* Left - Contact Cards */}
          <div className="space-y-6">
            <motion.a
              href="mailto:sevenchakras.india@gmail.com"
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2 }}
              className="block bg-card/50 border border-border/30 rounded-2xl p-6 hover:border-primary/50 transition-all duration-300 hover:bg-card/60 hover:shadow-lg hover:shadow-primary/10"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-display text-xl mb-2 text-foreground">Email Us</h3>
              <p className="text-muted-foreground text-sm">sevenchakras.india@gmail.com</p>
            </motion.a>

            <motion.a
              href="https://share.google/K4ioDBOGrFy8WkBb5"
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.3 }}
              className="block bg-card/50 border border-border/30 rounded-2xl p-6 hover:border-primary/50 transition-all duration-300 hover:bg-card/60 hover:shadow-lg hover:shadow-primary/10"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-display text-xl mb-2 text-foreground flex items-center gap-2">
                Location <ArrowUpRight className="w-4 h-4" />
              </h3>
              <p className="text-muted-foreground text-sm">Mumbai, India</p>
            </motion.a>

            <motion.a
              href="https://www.instagram.com/foodonthemove_india?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.4 }}
              className="block bg-card/50 border border-border/30 rounded-2xl p-6 hover:border-primary/50 transition-all duration-300 hover:bg-card/60 hover:shadow-lg hover:shadow-primary/10"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Instagram className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-display text-xl mb-2 text-foreground flex items-center gap-2">
                Instagram <ArrowUpRight className="w-4 h-4" />
              </h3>
              <p className="text-muted-foreground text-sm">@foodonthemove_india</p>
            </motion.a>
          </div>

          {/* Right - Enquiry Form */}
          <EnquiryForm />
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.5 }}
          className="text-center mt-16"
        >
          <p className="font-display text-2xl text-muted-foreground">
            Join the movement. <span className="text-gradient">Snack smart. Live better.</span>
          </p>
        </motion.div>
      </div>
    </section>
  );
}

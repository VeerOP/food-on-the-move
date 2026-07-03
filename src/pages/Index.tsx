import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { OurRangeSection } from "@/components/OurRangeSection";
import { ProductsSection } from "@/components/ProductsSection";
import { FeaturesSection } from "@/components/FeaturesSection";
import { OffersSection } from "@/components/OffersSection";
import { AboutSection } from "@/components/AboutSection";
import { ContactSection } from "@/components/ContactSection";
import { Footer } from "@/components/Footer";
import { CinematicLoader } from "@/components/CinematicLoader";
import { CurtainReveal } from "@/components/CurtainReveal";

const Index = () => {
  const location = useLocation();

  useEffect(() => {
    const id = location.hash?.replace("#", "");
    if (!id) return;

    let frame = 0;
    let tries = 0;

    const tryScroll = () => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      tries += 1;
      if (tries < 30) frame = requestAnimationFrame(tryScroll);
    };

    frame = requestAnimationFrame(tryScroll);
    return () => cancelAnimationFrame(frame);
  }, [location.hash]);

  return (
    <main className="min-h-screen bg-background overflow-x-hidden">
      <CinematicLoader />
      <CurtainReveal />
      <Navbar />
      <HeroSection />
      <OurRangeSection />
      <ProductsSection />
      <FeaturesSection />
      <OffersSection />
      <AboutSection />
      <ContactSection />
      <Footer />
    </main>
  );
};

export default Index;

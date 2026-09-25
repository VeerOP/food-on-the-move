import { useState, useEffect } from "react";
import { Sparkles, Gift, Truck, Flame, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function OfferPromo() {
  const navigate = useNavigate();

  const marqueeItems = [
    { icon: Truck, text: "FREE Delivery across Mumbai & Navi Mumbai on all orders above ₹1,000!" },
    { icon: Sparkles, text: "100% Roasted, Non-Fried Millet Snacks · Zero Trans Fat" },
    { icon: Gift, text: "Curated Gourmet Gift Hampers for Celebrations & Corporate Gifting" },
    { icon: Truck, text: "Fast & Fresh Delivery Directly to Your Doorstep" },
    { icon: Flame, text: "Guilt-Free Healthy Snacking with Authentic Indian Flavors" },
  ];

  return (
    <div
      onClick={() => navigate("/products")}
      className="w-full bg-gradient-to-r from-amber-600 via-primary to-amber-600 text-white shadow-sm cursor-pointer relative overflow-hidden group select-none border-b border-primary/30 z-50"
      role="button"
      tabIndex={0}
      aria-label="View Products"
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          navigate("/products");
        }
      }}
    >
      <div className="flex items-center justify-between py-1.5 px-3 relative">
        {/* Infinite Marquee Track */}
        <div className="flex overflow-hidden w-full group-hover:[&>div]:[animation-play-state:paused]">
          <div className="flex shrink-0 items-center gap-6 sm:gap-10 animate-marquee text-[11px] sm:text-xs font-semibold tracking-wide whitespace-nowrap">
            {marqueeItems.map((item, idx) => {
              const Icon = item.icon;
              return (
                <span key={`m1-${idx}`} className="inline-flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5 text-amber-200 shrink-0 animate-pulse" />
                  <span>{item.text}</span>
                  <span className="text-amber-200/60 font-bold ml-2 sm:ml-4">•</span>
                </span>
              );
            })}
          </div>
          <div
            aria-hidden="true"
            className="flex shrink-0 items-center gap-6 sm:gap-10 animate-marquee text-[11px] sm:text-xs font-semibold tracking-wide whitespace-nowrap"
          >
            {marqueeItems.map((item, idx) => {
              const Icon = item.icon;
              return (
                <span key={`m2-${idx}`} className="inline-flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5 text-amber-200 shrink-0 animate-pulse" />
                  <span>{item.text}</span>
                  <span className="text-amber-200/60 font-bold ml-2 sm:ml-4">•</span>
                </span>
              );
            })}
          </div>
        </div>

        {/* Action pill on right */}
        <div className="hidden md:flex shrink-0 items-center gap-1 bg-white/20 hover:bg-white/30 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[11px] font-bold text-white transition-transform group-hover:scale-105 ml-3">
          <span>Shop Now</span>
          <ArrowRight className="w-3 h-3" />
        </div>
      </div>
    </div>
  );
}

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef, useState } from "react";
import { Star, Film, Shield, Heart, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import vedaanshPhoto from "@/assets/vedaansh-photo.jpg";
import bhawnaPhoto from "@/assets/bhawna-photo.jpg";

const values = [
  {
    icon: Star,
    title: "Purpose-Driven Brand",
    description: "We inspire people to make mindful choices without giving up on joy or flavour.",
  },
  {
    icon: Film,
    title: "Bollywood-Themed Innovation",
    description: "Quirky, film-inspired product names that bring smiles and nostalgia to every pack.",
  },
  {
    icon: Shield,
    title: "Quality You Can Trust",
    description: "Premium ingredients and high standards of taste and consistency.",
  },
  {
    icon: Heart,
    title: "Transparency & Authenticity",
    description: "Every decision reflects honesty, responsibility, and integrity.",
  },
  {
    icon: Users,
    title: "Community & Inclusion",
    description: "We celebrate diversity — in people, in tastes, and in ideas.",
  },
];

const vedaanshFull = `At just 19, Vedaansh Shah, a first-generation entrepreneur, set out to build something of his own — a journey rooted in determination, resilience, and a clear purpose.

Born hearing impaired, Vedaansh learned early on how to navigate challenges with persistence and focus. Alongside his studies, he began exploring the world of business with a strong sense of curiosity and purpose.

Driven by this curiosity, Vedaansh spent over a year understanding the FMCG industry from the ground up — attending exhibitions, connecting with industry experts, and studying market dynamics in depth. This hands-on learning became the foundation of Seven Chakras India (SCI).

In August 2025, he launched "Food on the Move", a brand born out of the idea of making snacking tastier, premium and more accessible for people on the go. What started as a vision has translated into a growing presence across retail stores in Mumbai.

Vedaansh's journey reflects a simple belief: with the right intent and relentless effort, challenges can be transformed into opportunities and ideas into impact.`;

const bhawnaFull = `Behind every milestone of Food on the Move stands Bhawna Shah, Co-Founder and the emotional backbone of the brand. More than a constant source of strength, she has been an active partner in building the venture — standing by Vedaansh at every step of the journey.

From pitching ideas and shaping the brand vision to hands-on involvement in packing and design, Bhawna's presence is woven into every aspect of the business. Her unwavering belief in Vedaansh's potential, combined with her practical support, has played a defining role in transforming an idea into a growing brand.

Her life lessons — to lead with compassion, stay grounded, and create with purpose — continue to shape the philosophy of Food on the Move. Together, this mother-son duo has built not just a business, but a value-driven venture rooted in trust, resilience, and shared ambition.`;

const ourStoryFull = `Food On The Move — a brand of Seven Chakras India (SCI) — was founded by Vedaansh Shah, a young first-generation entrepreneur driven by a passion to bring freshness, creativity, and excitement to the snacking world.

After more than a year of immersing himself in the FMCG industry — attending exhibitions, connecting with industry experts, and studying market dynamics — Vedaansh laid the foundation of Seven Chakras India and launched "Food on the Move" in August 2025.

The idea was simple: make snacking tastier, premium, and more accessible for people on the go. What started as a vision has translated into a growing presence across retail stores in Mumbai.

Supported every step of the way by his mother and Co-Founder, Bhawna Shah, the brand has grown into a true mother-son venture — with Bhawna actively involved in pitching, packing, design, and shaping the brand vision alongside Vedaansh.

At Food On The Move, we offer snacks that blend taste, texture, and imagination — designed for today's fast-paced generation who love convenience but still appreciate authenticity. Our signature touch of Bollywood-inspired creativity and packaging makes snacking a more engaging experience.

Snack Smart. Snack Bold. Snack Food On The Move.

As a young brand, we're focused on progress, not pressure — growing one step at a time, staying true to our values of transparency, inclusion, and consistency.`;

function ReadMoreModal({
  title,
  shortText,
  fullText,
}: {
  title: string;
  shortText: string;
  fullText: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <p className="text-muted-foreground leading-relaxed">{shortText}</p>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 mt-2 text-primary font-medium text-sm hover:text-primary/80 transition-colors"
      >
        Read more
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-cinematic">{title}</DialogTitle>
            <DialogDescription className="sr-only">{title} details</DialogDescription>
          </DialogHeader>
          <div className="text-muted-foreground leading-relaxed whitespace-pre-line text-sm">
            {fullText}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function AboutSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="about" className="py-24 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px]" />

      <div className="section-container" ref={ref}>
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <span className="font-cinematic text-primary font-medium uppercase tracking-[0.3em] text-sm">
            About Us
          </span>
          <h2 className="font-cinematic text-5xl md:text-6xl lg:text-7xl mt-4 text-foreground font-bold italic">
            The Vision & <span className="text-gradient not-italic">Inspiration</span>
          </h2>
        </motion.div>

        {/* Founders Section */}
        <div className="mb-20">
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="font-cinematic text-2xl md:text-3xl text-foreground mb-8 font-semibold"
          >
            Meet the Founders
          </motion.h3>

          <div className="grid md:grid-cols-2 gap-8 lg:gap-12 mb-8">
            {/* Vedaansh */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7 }}
              className="flex flex-col"
            >
              <div className="rounded-2xl overflow-hidden border-2 border-primary/30 shadow-xl mb-5 aspect-[4/5]">
                <img
                  src={vedaanshPhoto}
                  alt="Vedaansh Shah — Founder of Food On The Move"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-5 bg-card/50 rounded-xl border border-border/30">
                <h4 className="font-cinematic text-xl text-foreground mb-1 font-semibold">Vedaansh Shah</h4>
                <p className="text-primary font-medium text-sm mb-3">Founder, Seven Chakras India</p>
                <ReadMoreModal
                  title="Vedaansh Shah — Founder"
                  shortText="At just 19, a first-generation entrepreneur who spent over a year studying the FMCG industry before launching Food on the Move in August 2025 — turning challenges into opportunities and ideas into impact."
                  fullText={vedaanshFull}
                />
              </div>
            </motion.div>

            {/* Bhawna */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="flex flex-col"
            >
              <div className="rounded-2xl overflow-hidden border-2 border-primary/30 shadow-xl mb-5 aspect-[4/5]">
                <img
                  src={bhawnaPhoto}
                  alt="Bhawna Shah — Co-Founder of Food On The Move"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-5 bg-card/50 rounded-xl border border-border/30">
                <h4 className="font-cinematic text-xl text-foreground mb-1 font-semibold">Bhawna Shah</h4>
                <p className="text-primary font-medium text-sm mb-3">Co-Founder</p>
                <ReadMoreModal
                  title="Bhawna Shah — Co-Founder"
                  shortText="The emotional backbone of the brand and an active partner in building the venture — involved in everything from pitching and brand vision to packing and design."
                  fullText={bhawnaFull}
                />
              </div>
            </motion.div>
          </div>

          <blockquote className="text-muted-foreground italic border-l-4 border-primary/40 pl-5 py-2 max-w-3xl">
            "A mother-son duo building not just a business, but a value-driven venture rooted in trust, resilience, and shared ambition."
          </blockquote>
        </div>

        {/* Our Story Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mb-20"
        >
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6 text-muted-foreground leading-relaxed">
              <div>
                <h4 className="font-cinematic text-xl md:text-2xl text-foreground mb-3 font-semibold italic">Our Story</h4>
                <p>
                  Food On The Move — a registered trademark of Seven Chakras India —
                  was founded in 2024 by Vedaansh Shah, a young entrepreneur driven by a passion
                  to bring freshness, creativity, and excitement to the snacking world.
                </p>
              </div>

              <blockquote className="font-cinematic text-lg md:text-xl italic border-l-4 border-primary/50 pl-6 py-2 text-foreground/90">
                "We wanted to offer something that truly connects with people — snacks that are enjoyable,
                flavourful, and made for modern lifestyles."
                <cite className="block mt-3 text-primary font-medium not-italic text-base">— Vedaansh Shah</cite>
              </blockquote>
            </div>

            <div className="space-y-6 text-muted-foreground leading-relaxed">
              <div>
                <h4 className="font-cinematic text-xl md:text-2xl text-foreground mb-3 font-semibold italic">Our Philosophy</h4>
                <p>
                  At Food On The Move, we offer snacks that blend taste, texture, and imagination,
                  designed for today's fast-paced generation who love convenience but still appreciate authenticity.
                </p>
              </div>

              <div className="p-6 bg-card/50 border border-border/30 rounded-2xl">
                <p className="font-cinematic text-2xl text-foreground mb-2 font-semibold italic">
                  Snack Smart. Snack Bold.
                </p>
                <p className="font-cinematic text-primary font-medium mb-3">Snack Food On The Move.</p>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Today, our products are available in 50+ general trade stores, and we're steadily growing
                  through word of mouth, creativity, and strong relationships with our partners and customers.
                </p>
                <button
                  onClick={() => {
                    const el = document.getElementById("our-story-modal-trigger");
                    el?.click();
                  }}
                  className="inline-flex items-center gap-1 mt-3 text-primary font-medium text-sm hover:text-primary/80 transition-colors"
                >
                  Read full story
                </button>
              </div>
            </div>
          </div>
          {/* Hidden trigger for Our Story modal */}
          <OurStoryModal />
        </motion.div>

        {/* What Makes Us Different */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mb-16"
        >
          <h3 className="font-cinematic text-3xl md:text-4xl mb-8 text-foreground font-bold text-center">
            What Makes Us <span className="text-gradient italic">Different</span>
          </h3>

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="flex flex-col items-center text-center p-5 rounded-xl bg-card/30 hover:bg-card/50 border border-border/20 transition-colors duration-300"
              >
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <value.icon className="w-7 h-7 text-primary" />
                </div>
                <h4 className="font-cinematic font-semibold text-foreground text-lg mb-2">{value.title}</h4>
                <p className="text-muted-foreground text-sm">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.6 }}
          className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8"
        >
          {[
            { value: "2025", label: "Launched" },
            { value: "50+", label: "Retail Partners" },
            { value: "4", label: "Signature Products" },
            { value: "∞", label: "Smiles Delivered" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="font-cinematic text-4xl md:text-5xl lg:text-6xl text-gradient mb-2 font-bold">
                {stat.value}
              </p>
              <p className="text-muted-foreground text-sm uppercase tracking-wider">
                {stat.label}
              </p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function OurStoryModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        id="our-story-modal-trigger"
        onClick={() => setOpen(true)}
        className="hidden"
        aria-hidden
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-cinematic text-xl">Our Story</DialogTitle>
            <DialogDescription className="sr-only">The complete story of Food On The Move</DialogDescription>
          </DialogHeader>
          <div className="text-muted-foreground leading-relaxed whitespace-pre-line text-sm">
            {ourStoryFull}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

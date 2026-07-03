import { useState } from "react";
import { motion } from "framer-motion";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const COMPANY_EMAIL = "sevenchakras.india@gmail.com";

export function EnquiryForm() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    userType: "",
    message: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.phone || !formData.userType || !formData.message) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const subject = encodeURIComponent(
      `Enquiry from ${formData.name} (${formData.userType})`
    );
    const body = encodeURIComponent(
      `Name: ${formData.name}\nEmail: ${formData.email}\nPhone: ${formData.phone}\nType: ${formData.userType}\n\nMessage:\n${formData.message}`
    );

    window.location.href = `mailto:${COMPANY_EMAIL}?subject=${subject}&body=${body}`;

    toast({
      title: "Opening email client",
      description: "Your default email app will open with the enquiry details.",
    });
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-card/50 border border-border/30 rounded-2xl p-6 md:p-8 space-y-5"
    >
      <h3 className="font-display text-2xl text-foreground mb-2">
        Send Us a Message
      </h3>
      <p className="text-muted-foreground text-sm mb-6">
        Fill in the form below and we'll get back to you soon.
      </p>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium text-foreground">
            Name <span className="text-primary">*</span>
          </label>
          <Input
            id="name"
            name="name"
            placeholder="Your name"
            value={formData.name}
            onChange={handleChange}
            required
            className="bg-background/50 border-border/50 focus:border-primary"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-foreground">
            Email <span className="text-primary">*</span>
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="your@email.com"
            value={formData.email}
            onChange={handleChange}
            required
            className="bg-background/50 border-border/50 focus:border-primary"
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="phone" className="text-sm font-medium text-foreground">
            Phone <span className="text-primary">*</span>
          </label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            placeholder="+91 XXXXX XXXXX"
            value={formData.phone}
            onChange={handleChange}
            required
            className="bg-background/50 border-border/50 focus:border-primary"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="userType" className="text-sm font-medium text-foreground">
            Who are you? <span className="text-primary">*</span>
          </label>
          <Select
            value={formData.userType}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, userType: value }))}
            required
          >
            <SelectTrigger className="bg-background/50 border-border/50 focus:border-primary">
              <SelectValue placeholder="Select your type" />
            </SelectTrigger>
            <SelectContent className="bg-background border-border">
              <SelectItem value="Retailer">Retailer</SelectItem>
              <SelectItem value="Wholesaler">Wholesaler</SelectItem>
              <SelectItem value="Distributor">Distributor</SelectItem>
              <SelectItem value="Customer">Customer</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="message" className="text-sm font-medium text-foreground">
          Message <span className="text-primary">*</span>
        </label>
        <Textarea
          id="message"
          name="message"
          placeholder="Tell us how we can help you..."
          value={formData.message}
          onChange={handleChange}
          required
          rows={4}
          className="bg-background/50 border-border/50 focus:border-primary resize-none"
        />
      </div>

      <Button type="submit" variant="hero" size="lg" className="w-full">
        <Send className="mr-2 h-4 w-4" />
        Send Enquiry
      </Button>
    </motion.form>
  );
}

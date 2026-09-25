import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  UploadCloud,
  Plus,
  Trash2,
  Star,
  RefreshCw,
  Image as ImageIcon,
  RotateCcw,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CatalogProduct, DEFAULT_PRODUCT_IMAGES } from "@/lib/catalog";
import {
  uploadProductImage,
  deleteProductImageFromStorage,
  updateProductImages,
} from "@/lib/inventory";

interface ManagePicturesModalProps {
  product: CatalogProduct | null;
  isOpen: boolean;
  onClose: () => void;
  customImages?: string[] | null;
}

export function ManagePicturesModal({
  product,
  isOpen,
  onClose,
  customImages,
}: ManagePicturesModalProps) {
  const [mounted, setMounted] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [isSavingUrl, setIsSavingUrl] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [actionInProgressIndex, setActionInProgressIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!product) return null;

  const defaultImages = DEFAULT_PRODUCT_IMAGES[product.slug] || [product.image];
  const hasCustomImages = Array.isArray(customImages) && customImages.length > 0;
  const currentImages = hasCustomImages ? customImages! : defaultImages;

  // Handle uploading files directly to Supabase Storage and saving to database
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgressText(`Uploading ${i + 1} of ${files.length}...`);

        // Validate file type
        if (!file.type.startsWith("image/")) {
          toast.error(`Skipped ${file.name}: only image files are supported.`);
          continue;
        }

        // Limit file size to 15MB
        if (file.size > 15 * 1024 * 1024) {
          toast.error(`Skipped ${file.name}: file exceeds 15MB size limit.`);
          continue;
        }

        const res = await uploadProductImage(product.slug, file);
        if (res.success && res.url) {
          uploadedUrls.push(res.url);
        } else {
          toast.error(`Failed to upload ${file.name}: ${res.error || "Upload error"}`);
        }
      }

      if (uploadedUrls.length > 0) {
        // If starting from default images, create a custom array with existing defaults + new uploads
        const baseList = hasCustomImages ? [...customImages!] : [...defaultImages];
        const nextList = [...baseList, ...uploadedUrls];

        const dbRes = await updateProductImages(product.slug, nextList);
        if (dbRes.success) {
          toast.success(`Successfully uploaded and saved ${uploadedUrls.length} image(s)!`);
        } else {
          toast.error(`Uploaded but failed to update database: ${dbRes.error}`);
        }
      }
    } finally {
      setIsUploading(false);
      setUploadProgressText("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Handle adding an image by direct URL
  const handleAddUrl = async () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;

    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://") && !trimmed.startsWith("/")) {
      toast.error("Please enter a valid URL starting with https:// or /");
      return;
    }

    setIsSavingUrl(true);
    try {
      const baseList = hasCustomImages ? [...customImages!] : [...defaultImages];
      const nextList = [...baseList, trimmed];

      const res = await updateProductImages(product.slug, nextList);
      if (res.success) {
        toast.success("Picture URL added successfully!");
        setUrlInput("");
      } else {
        toast.error(`Failed to add URL: ${res.error}`);
      }
    } finally {
      setIsSavingUrl(false);
    }
  };

  // Handle removing a picture
  const handleRemoveImage = async (imageUrl: string, index: number) => {
    setActionInProgressIndex(index);
    try {
      // If we are currently showing default images, convert to custom array first
      const baseList = hasCustomImages ? [...customImages!] : [...defaultImages];
      const nextList = baseList.filter((_, i) => i !== index);

      // Attempt to clean up storage if it was uploaded to Supabase Storage
      await deleteProductImageFromStorage(imageUrl);

      const res = await updateProductImages(product.slug, nextList);
      if (res.success) {
        toast.success("Picture removed from product!");
      } else {
        toast.error(`Failed to remove picture: ${res.error}`);
      }
    } finally {
      setActionInProgressIndex(null);
    }
  };

  // Handle setting a picture as the main cover (moves to position 0)
  const handleSetAsCover = async (index: number) => {
    if (index === 0) return;
    setActionInProgressIndex(index);
    try {
      const baseList = hasCustomImages ? [...customImages!] : [...defaultImages];
      const selected = baseList[index];
      const remaining = baseList.filter((_, i) => i !== index);
      const nextList = [selected, ...remaining];

      const res = await updateProductImages(product.slug, nextList);
      if (res.success) {
        toast.success(`Set as main cover picture!`);
      } else {
        toast.error(`Failed to update cover picture: ${res.error}`);
      }
    } finally {
      setActionInProgressIndex(null);
    }
  };

  // Handle resetting to default product photography
  const handleResetToDefaults = async () => {
    if (!window.confirm(`Reset "${product.name}" pictures back to default packaging photos?`)) {
      return;
    }

    setIsResetting(true);
    try {
      const res = await updateProductImages(product.slug, []);
      if (res.success) {
        toast.success(`Reset pictures to default packaging photos!`);
      } else {
        toast.error(`Failed to reset: ${res.error}`);
      }
    } finally {
      setIsResetting(false);
    }
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="relative w-full max-w-3xl bg-card border border-border/80 rounded-3xl p-5 sm:p-7 shadow-2xl overflow-hidden z-10 my-auto flex flex-col max-h-[90vh]"
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-border/60">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-primary/10 text-primary border border-primary/20 shrink-0">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground">
                      {product.name}
                    </h2>
                    {hasCustomImages ? (
                      <Badge variant="default" className="text-[10px] bg-primary text-primary-foreground font-semibold">
                        Custom Photos ({currentImages.length})
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px] font-semibold">
                        Default Packaging Photos ({currentImages.length})
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                    Slug: {product.slug} • Database & Cloud Synced
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-full bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                title="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Gallery Content */}
            <div className="overflow-y-auto flex-1 py-5 pr-1 -mr-1 space-y-6">
              {/* Pictures Grid */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs uppercase tracking-wider font-bold text-muted-foreground">
                    Current Pictures ({currentImages.length})
                  </h3>
                  {hasCustomImages && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={isResetting}
                      onClick={handleResetToDefaults}
                      className="text-xs text-muted-foreground hover:text-destructive h-7 px-2 gap-1.5"
                    >
                      {isResetting ? <RefreshCw className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
                      Reset to Default Photos
                    </Button>
                  )}
                </div>

                {currentImages.length === 0 ? (
                  <div className="p-8 text-center border-2 border-dashed border-border rounded-2xl bg-muted/20">
                    <ImageIcon className="w-10 h-10 mx-auto text-muted-foreground/40 mb-2" />
                    <p className="text-sm text-muted-foreground">No pictures for this product.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
                    {currentImages.map((imgUrl, idx) => {
                      const isCover = idx === 0;
                      const isWorking = actionInProgressIndex === idx;

                      return (
                        <div
                          key={`${imgUrl}-${idx}`}
                          className={`relative group bg-background border rounded-2xl p-2.5 flex flex-col justify-between overflow-hidden transition-all shadow-xs ${
                            isCover ? "border-primary ring-2 ring-primary/20" : "border-border/70 hover:border-border"
                          }`}
                        >
                          {/* Image Box */}
                          <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-muted/30 flex items-center justify-center p-2 mb-2">
                            <img
                              src={imgUrl}
                              alt={`${product.name} - view ${idx + 1}`}
                              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                            />
                            {isCover && (
                              <div className="absolute top-1.5 left-1.5 bg-primary text-primary-foreground font-black text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-md shadow-sm flex items-center gap-1 z-10">
                                <Star className="w-2.5 h-2.5 fill-current" />
                                <span>Main Cover</span>
                              </div>
                            )}
                            <span className="absolute bottom-1 right-1 bg-black/60 text-white font-mono text-[9px] px-1.5 py-0.5 rounded backdrop-blur-xs">
                              #{idx + 1}
                            </span>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-1.5 pt-1 border-t border-border/40">
                            {!isCover && (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={isWorking || isUploading}
                                onClick={() => handleSetAsCover(idx)}
                                className="flex-1 h-7 text-[11px] font-semibold px-1 rounded-lg gap-1 border-border/80 hover:bg-primary/10 hover:text-primary"
                                title="Set as primary cover photo"
                              >
                                {isWorking ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Star className="w-3 h-3" />}
                                Cover
                              </Button>
                            )}

                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              disabled={isWorking || isUploading || currentImages.length <= 1}
                              onClick={() => handleRemoveImage(imgUrl, idx)}
                              className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 ml-auto"
                              title={currentImages.length <= 1 ? "At least one picture required" : "Remove this picture"}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Add Pictures Section */}
              <div className="pt-4 border-t border-border/60 space-y-4">
                <h3 className="text-xs uppercase tracking-wider font-bold text-muted-foreground">
                  Add Pictures
                </h3>

                {/* Upload File Zone */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-primary/30 hover:border-primary/60 bg-primary/5 hover:bg-primary/10 transition-all rounded-2xl p-6 text-center cursor-pointer group"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={isUploading}
                  />

                  {isUploading ? (
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-8 h-8 text-primary animate-spin" />
                      <p className="text-sm font-semibold text-foreground">{uploadProgressText || "Uploading to Cloud..."}</p>
                      <p className="text-xs text-muted-foreground">Uploading directly to Supabase storage bucket</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="p-3 bg-primary/10 rounded-full text-primary group-hover:scale-110 transition-transform">
                        <UploadCloud className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-bold text-foreground">
                        Click or drag images to upload
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Supports PNG, JPG, JPEG, and WebP (Multiple files allowed)
                      </p>
                    </div>
                  )}
                </div>

                {/* Add via URL */}
                <div className="bg-background border border-border/80 rounded-2xl p-3.5 space-y-2">
                  <p className="text-xs font-semibold text-foreground">Or attach an existing image URL:</p>
                  <div className="flex items-center gap-2">
                    <Input
                      type="url"
                      placeholder="https://example.com/photo.webp or /assets/photo.webp"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      disabled={isSavingUrl || isUploading}
                      className="text-xs font-mono rounded-xl h-9"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          void handleAddUrl();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      size="sm"
                      disabled={!urlInput.trim() || isSavingUrl || isUploading}
                      onClick={handleAddUrl}
                      className="h-9 px-3.5 rounded-xl text-xs font-bold shrink-0 gap-1.5"
                    >
                      {isSavingUrl ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                      Add URL
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-border/60 flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Auto-persisted to Supabase Database & Cloud Storage</span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                className="rounded-xl px-4 h-9 font-semibold"
              >
                Done
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return mounted ? createPortal(modalContent, document.body) : null;
}

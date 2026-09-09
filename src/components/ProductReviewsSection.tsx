import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, MessageSquarePlus, CheckCircle2, User, ThumbsUp, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useProductReviews } from "@/lib/reviews";
import { useAuth } from "@/hooks/use-auth";

interface ProductReviewsSectionProps {
  productSlug: string;
  productName: string;
}

export function ProductReviewsSection({ productSlug, productName }: ProductReviewsSectionProps) {
  const { user } = useAuth();
  const { reviews, stats, loading, postReview } = useProductReviews(productSlug);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [userName, setUserName] = useState("");
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const effectiveRating = hoverRating ?? rating;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      setErrorMsg("Please write a few words about your experience.");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");

    try {
      const authorName = userName.trim() || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Snack Lover";
      await postReview({
        user_name: authorName,
        rating,
        title: title.trim(),
        comment: comment.trim(),
        user_id: user?.id ?? null,
      });

      setSubmittedSuccess(true);
      setTitle("");
      setComment("");
      setTimeout(() => {
        setIsFormOpen(false);
        setSubmittedSuccess(false);
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="py-16 bg-gradient-to-b from-card/30 via-background to-card/20 border-t border-border/40">
      <div className="section-container max-w-5xl">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10 pb-6 border-b border-border/40">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" /> Customer Ratings & Reviews
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
              REAL REVIEWS FROM <span className="text-gradient">REAL SNACKERS</span>
            </h2>
            <p className="text-muted-foreground text-sm mt-1.5">
              Honest thoughts and ratings on {productName}.
            </p>
          </div>

          <Button
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl px-5 py-2.5 shadow-md shadow-primary/20 gap-2 shrink-0 cursor-pointer"
          >
            <MessageSquarePlus className="w-4 h-4" />
            {isFormOpen ? "Cancel Review" : "Write a Review"}
          </Button>
        </div>

        {/* Rating Breakdown & Summary Box */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {/* Average Rating Score */}
          <div className="bg-card border border-border/60 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-xs">
            {stats.totalReviews > 0 ? (
              <>
                <span className="text-5xl font-black text-foreground font-display">
                  {stats.averageRating.toFixed(1)}
                </span>
                <div className="flex items-center gap-1 text-amber-400 my-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-5 h-5 ${
                        s <= Math.round(stats.averageRating)
                          ? "fill-amber-400 text-amber-400"
                          : "fill-muted text-muted"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground font-medium">
                  Based on {stats.totalReviews} {stats.totalReviews === 1 ? "review" : "reviews"}
                </p>
              </>
            ) : (
              <div className="py-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
                  <Star className="w-6 h-6" />
                </div>
                <p className="font-bold text-foreground text-sm">No reviews yet</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
                  Be the very first one to taste and rate this snack!
                </p>
              </div>
            )}
          </div>

          {/* Rating Distribution Bar Breakdown */}
          <div className="bg-card border border-border/60 rounded-2xl p-6 md:col-span-2 flex flex-col justify-center space-y-2 shadow-xs">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = stats.distribution[star] || 0;
              const pct = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1 w-14 shrink-0 text-muted-foreground font-semibold">
                    <span>{star}</span>
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  </div>
                  <div className="flex-1 bg-muted/40 rounded-full h-2.5 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.5 }}
                      className="bg-primary h-full rounded-full"
                    />
                  </div>
                  <span className="w-8 text-right text-muted-foreground font-medium">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Review Submission Form Drawer / Card */}
        <AnimatePresence>
          {isFormOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-12"
            >
              <div className="bg-card border border-primary/30 rounded-3xl p-6 sm:p-8 shadow-xl shadow-primary/5">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-display text-xl sm:text-2xl font-black text-foreground">
                    Share Your Honest Feedback
                  </h3>
                  <span className="text-xs text-muted-foreground">Organic Customer Review</span>
                </div>

                {submittedSuccess ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-8 text-center bg-primary/10 rounded-2xl border border-primary/30"
                  >
                    <CheckCircle2 className="w-12 h-12 text-primary mx-auto mb-3" />
                    <h4 className="font-display text-lg font-bold text-foreground">Thank You!</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Your organic review for {productName} has been submitted successfully.
                    </p>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Interactive Star Picker */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                        Your Rating
                      </label>
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(null)}
                            className="p-1 cursor-pointer transition-transform hover:scale-125 focus:outline-hidden"
                            aria-label={`Rate ${star} star`}
                          >
                            <Star
                              className={`w-7 h-7 sm:w-8 sm:h-8 transition-colors ${
                                star <= effectiveRating
                                  ? "fill-amber-400 text-amber-400"
                                  : "fill-muted/50 text-muted-foreground/30 hover:fill-amber-300/40"
                              }`}
                            />
                          </button>
                        ))}
                        <span className="text-xs font-bold text-foreground ml-3 px-2.5 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-md">
                          {effectiveRating === 5 && "⭐ Outstanding / 5 Stars"}
                          {effectiveRating === 4 && "⭐ Very Good / 4 Stars"}
                          {effectiveRating === 3 && "⭐ Average / 3 Stars"}
                          {effectiveRating === 2 && "⭐ Below Average / 2 Stars"}
                          {effectiveRating === 1 && "⭐ Poor / 1 Star"}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Name Input */}
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                          Your Name (Optional)
                        </label>
                        <Input
                          placeholder={user?.user_metadata?.full_name || "e.g. Rahul Sharma"}
                          value={userName}
                          onChange={(e) => setUserName(e.target.value)}
                          className="bg-background border-border/70 rounded-xl"
                        />
                      </div>

                      {/* Headline / Title */}
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                          Review Headline (Optional)
                        </label>
                        <Input
                          placeholder="e.g. Super crunchy and zero guilt!"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          className="bg-background border-border/70 rounded-xl"
                        />
                      </div>
                    </div>

                    {/* Comment Area */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                        Your Detailed Review <span className="text-primary">*</span>
                      </label>
                      <Textarea
                        rows={4}
                        placeholder="What did you like or dislike? How was the crunch, flavor, and texture?"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="bg-background border-border/70 rounded-xl resize-none"
                        required
                      />
                    </div>

                    {errorMsg && (
                      <p className="text-xs text-destructive font-medium">{errorMsg}</p>
                    )}

                    <div className="flex justify-end gap-3 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsFormOpen(false)}
                        className="rounded-xl"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={submitting}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl px-7 shadow-md shadow-primary/20"
                      >
                        {submitting ? "Publishing..." : "Submit Review"}
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reviews List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              Loading reviews...
            </div>
          ) : reviews.length === 0 ? (
            <div className="bg-card border border-border/50 rounded-3xl p-10 text-center">
              <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                <MessageSquarePlus className="w-7 h-7" />
              </div>
              <h3 className="font-display text-lg font-bold text-foreground">
                No organic customer reviews yet
              </h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1 mb-6">
                Have you tried {productName}? Help other snackers by sharing your experience and rating.
              </p>
              <Button
                onClick={() => setIsFormOpen(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl px-6 py-2.5 shadow-md shadow-primary/20"
              >
                Write First Review
              </Button>
            </div>
          ) : (
            reviews.map((rev) => (
              <motion.div
                key={rev.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card border border-border/60 rounded-2xl p-5 sm:p-6 shadow-xs hover:border-border transition-colors"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/15 text-primary font-bold flex items-center justify-center shrink-0 uppercase text-sm border border-primary/25">
                      {rev.user_name.charAt(0) || <User className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground text-sm">
                          {rev.user_name}
                        </span>
                        <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          Organic Review
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(rev.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Stars Pill */}
                  <div className="flex items-center gap-1 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 text-amber-500">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${
                          s <= rev.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"
                        }`}
                      />
                    ))}
                    <span className="text-xs font-bold ml-1 text-amber-600 dark:text-amber-400">
                      {rev.rating}.0
                    </span>
                  </div>
                </div>

                {rev.title && (
                  <h4 className="font-display font-bold text-foreground text-sm sm:text-base mb-1.5">
                    {rev.title}
                  </h4>
                )}

                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {rev.comment}
                </p>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

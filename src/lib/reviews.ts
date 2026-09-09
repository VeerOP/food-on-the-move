import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ProductReview {
  id: string;
  product_slug: string;
  user_id?: string | null;
  user_name: string;
  rating: number; // 1 to 5
  title?: string;
  comment: string;
  created_at: string;
}

const STORAGE_KEY = "fomo_organic_reviews_v1";

// Helper: load local reviews cache
function getLocalReviews(): ProductReview[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// Helper: save local reviews
function saveLocalReviews(reviews: ProductReview[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
  } catch (e) {
    console.error("Failed to save local reviews", e);
  }
}

// Global event bus so all components update immediately on new review
const REVIEW_UPDATED_EVENT = "fomo_reviews_updated";

function notifyReviewUpdated() {
  window.dispatchEvent(new CustomEvent(REVIEW_UPDATED_EVENT));
}

/**
 * Fetch reviews for a specific product or all products.
 * Tries Supabase first; seamlessly merges with and falls back to LocalStorage.
 */
export async function fetchReviewsForProduct(productSlug: string): Promise<ProductReview[]> {
  const localList = getLocalReviews().filter((r) => r.product_slug === productSlug);

  try {
    const { data, error } = await supabase
      .from("product_reviews" as any)
      .select("*")
      .eq("product_slug", productSlug)
      .order("created_at", { ascending: false });

    if (error || !data) {
      return localList;
    }

    // Merge supabase data with local items (avoiding duplicates)
    const combined = [...(data as unknown as ProductReview[])];
    localList.forEach((local) => {
      if (!combined.some((c) => c.id === local.id)) {
        combined.unshift(local);
      }
    });

    return combined;
  } catch {
    return localList;
  }
}

/**
 * Submit an organic user review.
 */
export async function submitProductReview(reviewData: {
  product_slug: string;
  user_id?: string | null;
  user_name: string;
  rating: number;
  title?: string;
  comment: string;
}): Promise<ProductReview> {
  const newReview: ProductReview = {
    id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `review_${Date.now()}`,
    product_slug: reviewData.product_slug,
    user_id: reviewData.user_id || null,
    user_name: reviewData.user_name.trim() || "Anonymous Snacker",
    rating: Math.max(1, Math.min(5, Math.round(reviewData.rating))),
    title: reviewData.title?.trim() || "",
    comment: reviewData.comment.trim(),
    created_at: new Date().toISOString(),
  };

  // Always save locally immediately for instant feedback
  const local = getLocalReviews();
  saveLocalReviews([newReview, ...local]);
  notifyReviewUpdated();

  // Also try to persist to Supabase
  try {
    await supabase.from("product_reviews" as any).insert({
      id: newReview.id,
      product_slug: newReview.product_slug,
      user_id: newReview.user_id,
      user_name: newReview.user_name,
      rating: newReview.rating,
      title: newReview.title,
      comment: newReview.comment,
      created_at: newReview.created_at,
    });
  } catch (err) {
    console.warn("Supabase review insert fallback to local:", err);
  }

  return newReview;
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  distribution: { [star: number]: number };
}

export function computeReviewStats(reviews: ProductReview[]): ReviewStats {
  if (!reviews || reviews.length === 0) {
    return {
      averageRating: 0,
      totalReviews: 0,
      distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    };
  }

  const distribution: { [star: number]: number } = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let sum = 0;

  reviews.forEach((r) => {
    const star = Math.max(1, Math.min(5, Math.round(r.rating)));
    distribution[star] = (distribution[star] || 0) + 1;
    sum += star;
  });

  const avg = Number((sum / reviews.length).toFixed(1));

  return {
    averageRating: avg,
    totalReviews: reviews.length,
    distribution,
  };
}

/**
 * React Hook for single product reviews and submission
 */
export function useProductReviews(productSlug?: string) {
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);

  const loadReviews = useCallback(async () => {
    if (!productSlug) {
      setReviews([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const data = await fetchReviewsForProduct(productSlug);
    setReviews(data);
    setLoading(false);
  }, [productSlug]);

  useEffect(() => {
    loadReviews();

    const handler = () => {
      loadReviews();
    };

    window.addEventListener(REVIEW_UPDATED_EVENT, handler);
    return () => {
      window.removeEventListener(REVIEW_UPDATED_EVENT, handler);
    };
  }, [loadReviews]);

  const stats = computeReviewStats(reviews);

  const postReview = async (data: {
    user_name: string;
    rating: number;
    title?: string;
    comment: string;
    user_id?: string | null;
  }) => {
    if (!productSlug) return;
    const created = await submitProductReview({
      ...data,
      product_slug: productSlug,
    });
    setReviews((prev) => [created, ...prev.filter((r) => r.id !== created.id)]);
    return created;
  };

  return {
    reviews,
    stats,
    loading,
    postReview,
    refresh: loadReviews,
  };
}

/**
 * React Hook to get real organic review stats for a given product (lightweight for cards)
 */
export function useProductStats(productSlug: string) {
  const [stats, setStats] = useState<{ average: number; count: number }>(() => {
    const local = getLocalReviews().filter((r) => r.product_slug === productSlug);
    const s = computeReviewStats(local);
    return { average: s.averageRating, count: s.totalReviews };
  });

  const calculate = useCallback(async () => {
    const items = await fetchReviewsForProduct(productSlug);
    const s = computeReviewStats(items);
    setStats({ average: s.averageRating, count: s.totalReviews });
  }, [productSlug]);

  useEffect(() => {
    calculate();

    const handler = () => {
      calculate();
    };

    window.addEventListener(REVIEW_UPDATED_EVENT, handler);
    return () => {
      window.removeEventListener(REVIEW_UPDATED_EVENT, handler);
    };
  }, [calculate]);

  return stats;
}

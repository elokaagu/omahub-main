import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";

export interface Review {
  id?: string;
  brand_id: string;
  author: string;
  comment: string;
  rating: number;
  date: string;
  user_id?: string | null;
  created_at?: string;
}

interface SubmitReviewResult {
  success: boolean;
  message?: string;
  review?: Review;
}

const useReviews = (brandId?: string) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Fetch reviews for a brand
  const fetchReviews = useCallback(
    async (id?: string) => {
      const targetBrandId = id || brandId;

      console.log("fetchReviews called with targetBrandId:", targetBrandId);

      if (!targetBrandId) {
        console.log("No brand ID provided, skipping fetch");
        setReviews([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        console.log(
          `Fetching reviews from /api/reviews?brandId=${targetBrandId}`
        );
        const response = await fetch(`/api/reviews?brandId=${targetBrandId}`);

        if (!response.ok) {
          const errorData = await response.json();
          console.error("Error response from API:", errorData);
          throw new Error("Failed to fetch reviews");
        }

        const data = await response.json();
        console.log("Fetched reviews:", data.reviews);
        setReviews(data.reviews || []);
        setError(null);
      } catch (err) {
        console.error("Error fetching reviews:", err);
        setError("Failed to load reviews");
      } finally {
        setLoading(false);
      }
    },
    [brandId]
  );

  // Submit a new review
  const submitReview = useCallback(
    async (
      reviewData: Omit<Review, "date" | "user_id">
    ): Promise<SubmitReviewResult> => {
      console.log("submitReview called with data:", reviewData);
      console.log("Current user:", user);

      setSubmitting(true);
      try {
        const payload = {
          ...reviewData,
          userId: user?.id || null,
          date: new Date().toISOString().split("T")[0], // YYYY-MM-DD
        };

        console.log("Submitting review with payload:", payload);

        const response = await fetch("/api/reviews", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const responseData = await response.json();
        console.log("Response from review submission:", responseData);

        if (!response.ok) {
          console.error("Error submitting review:", responseData);
          throw new Error(responseData.error || "Failed to submit review");
        }

        // Refresh reviews list if this hook is associated with a brandId
        if (brandId) {
          console.log("Review submitted successfully, refreshing reviews");
          fetchReviews();
        }

        return {
          success: true,
          message: "Review submitted successfully",
          review: responseData.review,
        };
      } catch (err) {
        console.error("Error submitting review:", err);
        return {
          success: false,
          message:
            err instanceof Error ? err.message : "Failed to submit review",
        };
      } finally {
        setSubmitting(false);
      }
    },
    [user, brandId, fetchReviews]
  );

  // Fetch reviews on component mount if brandId is provided
  useEffect(() => {
    console.log("useReviews hook mounted with brandId:", brandId);
    if (brandId) {
      fetchReviews();
    }
  }, [brandId, fetchReviews]);

  return {
    reviews,
    loading,
    error,
    submitting,
    fetchReviews,
    submitReview,
  };
};

export default useReviews;

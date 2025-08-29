import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { StarIcon } from "@heroicons/react/24/solid";
import { StarIcon as StarOutlineIcon } from "@heroicons/react/24/outline";
import useReviews, { Review } from "@/lib/hooks/useReviews";
import { getProfile } from "@/lib/services/authService";
import { toast } from "sonner";
import Link from "next/link";

interface ReviewFormProps {
  brandId: string;
  onReviewSubmitted?: () => void;
  className?: string;
}

export function ReviewForm({
  brandId,
  onReviewSubmitted,
  className = "",
}: ReviewFormProps) {
  const { user } = useAuth();
  const { submitReview, submitting } = useReviews();

  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [initialNameSet, setInitialNameSet] = useState(false);

  // Load user profile data if logged in
  useEffect(() => {
    if (user && !initialNameSet) {
      const loadUserProfile = async () => {
        try {
          const profile = await getProfile(user.id);
          if (profile) {
            const fullName = [profile.first_name, profile.last_name]
              .filter(Boolean)
              .join(" ");

            if (fullName) {
              setName(fullName);
            } else if (user.email) {
              // Use email before @ symbol as name
              setName(user.email.split("@")[0]);
            }
          }
          setInitialNameSet(true);
        } catch (error) {
          console.error("Error loading user profile:", error);
          setInitialNameSet(true);
        }
      };

      loadUserProfile();
    } else if (!user) {
      setInitialNameSet(true);
    }
  }, [user, initialNameSet]);

  // If user is not authenticated, show message to sign in
  if (!user) {
    return (
      <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
        <div className="text-center py-8">
          <h3 className="text-lg font-semibold mb-4">Authentication Required</h3>
          <p className="text-gray-600 mb-6">
            You need to be signed in to write a review.
          </p>
          <Link href="/login">
            <Button className="bg-oma-plum hover:bg-oma-plum/90 text-white">
              Sign In to Review
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const resetForm = () => {
    // Only reset name if user is not logged in
    if (!user) {
      setName("");
    }
    setComment("");
    setRating(0);
    setHoverRating(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }

    if (!comment.trim()) {
      toast.error("Please enter your review");
      return;
    }

    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    const reviewData: Omit<Review, "date" | "user_id"> = {
      brand_id: brandId,
      author: name.trim(),
      comment: comment.trim(),
      rating,
    };

    const result = await submitReview(reviewData);

    if (result.success) {
      toast.success("Thank you for sharing your experience!");

      // Reset form
      resetForm();

      // Call callback if provided
      if (onReviewSubmitted) {
        onReviewSubmitted();
      }
    } else {
      toast.error(result.message || "Failed to submit review");
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
      <h3 className="text-lg font-semibold mb-4">Write a Review</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Your Name
          </label>
          <Input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            className="w-full"
            required
          />
        </div>

        <div>
          <label
            htmlFor="rating"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Rating
          </label>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="text-yellow-400 hover:text-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-1 rounded transition-colors"
                aria-label={`Rate ${star} stars`}
              >
                {star <= (hoverRating || rating) ? (
                  <StarIcon className="w-6 h-6" />
                ) : (
                  <StarOutlineIcon className="w-6 h-6" />
                )}
              </button>
            ))}
            <span className="ml-2 text-sm text-gray-500">
              {rating > 0
                ? `${rating} star${rating !== 1 ? "s" : ""}`
                : "Select a rating"}
            </span>
          </div>
        </div>

        <div>
          <label
            htmlFor="comment"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Your Review
          </label>
          <Textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience with this brand..."
            className="w-full min-h-[120px] resize-none"
            required
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            type="submit"
            disabled={submitting}
            className="bg-oma-plum hover:bg-oma-plum/90 text-white flex-1 sm:flex-none"
          >
            {submitting ? "Submitting..." : "Submit Review"}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={resetForm}
            disabled={submitting}
            className="flex-1 sm:flex-none"
          >
            Clear
          </Button>
        </div>
      </form>
    </div>
  );
}

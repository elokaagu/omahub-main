"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ReviewForm } from "@/components/ui/review-form";
import { ReviewDisplay } from "@/components/ui/review-display";
import { Skeleton } from "@/components/ui/skeleton";
import type { Review } from "@/lib/hooks/useReviews";

interface BrandReviewsSectionProps {
  user: unknown;
  showReviewForm: boolean;
  brandId: string;
  reviewsLoading: boolean;
  reviewsError: string | null;
  reviews: Review[];
  onShowReviewForm: () => void;
  onCancelReviewForm: () => void;
  onReviewSubmitted: () => void;
  onReviewAdded: (review: Review) => void;
}

export function BrandReviewsSection({
  user,
  showReviewForm,
  brandId,
  reviewsLoading,
  reviewsError,
  reviews,
  onShowReviewForm,
  onCancelReviewForm,
  onReviewSubmitted,
  onReviewAdded,
}: BrandReviewsSectionProps) {
  return (
    <div
      className="my-8 sm:my-12 border border-oma-gold/20 rounded-lg p-4 sm:p-6 bg-oma-beige/30 slide-up"
      style={{ animationDelay: "300ms" }}
    >
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 gap-3 sm:gap-0">
        <h2 className="text-2xl sm:text-3xl font-canela font-normal">
          Customer Reviews
        </h2>
        {Boolean(user) && !showReviewForm && (
          <Button
            onClick={onShowReviewForm}
            className="bg-oma-plum hover:bg-oma-plum/90 text-white w-full sm:w-auto min-h-[44px] text-sm sm:text-base"
          >
            Write a Review
          </Button>
        )}
        {!Boolean(user) && (
          <div className="text-center sm:text-right">
            <p className="text-sm text-oma-cocoa mb-2">Sign in to write a review</p>
            <Link href="/login">
              <Button
                variant="outline"
                className="border-oma-plum text-oma-plum hover:bg-oma-plum hover:text-white w-full sm:w-auto min-h-[44px] text-sm sm:text-base"
              >
                Sign In
              </Button>
            </Link>
          </div>
        )}
      </div>

      {showReviewForm && Boolean(user) && (
        <div className="mb-8">
          <ReviewForm
            brandId={brandId}
            onReviewSubmitted={onReviewSubmitted}
            onReviewAdded={onReviewAdded}
            className="mb-6"
          />
          <Button variant="outline" onClick={onCancelReviewForm} className="mb-6">
            Cancel
          </Button>
        </div>
      )}

      {reviewsLoading ? (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : reviewsError ? (
        <div className="p-4 bg-red-50 text-red-600 rounded text-sm">{reviewsError}</div>
      ) : reviews.length > 0 ? (
        <div className="space-y-6">
          {reviews.map((review) => (
            <ReviewDisplay
              key={review.id}
              id={review.id}
              author={review.author}
              comment={review.comment}
              rating={review.rating}
              date={review.date}
              created_at={review.created_at}
              replies={review.replies}
              showReplies={true}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-oma-cocoa">
          <p>No reviews yet. Be the first to share your experience!</p>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Star,
  Trash2,
  MessageSquare,
  Edit,
  Send,
  Calendar,
  Building2,
  User,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface ReviewReply {
  id: string;
  reply_text: string;
  admin_id: string;
  admin_name: string;
  created_at: string;
  updated_at: string;
}

interface ReviewWithDetails {
  id: string;
  brand_id: string;
  user_id?: string;
  author: string;
  comment: string;
  rating: number;
  date: string;
  created_at: string;
  updated_at: string;
  brand_name: string;
  brand_category: string;
  replies: ReviewReply[];
}

interface ReviewsResponse {
  reviews: ReviewWithDetails[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

export default function ReviewManagementPage() {
  const { user, session } = useAuth();
  const router = useRouter();

  // State management
  const [reviews, setReviews] = useState<ReviewWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Reply state
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [selectedReview, setSelectedReview] =
    useState<ReviewWithDetails | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [editingReply, setEditingReply] = useState<ReviewReply | null>(null);

  // Check permissions
  useEffect(() => {
    if (
      user &&
      user.role &&
      !["super_admin", "brand_admin"].includes(user.role)
    ) {
      router.push("/studio");
      return;
    }
  }, [user, router]);

  // Fetch reviews
  const fetchReviews = async (page = 1, search = "", brand = "") => {
    if (!session?.access_token) return;

    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });

      if (brand) params.append("brandId", brand);

      const response = await fetch(`/api/admin/reviews?${params}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch reviews");
      }

      const data: ReviewsResponse = await response.json();

      // Filter by search term on client side if needed
      let filteredReviews = data.reviews;
      if (search.trim()) {
        const searchLower = search.toLowerCase();
        filteredReviews = data.reviews.filter(
          (review) =>
            review.author.toLowerCase().includes(searchLower) ||
            review.comment.toLowerCase().includes(searchLower) ||
            review.brand_name.toLowerCase().includes(searchLower)
        );
      }

      setReviews(filteredReviews);
      setTotalCount(data.totalCount);
      setTotalPages(data.totalPages);
      setCurrentPage(data.currentPage);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      toast.error("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (user && session) {
      fetchReviews(1, searchTerm, selectedBrand);
    }
  }, [user, session]);

  // Handle search and filter changes
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (user && session) {
        fetchReviews(1, searchTerm, selectedBrand);
      }
    }, 500);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm, selectedBrand]);

  // Handle page changes
  const handlePageChange = (page: number) => {
    fetchReviews(page, searchTerm, selectedBrand);
  };

  // Delete review
  const handleDeleteReview = async (reviewId: string) => {
    if (!session?.access_token) return;

    try {
      setIsDeleting(reviewId);
      const response = await fetch(`/api/admin/reviews?id=${reviewId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete review");
      }

      toast.success("Review deleted successfully");
      fetchReviews(currentPage, searchTerm, selectedBrand);
    } catch (error) {
      console.error("Error deleting review:", error);
      toast.error("Failed to delete review");
    } finally {
      setIsDeleting(null);
    }
  };

  // Submit reply
  const handleSubmitReply = async () => {
    if (!session?.access_token || !selectedReview || !replyText.trim()) return;

    try {
      setIsSubmittingReply(true);
      const url = editingReply
        ? "/api/admin/reviews/replies"
        : "/api/admin/reviews/replies";

      const method = editingReply ? "PUT" : "POST";
      const body = editingReply
        ? { replyId: editingReply.id, replyText: replyText.trim() }
        : { reviewId: selectedReview.id, replyText: replyText.trim() };

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to ${editingReply ? "update" : "create"} reply`
        );
      }

      toast.success(
        `Reply ${editingReply ? "updated" : "created"} successfully`
      );
      setReplyDialogOpen(false);
      setReplyText("");
      setEditingReply(null);
      setSelectedReview(null);
      fetchReviews(currentPage, searchTerm, selectedBrand);
    } catch (error) {
      console.error("Error submitting reply:", error);
      toast.error(`Failed to ${editingReply ? "update" : "create"} reply`);
    } finally {
      setIsSubmittingReply(false);
    }
  };

  // Delete reply
  const handleDeleteReply = async (replyId: string) => {
    if (!session?.access_token) return;

    try {
      const response = await fetch(`/api/admin/reviews/replies?id=${replyId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete reply");
      }

      toast.success("Reply deleted successfully");
      fetchReviews(currentPage, searchTerm, selectedBrand);
    } catch (error) {
      console.error("Error deleting reply:", error);
      toast.error("Failed to delete reply");
    }
  };

  // Open reply dialog
  const openReplyDialog = (review: ReviewWithDetails, reply?: ReviewReply) => {
    setSelectedReview(review);
    setEditingReply(reply || null);
    setReplyText(reply?.reply_text || "");
    setReplyDialogOpen(true);
  };

  // Render stars
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? "text-oma-gold fill-oma-gold" : "text-gray-300"
        }`}
      />
    ));
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!user || !user.role) {
    return <div>Loading...</div>;
  }

  if (!["super_admin", "brand_admin"].includes(user.role)) {
    return <div>Access denied</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-canela text-oma-plum">
            Review Management
          </h1>
          <p className="text-oma-cocoa mt-1">
            {user.role === "super_admin"
              ? "Manage all reviews across the platform"
              : "Manage reviews for your brands"}
          </p>
        </div>
        <div className="text-sm text-oma-cocoa">
          Total Reviews: {totalCount}
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by author, comment, or brand..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="w-48">
              <Input
                placeholder="Filter by brand ID..."
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reviews List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-oma-plum"></div>
          <p className="mt-2 text-oma-cocoa">Loading reviews...</p>
        </div>
      ) : reviews.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-oma-cocoa">No reviews found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id} className="overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {review.brand_name}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {review.brand_category}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-oma-cocoa" />
                      <span className="font-medium">{review.author}</span>
                      <div className="flex items-center gap-1">
                        {renderStars(review.rating)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-oma-cocoa">
                      <Calendar className="h-4 w-4" />
                      {formatDate(review.created_at)}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openReplyDialog(review)}
                      className="text-oma-plum border-oma-plum hover:bg-oma-plum hover:text-white"
                    >
                      <MessageSquare className="h-4 w-4 mr-1" />
                      Reply
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={isDeleting === review.id}
                        >
                          {isDeleting === review.id ? (
                            <div className="h-4 w-4 animate-spin rounded-full border border-current border-t-transparent" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Review</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this review by{" "}
                            {review.author}? This action cannot be undone and
                            will also delete all replies.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteReview(review.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Review Comment */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-oma-black">{review.comment}</p>
                  </div>

                  {/* Replies */}
                  {review.replies && review.replies.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-medium text-oma-plum flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Admin Replies
                      </h4>
                      {review.replies.map((reply) => (
                        <div
                          key={reply.id}
                          className="bg-oma-beige/30 p-4 rounded-lg border-l-4 border-oma-plum"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="text-sm text-oma-cocoa">
                              <span className="font-medium">
                                {reply.admin_name}
                              </span>
                              <span className="mx-2">•</span>
                              <span>{formatDate(reply.created_at)}</span>
                              {reply.updated_at !== reply.created_at && (
                                <span className="text-xs ml-2">(edited)</span>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openReplyDialog(review, reply)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Delete Reply
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete this
                                      reply? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() =>
                                        handleDeleteReply(reply.id)
                                      }
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                          <p className="text-oma-black">{reply.reply_text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button
            variant="outline"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          <div className="flex items-center gap-2">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = i + 1;
              return (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  onClick={() => handlePageChange(page)}
                  className="w-10"
                >
                  {page}
                </Button>
              );
            })}
          </div>

          <Button
            variant="outline"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Reply Dialog */}
      <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingReply ? "Edit Reply" : "Reply to Review"}
            </DialogTitle>
            <DialogDescription>
              {selectedReview && (
                <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium">{selectedReview.author}</span>
                    <div className="flex items-center gap-1">
                      {renderStars(selectedReview.rating)}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    {selectedReview.comment}
                  </p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Write your reply..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="min-h-[120px]"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setReplyDialogOpen(false);
                setReplyText("");
                setEditingReply(null);
                setSelectedReview(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitReply}
              disabled={!replyText.trim() || isSubmittingReply}
              className="bg-oma-plum hover:bg-oma-plum/90"
            >
              {isSubmittingReply ? (
                <div className="h-4 w-4 animate-spin rounded-full border border-current border-t-transparent mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              {editingReply ? "Update Reply" : "Send Reply"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

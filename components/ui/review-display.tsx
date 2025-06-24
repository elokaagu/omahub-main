import { Star, MessageSquare, Calendar } from "lucide-react";
import { ReviewReply } from "@/lib/hooks/useReviews";

interface ReviewDisplayProps {
  id?: string;
  author: string;
  comment: string;
  rating: number;
  date: string;
  created_at?: string;
  replies?: ReviewReply[];
  showReplies?: boolean;
  className?: string;
}

export function ReviewDisplay({
  author,
  comment,
  rating,
  date,
  created_at,
  replies = [],
  showReplies = true,
  className = "",
}: ReviewDisplayProps) {
  // Format date helper
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div
      className={`border-b border-oma-gold/10 last:border-0 pb-4 last:pb-0 ${className}`}
    >
      {/* Review Header */}
      <div className="flex items-center mb-2">
        <div className="flex items-center">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              size={16}
              className={
                i < rating ? "text-oma-gold fill-oma-gold" : "text-oma-gold/20"
              }
            />
          ))}
        </div>
        <span className="ml-2 text-sm text-oma-cocoa">{date}</span>
      </div>

      {/* Review Content */}
      <p className="text-oma-black mb-2">{comment}</p>
      <p className="text-sm text-oma-cocoa">- {author}</p>

      {/* Admin Replies */}
      {showReplies && replies && replies.length > 0 && (
        <div className="mt-4 space-y-3">
          <h4 className="text-sm font-medium text-oma-plum flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            {replies.length === 1 ? "Admin Reply" : "Admin Replies"}
          </h4>
          {replies.map((reply) => (
            <div
              key={reply.id}
              className="bg-oma-beige/30 p-3 rounded-lg border-l-4 border-oma-plum ml-4"
            >
              <div className="flex items-center gap-2 mb-2 text-sm text-oma-cocoa">
                <span className="font-medium">{reply.admin_name}</span>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDate(reply.created_at)}</span>
                </div>
                {reply.updated_at !== reply.created_at && (
                  <span className="text-xs">(edited)</span>
                )}
              </div>
              <p className="text-oma-black text-sm">{reply.reply_text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

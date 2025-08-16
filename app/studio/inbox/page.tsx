"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase-unified";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { StudioNav } from "@/components/ui/studio-nav";
import { TrashIcon } from "@heroicons/react/24/outline";
import { RefreshCw } from "lucide-react";

interface Inquiry {
  id: string;
  brand_id: string;
  customer_name: string;
  customer_email: string;
  subject: string;
  message: string;
  inquiry_type: string;
  priority: "low" | "normal" | "high";
  status: "unread" | "read" | "replied" | "closed";
  source: string;
  created_at: string;
  brand?: {
    name: string;
  };
}

export default function StudioInboxPage() {
  const { user, loading: authLoading } = useAuth();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [inquiryToDelete, setInquiryToDelete] = useState<Inquiry | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      loadInquiries();
    }
  }, [user, authLoading]);

  // Add a ref to track if we've already loaded inquiries
  const hasLoadedInquiries = useRef(false);

  const loadInquiries = async () => {
    // Skip loading if we already have inquiries and user hasn't changed
    if (hasLoadedInquiries.current && inquiries.length > 0) {
      console.log("📧 Skipping inquiry reload - already loaded");
      return;
    }

    // Reset the ref when explicitly loading
    hasLoadedInquiries.current = false;

    try {
      const supabase = createClient();

      // Check if user is super admin
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role, owned_brands")
        .eq("id", user?.id)
        .single();

      if (profileError) {
        console.error("Error fetching user profile:", profileError);
        toast.error("Failed to load your profile");
        return;
      }

      let inquiriesQuery = supabase
        .from("inquiries")
        .select(
          `
          *,
          brand:brands(name)
        `
        )
        .order("created_at", { ascending: false });

      // If user is super admin, get all inquiries
      if (profile?.role === "super_admin") {
        console.log("🔑 Super admin access: Loading all inquiries");
        setIsSuperAdmin(true);
        // No additional filtering needed for super admin
      } else {
        setIsSuperAdmin(false);
        // Regular user: filter by owned brands
        if (!profile?.owned_brands || profile.owned_brands.length === 0) {
          setInquiries([]);
          setLoading(false);
          return;
        }

        const brandIds = profile.owned_brands;
        inquiriesQuery = inquiriesQuery.in("brand_id", brandIds);
      }

      const { data: inquiriesData, error: inquiriesError } =
        await inquiriesQuery;

      if (inquiriesError) {
        console.error("Error fetching inquiries:", inquiriesError);
        toast.error("Failed to load inquiries");
        return;
      }

      console.log(`📧 Loaded ${inquiriesData?.length || 0} inquiries`);
      setInquiries(inquiriesData || []);
      hasLoadedInquiries.current = true;
    } catch (error) {
      console.error("Error loading inquiries:", error);
      toast.error("Failed to load inbox");
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (inquiryId: string) => {
    try {
      const supabase = createClient();

      const { error } = await supabase
        .from("inquiries")
        .update({ status: "read" })
        .eq("id", inquiryId);

      if (error) {
        console.error("Error marking as read:", error);
        return;
      }

      // Update local state
      setInquiries((prev) =>
        prev.map((inquiry) =>
          inquiry.id === inquiryId
            ? { ...inquiry, status: "read" as const }
            : inquiry
        )
      );
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const refreshInquiries = async () => {
    hasLoadedInquiries.current = false;
    await loadInquiries();
  };

  const handleReply = async () => {
    if (!replyMessage.trim()) {
      toast.error("Please enter a reply message");
      return;
    }

    if (!selectedInquiry) {
      toast.error("No inquiry selected");
      return;
    }

    setIsReplying(true);

    try {
      const response = await fetch(
        `/api/studio/inbox/${selectedInquiry.id}/replies`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            message: replyMessage.trim(),
            isInternalNote: false,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send reply");
      }

      const result = await response.json();

      // Update local state
      setInquiries((prev) =>
        prev.map((inquiry) =>
          inquiry.id === selectedInquiry.id
            ? { ...inquiry, status: "replied" as const }
            : inquiry
        )
      );

      toast.success(
        `Reply sent to ${selectedInquiry.customer_name}! An email has been sent to their inbox.`
      );
      setSelectedInquiry(null);
      setReplyMessage("");
    } catch (error) {
      console.error("Error sending reply:", error);

      // Show more specific error messages
      const errorMessage =
        error instanceof Error ? error.message : "Failed to send reply";

      if (errorMessage.includes("Email service not configured")) {
        toast.error(
          "Email service not configured. Reply saved but customer was not notified. Please contact administrator.",
          {
            duration: 8000, // Show longer for important message
          }
        );
      } else if (errorMessage.includes("RESEND_API_KEY")) {
        toast.error(
          "Email service needs setup. Reply saved but email notification failed.",
          {
            duration: 6000,
          }
        );
      } else {
        toast.error(`Failed to send reply: ${errorMessage}`);
      }
    } finally {
      setIsReplying(false);
    }
  };

  const openInquiry = (inquiry: Inquiry) => {
    setSelectedInquiry(inquiry);
    if (inquiry.status === "unread") {
      markAsRead(inquiry.id);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "unread":
        return "bg-red-100 text-red-800";
      case "read":
        return "bg-blue-100 text-blue-800";
      case "replied":
        return "bg-green-100 text-green-800";
      case "closed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "normal":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const deleteInquiry = async (inquiry: Inquiry) => {
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/studio/inbox/${inquiry.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete inquiry");
      }

      // Verify the response
      const responseData = await response.json();
      if (!responseData.success) {
        throw new Error(responseData.error || "Delete operation failed");
      }

      // Remove from local state immediately
      setInquiries((prev) => prev.filter((inq) => inq.id !== inquiry.id));

      // Reset the ref to allow future reloads if needed
      hasLoadedInquiries.current = false;

      toast.success(
        `Inquiry from ${inquiry.customer_name} deleted successfully`
      );
      setDeleteDialogOpen(false);
      setInquiryToDelete(null);

      // Log successful deletion for debugging
      console.log(
        `✅ Inquiry ${inquiry.id} deleted successfully from local state`
      );
    } catch (error) {
      console.error("Error deleting inquiry:", error);
      toast.error("Failed to delete inquiry");

      // Log error details for debugging
      console.error("Delete inquiry error details:", {
        inquiryId: inquiry.id,
        customerName: inquiry.customer_name,
        error: error,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteClick = (inquiry: Inquiry, event: React.MouseEvent) => {
    event.stopPropagation();
    setInquiryToDelete(inquiry);
    setDeleteDialogOpen(true);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-oma-cream flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-oma-plum mx-auto mb-4"></div>
          <p className="text-oma-cocoa">Loading your inbox...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-oma-cream flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-xl font-canela text-oma-plum mb-2">
                Authentication Required
              </h2>
              <p className="text-oma-cocoa mb-4">
                Please log in to view your inbox.
              </p>
              <Button asChild className="bg-oma-plum hover:bg-oma-plum/90">
                <a href="/login">Log In</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-oma-cream">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <StudioNav />
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-canela text-oma-plum mb-2">
              Studio Inbox
            </h1>
            <p className="text-oma-cocoa">
              {isSuperAdmin
                ? "Manage all customer inquiries and messages across the platform"
                : "Manage inquiries and messages from potential clients"}
            </p>
            {isSuperAdmin && (
              <div className="mt-2">
                <Badge className="bg-oma-plum text-white">
                  Super Admin View - All Inquiries
                </Badge>
              </div>
            )}
          </div>
          <Button
            onClick={refreshInquiries}
            variant="outline"
            className="border-oma-plum text-oma-plum hover:bg-oma-plum/10"
            disabled={loading}
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-oma-plum mr-2"></div>
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
        </div>

        {inquiries.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <h3 className="text-lg font-canela text-oma-plum mb-2">
                  {isSuperAdmin
                    ? "No inquiries on the platform yet"
                    : "No messages yet"}
                </h3>
                <p className="text-oma-cocoa">
                  {isSuperAdmin
                    ? "When customers contact any brand on the platform, their messages will appear here."
                    : "When customers contact you through your brand pages, their messages will appear here."}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {inquiries.map((inquiry) => (
              <Card
                key={inquiry.id}
                className={`cursor-pointer transition-colors hover:bg-oma-beige/20 ${
                  inquiry.status === "unread" ? "border-oma-plum" : ""
                }`}
                onClick={() => openInquiry(inquiry)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-canela text-oma-plum">
                        {inquiry.subject}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-oma-cocoa">
                          From: {inquiry.customer_name} (
                          {inquiry.customer_email})
                        </span>
                        {inquiry.brand && (
                          <span className="text-sm text-oma-cocoa">
                            • Brand: {inquiry.brand.name}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(inquiry.status)}>
                        {inquiry.status}
                      </Badge>
                      <Badge className={getPriorityColor(inquiry.priority)}>
                        {inquiry.priority}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleDeleteClick(inquiry, e)}
                        className="text-red-600 hover:text-red-800 hover:bg-red-50 p-1"
                        title="Delete inquiry"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-oma-cocoa line-clamp-2">
                    {inquiry.message}
                  </p>
                  <p className="text-sm text-oma-cocoa/70 mt-2">
                    {new Date(inquiry.created_at).toLocaleDateString()} at{" "}
                    {new Date(inquiry.created_at).toLocaleTimeString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Reply Modal */}
        <Dialog
          open={!!selectedInquiry}
          onOpenChange={() => setSelectedInquiry(null)}
        >
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{selectedInquiry?.subject}</DialogTitle>
              <DialogDescription>
                From: {selectedInquiry?.customer_name} (
                {selectedInquiry?.customer_email})
              </DialogDescription>
            </DialogHeader>

            {selectedInquiry && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-oma-plum mb-2">
                    Original Message:
                  </h4>
                  <div className="bg-oma-beige/20 p-4 rounded-lg">
                    <p className="text-oma-cocoa whitespace-pre-wrap">
                      {selectedInquiry.message}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-oma-plum mb-2">
                    Your Reply:
                  </label>
                  <Textarea
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    rows={4}
                    placeholder="Type your reply here..."
                    disabled={isReplying}
                  />
                </div>

                <div className="flex justify-end gap-4">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedInquiry(null)}
                    disabled={isReplying}
                  >
                    Close
                  </Button>
                  <Button
                    onClick={handleReply}
                    disabled={isReplying || !replyMessage.trim()}
                    className="bg-oma-plum hover:bg-oma-plum/90"
                  >
                    {isReplying ? "Sending..." : "Send Reply"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <AlertDialog
          open={deleteDialogOpen}
          onOpenChange={() => setDeleteDialogOpen(false)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this inquiry? This action cannot
                be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteInquiry(inquiryToDelete!)}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

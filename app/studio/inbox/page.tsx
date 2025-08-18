"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
    if (
      !authLoading &&
      user?.id &&
      !hasLoadedInquiries.current &&
      !isDeletingRef.current
    ) {
      // Only load if user ID has changed or we haven't loaded yet, and we're not currently deleting
      if (lastUserId.current !== user.id) {
        console.log("📧 User ID changed, loading inquiries for new user");
        lastUserId.current = user.id;
        hasLoadedInquiries.current = false;
        deletedInquiryIds.current.clear(); // Clear deleted set for new user
        loadInquiries();
      } else if (!hasLoadedInquiries.current) {
        console.log("📧 Initial load for current user");
        loadInquiries();
      }
    }
  }, [user?.id, authLoading]); // Only depend on user.id, not the entire user object

  // Cleanup effect to reset refs when component unmounts
  useEffect(() => {
    return () => {
      hasLoadedInquiries.current = false;
      lastUserId.current = null;
      deletedInquiryIds.current.clear();

      // Clear localStorage on unmount
      if (typeof window !== "undefined" && user?.id) {
        localStorage.removeItem(`deleted_inquiries_${user.id}`);
      }
    };
  }, [user?.id]);

  // Add a ref to track if we've already loaded inquiries
  const hasLoadedInquiries = useRef(false);
  const lastUserId = useRef<string | null>(null);
  const deletedInquiryIds = useRef<Set<string>>(new Set());
  const isDeletingRef = useRef(false); // Track deletion state to prevent reloading

  // Load deleted inquiries from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined" && user?.id) {
      try {
        const stored = localStorage.getItem(`deleted_inquiries_${user.id}`);
        if (stored) {
          const deletedIds = JSON.parse(stored);
          deletedInquiryIds.current = new Set(deletedIds);
          console.log(
            `📧 Loaded ${deletedIds.length} deleted inquiry IDs from localStorage`
          );
        }
      } catch (error) {
        console.warn(
          "Failed to load deleted inquiries from localStorage:",
          error
        );
      }
    }
  }, [user?.id]);

  // Save deleted inquiries to localStorage whenever the set changes
  const saveDeletedInquiries = useCallback(() => {
    if (typeof window !== "undefined" && user?.id) {
      try {
        const deletedArray = Array.from(deletedInquiryIds.current);
        localStorage.setItem(
          `deleted_inquiries_${user.id}`,
          JSON.stringify(deletedArray)
        );
        console.log(
          `💾 Saved ${deletedArray.length} deleted inquiry IDs to localStorage`
        );
      } catch (error) {
        console.warn(
          "Failed to save deleted inquiries to localStorage:",
          error
        );
      }
    }
  }, [user?.id]);

  const loadInquiries = async () => {
    // Skip loading if we're currently deleting or if we already have inquiries and user hasn't changed
    if (isDeletingRef.current) {
      console.log("📧 Skipping inquiry reload - currently deleting");
      return;
    }

    if (hasLoadedInquiries.current && inquiries.length > 0) {
      console.log("📧 Skipping inquiry reload - already loaded");
      return;
    }

    console.log("📧 Loading inquiries...");

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

      // Filter out any inquiries that were deleted in this session
      const filteredInquiries = (inquiriesData || []).filter(
        (inquiry) => !deletedInquiryIds.current.has(inquiry.id)
      );

      console.log(
        `📧 Filtered to ${filteredInquiries.length} inquiries (${deletedInquiryIds.current.size} deleted in session)`
      );

      // Only update state if we have new data or if this is the initial load
      if (filteredInquiries.length > 0 || inquiries.length === 0) {
        setInquiries(filteredInquiries);
      }

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
    console.log(
      "🔄 Manual refresh requested - clearing deleted set and reloading"
    );
    hasLoadedInquiries.current = false;
    deletedInquiryIds.current.clear(); // Clear deleted set on manual refresh

    // Clear localStorage as well
    if (typeof window !== "undefined" && user?.id) {
      localStorage.removeItem(`deleted_inquiries_${user.id}`);
      console.log("🗑️ Cleared deleted inquiries from localStorage");
    }

    setInquiries([]); // Clear current inquiries to show loading state
    setLoading(true); // Show loading state
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
    isDeletingRef.current = true; // Set ref to true

    console.log(
      `🗑️ Starting deletion of inquiry: ${inquiry.id} (${inquiry.customer_name})`
    );

    try {
      const response = await fetch(`/api/studio/inbox/${inquiry.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      console.log(`📡 Delete response status: ${response.status}`);
      console.log(`📡 Delete response ok: ${response.ok}`);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ Delete failed with error:", errorData);
        throw new Error(errorData.error || "Failed to delete inquiry");
      }

      // Verify the response
      const responseData = await response.json();
      console.log(`📡 Delete response data:`, responseData);

      if (!responseData.success) {
        console.error("❌ Delete operation failed:", responseData);
        throw new Error(responseData.error || "Delete operation failed");
      }

      // Add to deleted set to prevent re-appearing
      deletedInquiryIds.current.add(inquiry.id);
      saveDeletedInquiries(); // Save to localStorage

      // Remove from local state immediately
      setInquiries((prev) => {
        const filtered = prev.filter((inq) => inq.id !== inquiry.id);
        console.log(
          `🗑️ Local state updated: ${prev.length} -> ${filtered.length} inquiries`
        );
        return filtered;
      });

      // Mark as loaded to prevent automatic re-fetch
      hasLoadedInquiries.current = true;

      console.log(
        `🗑️ Added inquiry ${inquiry.id} to deleted set. Total deleted in session: ${deletedInquiryIds.current.size}`
      );

      toast.success(
        `Inquiry from ${inquiry.customer_name} deleted successfully`
      );
      setDeleteDialogOpen(false);
      setInquiryToDelete(null);

      // Log successful deletion for debugging
      console.log(
        `✅ Inquiry ${inquiry.id} deleted successfully from local state`
      );

      // Verify deletion from database after a short delay
      setTimeout(async () => {
        try {
          const verifyResponse = await fetch(
            `/api/studio/inbox/${inquiry.id}`,
            {
              method: "GET",
              credentials: "include",
            }
          );

          if (verifyResponse.ok) {
            console.warn(
              `⚠️ Inquiry ${inquiry.id} still exists in database after deletion`
            );
            // If it still exists, we might need to refresh the list
            // But don't do it immediately to avoid race conditions
          } else if (verifyResponse.status === 404) {
            console.log(
              `✅ Inquiry ${inquiry.id} confirmed deleted from database`
            );
          }
        } catch (error) {
          console.log(
            `✅ Inquiry ${inquiry.id} verification completed (${error instanceof Error ? error.message : "unknown error"})`
          );
        }
      }, 1000);
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
      isDeletingRef.current = false; // Reset ref after deletion
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

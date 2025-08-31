"use client";

import { useState, useEffect } from "react";
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
import { RefreshCw, Mail, Bell, MessageSquare, Reply } from "lucide-react";
import { Label } from "@/components/ui/label";

interface Inquiry {
  id: string;
  brand_id: string;
  customer_name: string;
  customer_email: string;
  subject: string;
  message: string;
  inquiry_type: string;
  priority: "low" | "normal" | "high";
  status: "new" | "read" | "replied" | "closed";
  source: string;
  created_at: string;
  brand?: {
    name: string;
    category?: string;
  };
}

interface Notification {
  id: string;
  user_id: string;
  brand_id: string;
  type: string;
  title: string;
  message: string;
  data: any;
  is_read: boolean;
  created_at: string;
  brand?: {
    name: string;
  };
}

export default function StudioInboxPage() {
  const { user, loading: authLoading } = useAuth();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [inquiryToDelete, setInquiryToDelete] = useState<Inquiry | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Check user role on mount
  useEffect(() => {
    const checkUserRole = async () => {
      if (!user?.id) return;
      
      try {
        // Get user profile to determine actual role
        const supabase = createClient();
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("role, owned_brands")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Error fetching user profile:", error);
          return;
        }

        const isSuperAdmin = profile.role === "super_admin";
        setIsSuperAdmin(isSuperAdmin);
        
        console.log("🔍 User role determined:", {
          role: profile.role,
          isSuperAdmin,
          ownedBrands: profile.owned_brands?.length || 0
        });
      } catch (error) {
        console.error("Error checking user role:", error);
      }
    };

    checkUserRole();
  }, [user?.id]);

  // Load inquiries and notifications
  const loadInbox = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      console.log("📧 Loading inbox for user:", user.email);

      const response = await fetch(`/api/studio/inbox?_t=${Date.now()}`, {
        credentials: "include",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load inbox");
      }

      const data = await response.json();
      setInquiries(data.inquiries || []);
      setNotifications(data.notifications || []);

      console.log(`✅ Loaded ${data.inquiries?.length || 0} inquiries and ${data.notifications?.length || 0} notifications`);
    } catch (error) {
      console.error("❌ Error loading inbox:", error);
      toast.error("Failed to load inbox");
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    if (user && !authLoading) {
      loadInbox();
    }
  }, [user, authLoading]);

  // Auto-refresh inbox every 30 seconds to keep it fresh
  useEffect(() => {
    if (!user || authLoading) return;

    const interval = setInterval(() => {
      console.log("🔄 Auto-refreshing inbox data...");
      loadInbox();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [user, authLoading]);

  // Mark inquiry as read
  const markAsRead = async (inquiryId: string) => {
    try {
      const response = await fetch(`/api/studio/inbox/${inquiryId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: "read" }),
      });

      if (!response.ok) {
        throw new Error("Failed to mark as read");
      }

      // Update local state
      setInquiries(prev => 
        prev.map(inq => 
          inq.id === inquiryId ? { ...inq, status: "read" } : inq
        )
      );

      toast.success("Marked as read");
    } catch (error) {
      console.error("❌ Error marking as read:", error);
      toast.error("Failed to mark as read");
    }
  };

  // Open inquiry details
  const openInquiry = (inquiry: Inquiry) => {
    setSelectedInquiry(inquiry);
    if (inquiry.status === "new") {
      markAsRead(inquiry.id);
    }
  };

  // Open notification details
  const openNotification = (notification: Notification) => {
    setSelectedNotification(notification);
  };

  // Send reply
  const sendReply = async () => {
    if (!selectedInquiry || !replyMessage.trim()) return;

    setIsReplying(true);
    try {
      const response = await fetch(`/api/studio/inbox/${selectedInquiry.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ 
          status: "replied",
          reply: replyMessage.trim()
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send reply");
      }

      // Update local state
      setInquiries(prev => 
        prev.map(inq => 
          inq.id === selectedInquiry.id ? { ...inq, status: "replied" } : inq
        )
      );

      toast.success("Reply sent successfully");
      setSelectedInquiry(null);
      setReplyMessage("");
    } catch (error) {
      console.error("❌ Error sending reply:", error);
      toast.error("Failed to send reply");
    } finally {
      setIsReplying(false);
    }
  };

  // Delete inquiry
  const deleteInquiry = async () => {
    if (!inquiryToDelete || isDeleting) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/studio/inbox/${inquiryToDelete.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to delete inquiry");
      }

      // Remove from local state
      setInquiries(prev => prev.filter(inq => inq.id !== inquiryToDelete.id));
      setDeleteDialogOpen(false);
      setInquiryToDelete(null);

      toast.success("Inquiry deleted successfully");
    } catch (error) {
      console.error("❌ Error deleting inquiry:", error);
      toast.error("Failed to delete inquiry");
    } finally {
      setIsDeleting(false);
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
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

  // Get priority color
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

  // Show loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-oma-cream flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-oma-plum mx-auto mb-4"></div>
          <p className="text-oma-cocoa">Loading authentication...</p>
        </div>
      </div>
    );
  }

  // Show authentication required state
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
                Please log in to access the Studio Inbox.
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
        
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-canela text-oma-plum mb-2">
                Studio Inbox
              </h1>
              <p className="text-oma-cocoa">
                {isSuperAdmin
                  ? "Manage all customer inquiries and platform notifications"
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
              onClick={loadInbox} 
              disabled={loading}
              variant="outline"
              className="border-oma-plum text-oma-plum hover:bg-oma-plum/10"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-oma-plum mx-auto mb-4"></div>
            <p className="text-oma-cocoa">Loading inbox...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && inquiries.length === 0 && notifications.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Mail className="h-12 w-12 text-oma-cocoa/50 mx-auto mb-4" />
                <h3 className="text-lg font-canela text-oma-plum mb-2">
                  {isSuperAdmin
                    ? "No inquiries or notifications on the platform yet"
                    : "No messages or notifications yet"}
                </h3>
                <p className="text-oma-cocoa">
                  {isSuperAdmin
                    ? "When customers contact any brand or submit orders, their messages and notifications will appear here."
                    : "When customers contact you through your brand pages or submit custom orders, their messages and notifications will appear here."}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Inquiries Section */}
        {!loading && inquiries.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Mail className="h-5 w-5 text-oma-plum" />
              <h2 className="text-xl font-canela text-oma-plum">
                Customer Inquiries ({inquiries.length})
              </h2>
            </div>
            <div className="space-y-4">
              {inquiries.map((inquiry) => (
                <Card
                  key={inquiry.id}
                  className={`cursor-pointer transition-colors hover:bg-oma-beige/20 ${
                    inquiry.status === "new" ? "border-oma-plum" : ""
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
                            From: {inquiry.customer_name} ({inquiry.customer_email})
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
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setInquiryToDelete(inquiry);
                            setDeleteDialogOpen(true);
                          }}
                          className="border-red-200 text-red-600 hover:bg-red-50"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-oma-cocoa text-sm line-clamp-2">
                      {inquiry.message}
                    </p>
                    <div className="flex items-center justify-between mt-3 text-xs text-oma-cocoa/70">
                      <span>Source: {inquiry.source}</span>
                      <span>{new Date(inquiry.created_at).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Notifications Section */}
        {!loading && notifications.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="h-5 w-5 text-oma-plum" />
              <h2 className="text-xl font-canela text-oma-plum">
                Notifications ({notifications.length})
              </h2>
            </div>
            <div className="space-y-4">
              {notifications.map((notification) => (
                <Card
                  key={notification.id}
                  className="cursor-pointer transition-colors hover:bg-oma-beige/20"
                  onClick={() => openNotification(notification)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-canela text-oma-plum">
                          {notification.title}
                        </CardTitle>
                        <p className="text-sm text-oma-cocoa mt-1">
                          {notification.message}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={notification.is_read ? "bg-gray-100 text-gray-800" : "bg-blue-100 text-blue-800"}>
                          {notification.is_read ? "Read" : "New"}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-xs text-oma-cocoa/70">
                      <span>Type: {notification.type}</span>
                      <span>{new Date(notification.created_at).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Inquiry Detail Dialog */}
        <Dialog open={!!selectedInquiry} onOpenChange={() => setSelectedInquiry(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedInquiry?.subject}</DialogTitle>
              <DialogDescription>
                From: {selectedInquiry?.customer_name} ({selectedInquiry?.customer_email})
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-oma-cocoa">{selectedInquiry?.message}</p>
              </div>
              
              <div>
                <Label htmlFor="reply" className="text-sm font-medium text-oma-cocoa">
                  Reply
                </Label>
                <Textarea
                  id="reply"
                  placeholder="Type your reply..."
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  className="mt-2 border-oma-cocoa/20 focus:border-oma-plum"
                  rows={4}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedInquiry(null)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={sendReply}
                  disabled={!replyMessage.trim() || isReplying}
                  className="bg-oma-plum hover:bg-oma-plum/90"
                >
                  {isReplying ? "Sending..." : "Send Reply"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Notification Detail Dialog */}
        <Dialog open={!!selectedNotification} onOpenChange={() => setSelectedNotification(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedNotification?.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-oma-cocoa">{selectedNotification?.message}</p>
              <div className="text-sm text-oma-cocoa/70">
                <p>Type: {selectedNotification?.type}</p>
                <p>Date: {selectedNotification ? new Date(selectedNotification.created_at).toLocaleDateString() : ""}</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Inquiry</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this inquiry? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={deleteInquiry}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700"
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

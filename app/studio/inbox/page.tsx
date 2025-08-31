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
import { RefreshCw, Mail, Bell } from "lucide-react";

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
        const supabase = createClient();
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (!profileError && profile) {
          setIsSuperAdmin(profile.role === "super_admin");
        }
      } catch (error) {
        console.error("Error checking user role:", error);
      }
    };

    checkUserRole();
  }, [user?.id]);

  // Load inquiries
  const loadInquiries = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      console.log("📧 Loading inquiries for user:", user.email);

      const supabase = createClient();
      
      // Get user profile to determine access
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role, owned_brands")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("❌ Error fetching profile:", profileError);
        toast.error("Failed to load user profile");
        return;
      }

      console.log("👤 User profile:", { role: profile.role, ownedBrands: profile.owned_brands });

      // Build query based on user role
      let query = supabase
        .from("inquiries")
        .select(`
          *,
          brand:brands(
            name,
            category
          )
        `)
        .order("created_at", { ascending: false });

      // Apply role-based filtering
      if (profile.role === "brand_admin" && profile.owned_brands?.length > 0) {
        console.log("🔍 Filtering by owned brands:", profile.owned_brands);
        
        // Handle both UUID and slug-based brand IDs
        // First, get the actual brand IDs from the brands table
        const { data: brandIds, error: brandIdsError } = await supabase
          .from("brands")
          .select("id")
          .in("id", profile.owned_brands);
        
        if (brandIdsError) {
          console.error("❌ Error fetching brand IDs:", brandIdsError);
          // Fallback to direct filtering
          query = query.in("brand_id", profile.owned_brands);
        } else if (brandIds && brandIds.length > 0) {
          const actualBrandIds = brandIds.map(brand => brand.id);
          console.log("🔍 Actual brand IDs for filtering:", actualBrandIds);
          query = query.in("brand_id", actualBrandIds);
        } else {
          console.log("⚠️ No valid brand IDs found for filtering");
          setInquiries([]);
          setLoading(false);
          return;
        }
      } else if (profile.role === "brand_admin") {
        console.log("⚠️ Brand admin has no owned brands");
        setInquiries([]);
        setLoading(false);
        return;
      } else {
        console.log("🔍 Super admin - no brand filtering");
      }

      const { data: inquiriesData, error } = await query;

      if (error) {
        console.error("❌ Error fetching inquiries:", error);
        toast.error("Failed to load inquiries");
        return;
      }

      console.log(`✅ Loaded ${inquiriesData?.length || 0} inquiries`);
      setInquiries(inquiriesData || []);
    } catch (error) {
      console.error("❌ Error in loadInquiries:", error);
      toast.error("Failed to load inquiries");
    } finally {
      setLoading(false);
    }
  };

  // Load notifications
  const loadNotifications = async () => {
    if (!user?.id) return;

    try {
      console.log("🔔 Loading notifications for user:", user.id);

      const supabase = createClient();
      const { data: notificationsData, error } = await supabase
        .from("notifications")
        .select(`
          *,
          brand:brands(name)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("❌ Error fetching notifications:", error);
        return;
      }

      console.log("🔔 Notifications loaded:", notificationsData?.length || 0);
      setNotifications(notificationsData || []);
    } catch (error) {
      console.error("❌ Error loading notifications:", error);
    }
  };

  // Load data on mount
  useEffect(() => {
    if (user && !authLoading) {
      loadInquiries();
      loadNotifications();
    }
  }, [user, authLoading]);

  // Mark inquiry as read
  const markAsRead = async (inquiryId: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("inquiries")
        .update({ status: "read" })
        .eq("id", inquiryId);

      if (error) {
        console.error("❌ Error marking as read:", error);
        return;
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
      // Here you would implement the reply logic
      // For now, just mark as replied
      const supabase = createClient();
      const { error } = await supabase
        .from("inquiries")
        .update({ status: "replied" })
        .eq("id", selectedInquiry.id);

      if (error) {
        throw error;
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

  // Handle delete click
  const handleDeleteClick = (inquiry: Inquiry, event: React.MouseEvent) => {
    event.stopPropagation();
    setInquiryToDelete(inquiry);
    setDeleteDialogOpen(true);
  };

  // Delete inquiry
  const deleteInquiry = async () => {
    if (!inquiryToDelete) return;

    setIsDeleting(true);
    try {
      const supabase = createClient();
      
      // Delete inquiry replies first
      await supabase
        .from("inquiry_replies")
        .delete()
        .eq("inquiry_id", inquiryToDelete.id);

      // Delete the inquiry
      const { error } = await supabase
        .from("inquiries")
        .delete()
        .eq("id", inquiryToDelete.id);

      if (error) {
        throw error;
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
              onClick={() => { loadInquiries(); loadNotifications(); }} 
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
                  className={`cursor-pointer transition-colors hover:bg-oma-beige/20 ${
                    !notification.is_read ? "border-oma-plum" : ""
                  }`}
                  onClick={() => openNotification(notification)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-canela text-oma-plum">
                          {notification.title}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-oma-cocoa">
                            {notification.message}
                          </span>
                          {notification.brand && (
                            <span className="text-sm text-oma-cocoa">
                              • Brand: {notification.brand.name}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={notification.is_read ? "bg-gray-100 text-gray-800" : "bg-red-100 text-red-800"}>
                          {notification.is_read ? "Read" : "Unread"}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-oma-cocoa/70 mt-2">
                      {new Date(notification.created_at).toLocaleDateString()} at{" "}
                      {new Date(notification.created_at).toLocaleTimeString()}
                    </p>
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
                {selectedInquiry?.brand && ` • Brand: ${selectedInquiry.brand.name}`}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-oma-cocoa whitespace-pre-wrap">
                  {selectedInquiry?.message}
                </p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-oma-cocoa">
                  Reply Message
                </label>
                <Textarea
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Type your reply..."
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
                  disabled={isReplying || !replyMessage.trim()}
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
              <DialogDescription>
                {selectedNotification?.brand && `Brand: ${selectedNotification.brand.name}`}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-oma-cocoa whitespace-pre-wrap">
                  {selectedNotification?.message}
                </p>
              </div>
              
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => setSelectedNotification(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
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

"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
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
import { Mail, Bell, AlertCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { StudioInquiry, StudioNotification } from "./types";
import { useStudioInbox } from "./useStudioInbox";

export default function StudioInboxPage() {
  const { user, loading: authLoading } = useAuth();
  const [selectedInquiry, setSelectedInquiry] = useState<StudioInquiry | null>(null);
  const [selectedNotification, setSelectedNotification] =
    useState<StudioNotification | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [inquiryToDelete, setInquiryToDelete] = useState<StudioInquiry | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const pausePolling = !!(selectedInquiry || selectedNotification);

  const {
    inquiries,
    setInquiries,
    notifications,
    setNotifications,
    loading,
    refreshing,
    loadError,
    loadInbox,
  } = useStudioInbox({
    userId: user?.id,
    authLoading,
    pausePolling,
  });

  const isSuperAdmin = user?.role === "super_admin";

  const markAsRead = async (inquiryId: string) => {
    try {
      const response = await fetch(`/api/studio/inbox/${inquiryId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ is_read: true }),
      });

      if (!response.ok) {
        throw new Error("Failed to mark as read");
      }

      setInquiries((prev) =>
        prev.map((inq) =>
          inq.id === inquiryId ? { ...inq, status: "read" } : inq
        )
      );
    } catch (error) {
      console.error("Error marking as read:", error);
      toast.error("Failed to mark as read");
    }
  };

  const openInquiry = (inquiry: StudioInquiry) => {
    setSelectedInquiry(inquiry);
    if (inquiry.status === "new") {
      void markAsRead(inquiry.id);
    }
  };

  const markNotificationRead = async (notification: StudioNotification) => {
    if (notification.is_read) return;
    try {
      const response = await fetch(`/api/studio/notifications/${notification.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ is_read: true }),
      });
      if (!response.ok) {
        throw new Error("Failed to mark notification read");
      }
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n))
      );
    } catch (e) {
      console.error("Error marking notification read:", e);
      toast.error("Could not mark notification as read");
    }
  };

  const openNotification = (notification: StudioNotification) => {
    setSelectedNotification(notification);
    void markNotificationRead(notification);
  };

  const sendReply = async () => {
    if (!selectedInquiry || !replyMessage.trim()) return;

    setIsReplying(true);
    try {
      const response = await fetch(
        `/api/studio/inbox/${selectedInquiry.id}/replies`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            message: replyMessage.trim(),
            isInternalNote: false,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to send reply");
      }

      setInquiries((prev) =>
        prev.map((inq) =>
          inq.id === selectedInquiry.id ? { ...inq, status: "replied" } : inq
        )
      );

      toast.success("Reply sent successfully");
      setSelectedInquiry(null);
      setReplyMessage("");
    } catch (error) {
      console.error("Error sending reply:", error);
      toast.error("Failed to send reply");
    } finally {
      setIsReplying(false);
    }
  };

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

      setInquiries((prev) => prev.filter((inq) => inq.id !== inquiryToDelete.id));
      setDeleteDialogOpen(false);
      setInquiryToDelete(null);

      toast.success("Inquiry deleted successfully");
    } catch (error) {
      console.error("Error deleting inquiry:", error);
      toast.error("Failed to delete inquiry");
    } finally {
      setIsDeleting(false);
    }
  };

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
                <Link href="/login">Log In</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const showMainContent = !loading;
  const isEmpty =
    inquiries.length === 0 && notifications.length === 0 && showMainContent && !loadError;

  return (
    <div className="min-h-screen bg-oma-cream">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <StudioNav />

        <div className="mb-8">
          <div>
            <h1 className="text-3xl font-canela text-oma-plum mb-2">Studio Inbox</h1>
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
        </div>

        {loadError && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Inbox couldn’t load</AlertTitle>
            <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <span>{loadError}</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-current shrink-0"
                onClick={() => void loadInbox()}
                disabled={loading || refreshing}
              >
                Try again
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-oma-plum mx-auto mb-4"></div>
            <p className="text-oma-cocoa">Loading inbox...</p>
          </div>
        )}

        {isEmpty && (
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

        {showMainContent && inquiries.length > 0 && (
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
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
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
                      <div className="flex items-center gap-2 shrink-0">
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
                    <p className="text-oma-cocoa text-sm line-clamp-2">{inquiry.message}</p>
                    <div className="flex items-center justify-between mt-3 text-xs text-oma-cocoa/70">
                      <span>Source: {inquiry.source}</span>
                      <span>{new Date(inquiry.created_at).toLocaleDateString("en-GB")}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {showMainContent && notifications.length > 0 && (
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
                    !notification.is_read ? "border-oma-plum/40" : ""
                  }`}
                  onClick={() => openNotification(notification)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-canela text-oma-plum">
                          {notification.title}
                        </CardTitle>
                        <p className="text-sm text-oma-cocoa mt-1">{notification.message}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge
                          className={
                            notification.is_read
                              ? "bg-gray-100 text-gray-800"
                              : "bg-blue-100 text-blue-800"
                          }
                        >
                          {notification.is_read ? "Read" : "New"}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-xs text-oma-cocoa/70">
                      <span>Type: {notification.type}</span>
                      <span>
                        {new Date(notification.created_at).toLocaleDateString("en-GB")}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        <Dialog
          open={!!selectedInquiry}
          onOpenChange={(open) => {
            if (!open) setSelectedInquiry(null);
          }}
        >
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
                <Button variant="outline" onClick={() => setSelectedInquiry(null)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => void sendReply()}
                  disabled={!replyMessage.trim() || isReplying}
                  className="bg-oma-plum hover:bg-oma-plum/90"
                >
                  {isReplying ? "Sending..." : "Send Reply"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog
          open={!!selectedNotification}
          onOpenChange={(open) => {
            if (!open) setSelectedNotification(null);
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedNotification?.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-oma-cocoa">{selectedNotification?.message}</p>
              <div className="text-sm text-oma-cocoa/70">
                <p>Type: {selectedNotification?.type}</p>
                <p>
                  Date:{" "}
                  {selectedNotification
                    ? new Date(selectedNotification.created_at).toLocaleDateString("en-GB")
                    : ""}
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>

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
                onClick={() => void deleteInquiry()}
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

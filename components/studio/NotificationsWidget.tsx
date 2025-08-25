"use client";

import React, { useState, useEffect } from "react";
import {
  Bell,
  ShoppingCart,
  MessageSquare,
  Star,
  AlertCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { createClient } from "@/lib/supabase-unified";
import { useAuth } from "@/contexts/AuthContext";
import { useSafari } from "@/hooks/use-safari";

interface Notification {
  id: string;
  type: "basket_submission" | "custom_order" | "inquiry" | "review" | "system";
  title: string;
  message: string;
  data: any;
  is_read: boolean;
  created_at: string;
  user_id: string;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "basket_submission":
      return <ShoppingCart className="h-4 w-4 text-blue-600" />;
    case "custom_order":
      return <MessageSquare className="h-4 w-4 text-green-600" />;
    case "inquiry":
      return <MessageSquare className="h-4 w-4 text-purple-600" />;
    case "review":
      return <Star className="h-4 w-4 text-yellow-600" />;
    case "system":
      return <AlertCircle className="h-4 w-4 text-gray-600" />;
    default:
      return <Bell className="h-4 w-4 text-gray-600" />;
  }
};

const getNotificationColor = (type: string) => {
  switch (type) {
    case "basket_submission":
      return "bg-blue-50 border-blue-200";
    case "custom_order":
      return "bg-green-50 border-green-200";
    case "inquiry":
      return "bg-purple-50 border-purple-200";
    case "review":
      return "bg-yellow-50 border-yellow-200";
    case "system":
      return "bg-gray-50 border-gray-200";
    default:
      return "bg-gray-50 border-gray-200";
  }
};

export default function NotificationsWidget() {
  const { user } = useAuth();
  const { isSafari, isIOS } = useSafari();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const supabase = createClient();

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error("Error fetching notifications:", error);
        return;
      }

      setNotifications(data || []);
      setUnreadCount(data?.filter((n) => !n.is_read).length || 0);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId);

      if (error) {
        console.error("Error marking notification as read:", error);
        return;
      }

      // Update local state
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("is_read", false);

      if (error) {
        console.error("Error marking all notifications as read:", error);
        return;
      }

      // Update local state
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    // Safari-safe date parsing
    let date: Date;
    try {
      // Try standard ISO format first
      date = new Date(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) {
        // Fallback for Safari - replace T with space and Z with +00:00
        const safariSafeString = dateString
          .replace("T", " ")
          .replace("Z", " +00:00");
        date = new Date(safariSafeString);
      }
    } catch (error) {
      console.error("Date parsing error:", error);
      return "Recently";
    }

    // Final validation
    if (isNaN(date.getTime())) {
      return "Recently";
    }

    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-gray-500">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-omahub-accent shadow-omahub">
      <CardHeader className="bg-gradient-to-r from-omahub-primary to-omahub-secondary text-white rounded-t-lg">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
            {unreadCount > 0 && (
              <Badge
                variant="secondary"
                className="ml-2 bg-white text-omahub-primary"
              >
                {unreadCount}
              </Badge>
            )}
          </CardTitle>
          {unreadCount > 0 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={markAllAsRead}
              className="bg-white text-omahub-primary hover:bg-gray-50"
              style={{
                WebkitAppearance: "none",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              Mark all as read
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="bg-white">
        {notifications.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Bell className="h-16 w-16 mx-auto mb-6 text-gray-300" />
            <p className="text-lg font-medium mb-2">No notifications yet</p>
            <p className="text-sm text-gray-400 max-w-md mx-auto">
              You'll see basket submissions, custom orders, and other brand
              updates here
            </p>
          </div>
        ) : (
          <ScrollArea
            className={`h-80 ${isSafari ? "safari-scrollbar" : ""}`}
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            <div
              className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${isSafari ? "safari-flex-fix" : ""}`}
              style={{ minHeight: "min-content" }}
            >
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg border transition-all cursor-pointer hover:shadow-sm ${
                    notification.is_read
                      ? "opacity-75"
                      : "ring-2 ring-blue-200 bg-blue-50"
                  } ${getNotificationColor(notification.type)}`}
                  onClick={() =>
                    !notification.is_read && markAsRead(notification.id)
                  }
                  onTouchStart={(e) => {
                    // Prevent double-tap zoom on Safari
                    e.currentTarget.style.transform = "scale(0.98)";
                  }}
                  onTouchEnd={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                  style={{
                    WebkitTapHighlightColor: "transparent",
                    WebkitUserSelect: "none",
                    WebkitTouchCallout: "none",
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm text-gray-900">
                          {notification.title}
                        </h4>
                        <span className="text-xs text-gray-500">
                          {formatTimeAgo(notification.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      {notification.data && (
                        <div className="mt-2 text-xs text-gray-500">
                          {notification.type === "basket_submission" && (
                            <div className="flex items-center gap-2">
                              <span>
                                Quantity: {notification.data.quantity}
                              </span>
                              {notification.data.size && (
                                <span>Size: {notification.data.size}</span>
                              )}
                              {notification.data.color && (
                                <span>Color: {notification.data.color}</span>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

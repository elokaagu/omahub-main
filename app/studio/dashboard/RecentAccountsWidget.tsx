"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Clock, Mail, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface RecentAccount {
  id: string;
  email: string;
  role: string;
  created_at: string;
  hours_since_creation?: number;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function RecentAccountsWidget() {
  const [recentAccounts, setRecentAccounts] = useState<RecentAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecentAccounts = async () => {
    try {
      setLoading(true);
      setError(null);

      // First try the view, fallback to direct query
      let data, fetchError;

      // Try the view first
      const viewResult = await supabase
        .from("recent_account_creations")
        .select("*")
        .limit(10);

      if (viewResult.error && viewResult.error.code === "42P01") {
        // View doesn't exist, use direct query
        console.log("Using fallback query for recent accounts");

        const directResult = await supabase
          .from("profiles")
          .select("id, email, role, created_at")
          .gte(
            "created_at",
            new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
          )
          .order("created_at", { ascending: false })
          .limit(10);

        data = directResult.data;
        fetchError = directResult.error;

        // Calculate hours_since_creation manually
        if (data) {
          data = data.map((account) => ({
            ...account,
            hours_since_creation:
              (Date.now() - new Date(account.created_at).getTime()) /
              (1000 * 60 * 60),
          }));
        }
      } else {
        data = viewResult.data;
        fetchError = viewResult.error;
      }

      if (fetchError) {
        console.error("Error fetching recent accounts:", fetchError);
        setError("Failed to load recent accounts");
        return;
      }

      setRecentAccounts(data || []);
    } catch (err) {
      console.error("Error:", err);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentAccounts();

    // Refresh every 30 seconds
    const interval = setInterval(fetchRecentAccounts, 30000);

    return () => clearInterval(interval);
  }, []);

  const getRoleColor = (role: string) => {
    switch (role) {
      case "super_admin":
        return "bg-red-100 text-red-800";
      case "admin":
        return "bg-orange-100 text-orange-800";
      case "brand_admin":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTimeColor = (hours: number) => {
    if (hours < 1) return "text-green-600"; // Less than 1 hour
    if (hours < 24) return "text-blue-600"; // Less than 1 day
    if (hours < 168) return "text-orange-600"; // Less than 1 week
    return "text-gray-600";
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Recent Accounts</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Recent Accounts</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-sm text-red-600 mb-2">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchRecentAccounts}
              className="text-xs"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Recent Accounts</CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {recentAccounts.length} new
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchRecentAccounts}
            className="h-6 w-6 p-0"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {recentAccounts.length === 0 ? (
          <div className="text-center py-4">
            <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No recent accounts</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentAccounts.map((account) => (
              <div
                key={account.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Mail className="h-3 w-3 text-gray-400" />
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {account.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className={`text-xs ${getRoleColor(account.role)}`}
                    >
                      {account.role.replace("_", " ")}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-gray-400" />
                      <span
                        className={`text-xs ${getTimeColor(account.hours_since_creation || 0)}`}
                      >
                        {formatDistanceToNow(new Date(account.created_at), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {recentAccounts.length > 0 && (
          <div className="mt-4 pt-3 border-t">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs"
              onClick={() => window.open("/studio/users", "_blank")}
            >
              View All Users
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

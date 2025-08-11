"use client";

import { useState, useEffect } from "react";
import {
  getBrandStatistics,
  subscribeToBrandChanges,
  updateStatisticsAfterBrandChange,
  type BrandStatistics,
} from "@/lib/services/brandStatisticsService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  CheckCircle,
  TrendingUp,
  MessageSquare,
  Package,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface ManagementStatisticsProps {
  className?: string;
}

export default function ManagementStatistics({
  className = "",
}: ManagementStatisticsProps) {
  const { user } = useAuth();
  const [statistics, setStatistics] = useState<BrandStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user is admin
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  const fetchStatistics = async (useCache = true) => {
    try {
      setError(null);
      const stats = await getBrandStatistics(useCache);
      setStatistics(stats);
    } catch (error) {
      console.error("Error fetching statistics:", error);
      setError(
        error instanceof Error ? error.message : "Failed to load statistics"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatistics = async () => {
    setUpdating(true);
    try {
      await updateStatisticsAfterBrandChange();
      await fetchStatistics(false); // Force fresh data
      toast.success("Statistics updated successfully");
    } catch (error) {
      console.error("Error updating statistics:", error);
      toast.error("Failed to update statistics");
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    fetchStatistics();

    // Subscribe to real-time updates
    const subscription = subscribeToBrandChanges((updatedStats) => {
      setStatistics(updatedStats);
    });

    // Set up periodic refresh every 5 minutes
    const interval = setInterval(() => fetchStatistics(false), 5 * 60 * 1000);

    // Cleanup function to prevent memory leaks
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
      if (interval) {
        clearInterval(interval);
      }
    };
  }, []);

  const formatLastUpdated = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60)
      return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
    if (diffHours < 24)
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    return `${Math.floor(diffHours / 24)} day${Math.floor(diffHours / 24) > 1 ? "s" : ""} ago`;
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-canela text-oma-plum">
            Platform Statistics
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="border-oma-beige animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !statistics) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-canela text-oma-plum">
            Platform Statistics
          </h2>
          <Button onClick={() => fetchStatistics(false)} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
        <Card className="border-oma-beige">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-oma-cocoa mx-auto mb-4" />
            <p className="text-oma-cocoa">
              {error || "Failed to load statistics"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const cards = [
    {
      title: "Total Brands",
      value: statistics.total_brands,
      icon: Users,
      color: "text-oma-plum",
    },
    {
      title: "Verified Brands",
      value: statistics.verified_brands,
      icon: CheckCircle,
      color: "text-green-600",
      percentage:
        statistics.total_brands > 0
          ? Math.round(
              (statistics.verified_brands / statistics.total_brands) * 100
            )
          : 0,
    },
    {
      title: "Active Brands",
      value: statistics.active_brands,
      icon: TrendingUp,
      color: "text-blue-600",
      percentage:
        statistics.total_brands > 0
          ? Math.round(
              (statistics.active_brands / statistics.total_brands) * 100
            )
          : 0,
    },
    {
      title: "Total Reviews",
      value: statistics.total_reviews,
      icon: MessageSquare,
      color: "text-purple-600",
    },
    {
      title: "Total Products",
      value: statistics.total_products,
      icon: Package,
      color: "text-orange-600",
    },
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-canela text-oma-plum">
            Platform Statistics
          </h2>
          <p className="text-sm text-oma-cocoa mt-1">
            Last updated: {formatLastUpdated(statistics.last_updated)}
            <Badge
              variant="outline"
              className="ml-2 text-green-600 border-green-600"
            >
              Live Updates
            </Badge>
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => fetchStatistics(false)}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            onClick={handleUpdateStatistics}
            variant="outline"
            size="sm"
            disabled={updating}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${updating ? "animate-spin" : ""}`}
            />
            {updating ? "Updating..." : "Force Update"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card
              key={index}
              className="border-oma-beige hover:shadow-md transition-shadow"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-oma-cocoa">
                  {card.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-canela ${card.color}`}>
                  {card.value.toLocaleString()}
                </div>
                {card.percentage !== undefined && (
                  <p className="text-xs text-oma-cocoa mt-1">
                    {card.percentage}% of total
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Information Card */}
      <Card className="border-oma-beige">
        <CardHeader>
          <CardTitle className="text-oma-plum font-canela">
            Real-time Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-oma-plum mb-2">
                Automatic Updates
              </h4>
              <ul className="space-y-1 text-oma-cocoa">
                <li>
                  • Statistics update automatically when brands are
                  added/deleted
                </li>
                <li>• Real-time updates via Supabase subscriptions</li>
                <li>• Client-side caching for better performance</li>
                <li>• Periodic refresh every 5 minutes</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-oma-plum mb-2">Definitions</h4>
              <ul className="space-y-1 text-oma-cocoa">
                <li>
                  • <strong>Active Brands:</strong> Brands with reviews or
                  created in last 90 days
                </li>
                <li>
                  • <strong>Verified Brands:</strong> Brands marked as verified
                </li>
                <li>
                  • <strong>Cache Duration:</strong> 5 minutes for optimal
                  performance
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

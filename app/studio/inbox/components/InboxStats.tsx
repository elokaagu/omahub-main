"use client";

import { useState, useEffect } from "react";
import {
  InboxIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  CalendarDaysIcon,
} from "@heroicons/react/24/outline";
import { TrendingUp } from "lucide-react";

interface InboxStatsData {
  totalInquiries: number;
  unreadInquiries: number;
  repliedInquiries: number;
  urgentInquiries: number;
  todayInquiries: number;
  thisWeekInquiries: number;
  inquiriesByType: Record<string, number>;
  inquiriesByPriority: Record<string, number>;
  inquiriesByStatus: Record<string, number>;
}

export default function InboxStats() {
  const [stats, setStats] = useState<InboxStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/studio/inbox/stats", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch statistics");
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error("Error fetching inbox stats:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load statistics"
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-lg shadow-sm border border-oma-beige p-6"
          >
            <div className="animate-pulse">
              <div className="h-4 bg-oma-beige rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-oma-beige rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-red-800 font-semibold font-canela">
          Error Loading Statistics
        </h3>
        <p className="text-red-600 text-sm mt-2">{error}</p>
        <button
          onClick={fetchStats}
          className="mt-4 text-sm text-oma-plum hover:text-oma-plum/80 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const statCards = [
    {
      title: "Total Inquiries",
      value: stats.totalInquiries,
      icon: InboxIcon,
      color: "text-oma-plum",
      bgColor: "bg-oma-plum/10",
      borderColor: "border-oma-plum/20",
    },
    {
      title: "Unread",
      value: stats.unreadInquiries,
      icon: ExclamationTriangleIcon,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
    },
    {
      title: "Replied",
      value: stats.repliedInquiries,
      icon: CheckCircleIcon,
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
    },
    {
      title: "Urgent",
      value: stats.urgentInquiries,
      icon: ClockIcon,
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className={`bg-white rounded-lg shadow-sm border border-oma-beige p-6 border-l-4 ${stat.borderColor}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-oma-cocoa">
                    {stat.title}
                  </p>
                  <p className="text-3xl font-canela text-oma-plum mt-1">
                    {stat.value}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border border-oma-beige p-6">
          <div className="flex items-center gap-2 mb-4">
            <CalendarDaysIcon className="h-5 w-5 text-oma-cocoa" />
            <h3 className="text-lg font-canela text-oma-plum">
              Recent Activity
            </h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-oma-cocoa">Today</span>
              <span className="text-sm font-medium text-oma-plum">
                {stats.todayInquiries} inquiries
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-oma-cocoa">This Week</span>
              <span className="text-sm font-medium text-oma-plum">
                {stats.thisWeekInquiries} inquiries
              </span>
            </div>
          </div>
        </div>

        {/* Inquiry Types */}
        <div className="bg-white rounded-lg shadow-sm border border-oma-beige p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-oma-cocoa" />
            <h3 className="text-lg font-canela text-oma-plum">Inquiry Types</h3>
          </div>
          <div className="space-y-3">
            {Object.entries(stats.inquiriesByType).map(([type, count]) => (
              <div key={type} className="flex justify-between items-center">
                <span className="text-sm text-oma-cocoa capitalize">
                  {type.replace("_", " ")}
                </span>
                <span className="text-sm font-medium text-oma-plum">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

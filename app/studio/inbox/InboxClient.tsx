"use client";

import { useState, useEffect } from "react";
import {
  InboxIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";
import InboxStats from "./components/InboxStats";
import InquiryList from "./components/InquiryList";
import InquiryDetail from "./components/InquiryDetail";

interface UserProfile {
  role: string;
  owned_brands: string[];
}

interface InboxClientProps {
  userProfile: UserProfile;
}

interface InboxFilters {
  status?: string;
  priority?: string;
  type?: string;
  brandId?: string;
  search?: string;
}

export default function InboxClient({ userProfile }: InboxClientProps) {
  const [selectedInquiryId, setSelectedInquiryId] = useState<string | null>(
    null
  );
  const [filters, setFilters] = useState<InboxFilters>({});
  const [showFilters, setShowFilters] = useState(false);

  const handleInquirySelect = (inquiryId: string) => {
    setSelectedInquiryId(inquiryId);
  };

  const handleFilterChange = (newFilters: InboxFilters) => {
    setFilters(newFilters);
  };

  const handleBackToList = () => {
    setSelectedInquiryId(null);
  };

  if (selectedInquiryId) {
    return (
      <InquiryDetail
        inquiryId={selectedInquiryId}
        onBack={handleBackToList}
        userProfile={userProfile}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <InboxStats />

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search inquiries..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                value={filters.search || ""}
                onChange={(e) =>
                  handleFilterChange({ ...filters, search: e.target.value })
                }
              />
            </div>
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FunnelIcon className="h-5 w-5" />
            Filters
          </button>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={filters.status || ""}
                  onChange={(e) =>
                    handleFilterChange({
                      ...filters,
                      status: e.target.value || undefined,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">All Status</option>
                  <option value="unread">Unread</option>
                  <option value="read">Read</option>
                  <option value="replied">Replied</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              {/* Priority Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  value={filters.priority || ""}
                  onChange={(e) =>
                    handleFilterChange({
                      ...filters,
                      priority: e.target.value || undefined,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">All Priorities</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="normal">Normal</option>
                  <option value="low">Low</option>
                </select>
              </div>

              {/* Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type
                </label>
                <select
                  value={filters.type || ""}
                  onChange={(e) =>
                    handleFilterChange({
                      ...filters,
                      type: e.target.value || undefined,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">All Types</option>
                  <option value="general">General</option>
                  <option value="custom_order">Custom Order</option>
                  <option value="product_question">Product Question</option>
                  <option value="collaboration">Collaboration</option>
                  <option value="wholesale">Wholesale</option>
                </select>
              </div>

              {/* Brand Filter (for super admins) */}
              {userProfile.role === "super_admin" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Brand
                  </label>
                  <select
                    value={filters.brandId || ""}
                    onChange={(e) =>
                      handleFilterChange({
                        ...filters,
                        brandId: e.target.value || undefined,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="">All Brands</option>
                    {/* Brand options would be populated from an API call */}
                  </select>
                </div>
              )}
            </div>

            {/* Clear Filters */}
            {Object.keys(filters).some(
              (key) => filters[key as keyof InboxFilters]
            ) && (
              <div className="mt-4">
                <button
                  onClick={() => handleFilterChange({})}
                  className="text-sm text-emerald-600 hover:text-emerald-700"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => handleFilterChange({ status: "unread" })}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
            filters.status === "unread"
              ? "bg-blue-50 border-blue-200 text-blue-700"
              : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
          }`}
        >
          <InboxIcon className="h-4 w-4" />
          Unread
        </button>

        <button
          onClick={() => handleFilterChange({ priority: "urgent" })}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
            filters.priority === "urgent"
              ? "bg-red-50 border-red-200 text-red-700"
              : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
          }`}
        >
          <ExclamationTriangleIcon className="h-4 w-4" />
          Urgent
        </button>

        <button
          onClick={() => handleFilterChange({ status: "replied" })}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
            filters.status === "replied"
              ? "bg-green-50 border-green-200 text-green-700"
              : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
          }`}
        >
          <CheckCircleIcon className="h-4 w-4" />
          Replied
        </button>

        <button
          onClick={() => handleFilterChange({ type: "custom_order" })}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
            filters.type === "custom_order"
              ? "bg-purple-50 border-purple-200 text-purple-700"
              : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
          }`}
        >
          <ChatBubbleLeftRightIcon className="h-4 w-4" />
          Custom Orders
        </button>
      </div>

      {/* Inquiry List */}
      <InquiryList
        filters={filters}
        onInquirySelect={handleInquirySelect}
        userProfile={userProfile}
      />
    </div>
  );
}

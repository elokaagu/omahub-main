"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
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
import {
  RefreshCw,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit3,
  Eye,
} from "lucide-react";

interface Lead {
  id: string;
  customer_name: string;
  contact_email: string;
  contact_phone?: string;
  source: string;
  lead_type: string;
  status: "new" | "contacted" | "qualified" | "converted" | "lost" | "closed";
  priority: "low" | "normal" | "high";
  estimated_value?: number;
  notes?: string;
  created_at: string;
  updated_at?: string;
  brand?: {
    id: string;
    name: string;
    category?: string;
  };
  brands?: {
    id: string;
    name: string;
    category?: string;
  };
}

interface LeadStats {
  total_leads: number;
  qualified_leads: number;
  converted_leads: number;
  conversion_rate: number;
  total_value: number;
  total_bookings: number;
  leadsByStatus: {
    new: number;
    contacted: number;
    qualified: number;
    converted: number;
    lost: number;
    closed: number;
  };
}

export default function StudioLeadsPage() {
  const { user, loading: authLoading } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [leadStats, setLeadStats] = useState<LeadStats>({
    total_leads: 0,
    qualified_leads: 0,
    converted_leads: 0,
    conversion_rate: 0,
    total_value: 0,
    total_bookings: 0,
    leadsByStatus: {
      new: 0,
      contacted: 0,
      qualified: 0,
      converted: 0,
      lost: 0,
      closed: 0,
    },
  });

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // UI states
  const [updatingLeadId, setUpdatingLeadId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load leads on mount
  useEffect(() => {
    if (!authLoading && user) {
      loadLeads();
      loadLeadStats();
    }
  }, [user, authLoading]);

  // Auto-refresh data every 30 seconds to keep it fresh
  useEffect(() => {
    if (!user || authLoading) return;

    const interval = setInterval(() => {
      console.log("🔄 Auto-refreshing leads data...");
      loadLeads();
      loadLeadStats();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [user, authLoading]);

  // Filter and sort leads when filters change
  useEffect(() => {
    filterAndSortLeads();
  }, [
    leads,
    searchTerm,
    statusFilter,
    priorityFilter,
    sourceFilter,
    sortBy,
    sortOrder,
  ]);

  const loadLeads = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `/api/leads?action=list&page=1&limit=100&_t=${Date.now()}`,
        {
          credentials: "include",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to load leads");
      }

      const result = await response.json();
      setLeads(result.leads || []);
    } catch (error) {
      console.error("Error loading leads:", error);
      toast.error("Failed to load leads");
    } finally {
      setLoading(false);
    }
  };

  const loadLeadStats = async () => {
    try {
      const response = await fetch(`/api/leads?action=analytics&_t=${Date.now()}`, {
        credentials: "include",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      });

      if (response.ok) {
        const result = await response.json();
        setLeadStats(result.analytics);
      }
    } catch (error) {
      console.error("Error loading lead stats:", error);
    }
  };

  const filterAndSortLeads = () => {
    let filtered = [...leads];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (lead) =>
          lead.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lead.contact_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (lead.notes &&
            lead.notes.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((lead) => lead.status === statusFilter);
    }

    // Apply source filter
    if (sourceFilter !== "all") {
      filtered = filtered.filter((lead) => lead.source === sourceFilter);
    }

    // Apply priority filter
    if (priorityFilter !== "all") {
      filtered = filtered.filter((lead) => lead.priority === priorityFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any = a[sortBy as keyof Lead];
      let bValue: any = b[sortBy as keyof Lead];

      if (sortBy === "created_at" || sortBy === "updated_at") {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredLeads(filtered);
  };

  const updateLeadStatus = async (leadId: string, newStatus: string) => {
    if (updatingLeadId === leadId) {
      return;
    }

    const leadToUpdate = leads.find((lead) => lead.id === leadId);
    if (!leadToUpdate) {
      toast.error("Lead not found");
      return;
    }

    const originalStatus = leadToUpdate.status;
    setUpdatingLeadId(leadId);

    // Optimistic update
    setLeads((prev) =>
      prev.map((lead) =>
        lead.id === leadId
          ? { ...lead, status: newStatus as Lead["status"] }
          : lead
      )
    );

    try {
      const updateData = {
        status: newStatus,
        updated_at: new Date().toISOString(),
        ...(newStatus === "contacted" && {
          contacted_at: new Date().toISOString(),
        }),
        ...(newStatus === "qualified" && {
          qualified_at: new Date().toISOString(),
        }),
        ...(newStatus === "converted" && {
          converted_at: new Date().toISOString(),
        }),
      };

      const requestBody = {
        id: leadId,
        data: updateData,
      };

      console.log("🔍 Sending lead update request:", {
        url: "/api/leads",
        method: "PUT",
        body: requestBody,
        leadId,
        newStatus,
      });

      const response = await fetch("/api/leads", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        console.error("❌ Lead update failed:", {
          status: response.status,
          statusText: response.statusText,
          url: response.url,
        });

        const errorData = await response.json();
        console.error("❌ Error response data:", errorData);

        throw new Error(errorData.error || "Failed to update lead status");
      }

      const result = await response.json();

      if (result.lead) {
        setLeads((prev) =>
          prev.map((lead) =>
            lead.id === leadId ? { ...lead, ...result.lead } : lead
          )
        );
      }

      // Refresh stats after update
      loadLeadStats();

      // Trigger a custom event to notify other components
      window.dispatchEvent(
        new CustomEvent("leadUpdated", {
          detail: { leadId: leadId, newStatus },
        })
      );

      toast.success("Lead status updated successfully");
    } catch (error) {
      console.error("Error updating lead status:", error);

      // Rollback optimistic update
      setLeads((prev) =>
        prev.map((lead) =>
          lead.id === leadId ? { ...lead, status: originalStatus } : lead
        )
      );

      toast.error(
        error instanceof Error ? error.message : "Failed to update lead status"
      );
    } finally {
      setUpdatingLeadId(null);
    }
  };

  const deleteLead = async (lead: Lead) => {
    if (isDeleting) return;

    setIsDeleting(true);
    try {
      console.log("🗑️ Deleting lead:", lead.id, lead.customer_name);

      const response = await fetch(`/api/leads?id=${lead.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete lead");
      }

      console.log("✅ Lead deleted from database successfully");

      // Remove from local state immediately
      setLeads((prev) => {
        const newLeads = prev.filter((l) => l.id !== lead.id);
        console.log(
          `🔄 Updated local state: ${prev.length} → ${newLeads.length} leads`
        );
        return newLeads;
      });

      setDeleteDialogOpen(false);
      setLeadToDelete(null);

      toast.success("Lead deleted successfully");

      // Trigger custom event BEFORE refreshing data
      console.log("📡 Dispatching leadDeleted event");
      window.dispatchEvent(
        new CustomEvent("leadDeleted", {
          detail: { leadId: lead.id, leadName: lead.customer_name },
        })
      );

      // Refresh data to ensure everything is in sync
      console.log("🔄 Refreshing leads and stats");
      await Promise.all([loadLeads(), loadLeadStats()]);

      console.log("✅ Delete operation completed successfully");
    } catch (error) {
      console.error("❌ Error deleting lead:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete lead"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const refreshLeads = () => {
    loadLeads();
    loadLeadStats();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-blue-100 text-blue-800";
      case "contacted":
        return "bg-yellow-100 text-yellow-800";
      case "qualified":
        return "bg-purple-100 text-purple-800";
      case "converted":
        return "bg-green-100 text-green-800";
      case "lost":
        return "bg-red-100 text-red-800";
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB");
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
                Please log in to access the Studio Leads.
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
                Studio Leads
              </h1>
              <p className="text-oma-cocoa">
                {isSuperAdmin
                  ? "Manage all leads across the platform"
                  : "Manage leads for your brands"}
              </p>
              {isSuperAdmin && (
                <div className="mt-2">
                  <Badge className="bg-oma-plum text-white">
                    Super Admin View - All Leads
                  </Badge>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                onClick={refreshLeads}
                disabled={loading}
                variant="outline"
                className="border-oma-plum text-oma-plum hover:bg-oma-plum/10"
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Lead Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border border-oma-gold/10 bg-white">
            <CardContent className="pt-6">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-oma-plum">
                  {leadStats.total_leads}
                </h3>
                <p className="text-sm text-oma-cocoa">Total Leads</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-oma-gold/10 bg-white">
            <CardContent className="pt-6">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-oma-plum">
                  {leadStats.qualified_leads}
                </h3>
                <p className="text-sm text-oma-cocoa">Qualified Leads</p>
                <p className="text-xs text-oma-cocoa/70">Ready for follow-up</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-oma-gold/10 bg-white">
            <CardContent className="pt-6">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-oma-plum">
                  {leadStats.conversion_rate}%
                </h3>
                <p className="text-sm text-oma-cocoa">Conversion Rate</p>
                <p className="text-xs text-oma-cocoa/70">
                  Converted: {leadStats.converted_leads}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-oma-gold/10 bg-white">
            <CardContent className="pt-6">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-oma-plum">
                  {leadStats.total_bookings}
                </h3>
                <p className="text-sm text-oma-cocoa">Total Bookings</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="border border-oma-gold/10 bg-white mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <Label
                  htmlFor="search"
                  className="text-sm font-medium text-oma-cocoa"
                >
                  Search
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-oma-cocoa/50" />
                  <Input
                    id="search"
                    placeholder="Search leads..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-oma-cocoa/20 focus:border-oma-plum"
                  />
                </div>
              </div>

              <div>
                <Label
                  htmlFor="status"
                  className="text-sm font-medium text-oma-cocoa"
                >
                  Status
                </Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="border-oma-cocoa/20 focus:border-oma-plum">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="qualified">Qualified</SelectItem>
                    <SelectItem value="converted">Converted</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label
                  htmlFor="source"
                  className="text-sm font-medium text-oma-cocoa"
                >
                  Source
                </Label>
                <Select value={sourceFilter} onValueChange={setSourceFilter}>
                  <SelectTrigger className="border-oma-cocoa/20 focus:border-oma-plum">
                    <SelectValue placeholder="All sources" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    <SelectItem value="website">Website</SelectItem>
                    <SelectItem value="custom_order">Custom Order</SelectItem>
                    <SelectItem value="product_request">
                      Product Request
                    </SelectItem>
                    <SelectItem value="referral">Referral</SelectItem>
                    <SelectItem value="social_media">Social Media</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label
                  htmlFor="priority"
                  className="text-sm font-medium text-oma-cocoa"
                >
                  Priority
                </Label>
                <Select
                  value={priorityFilter}
                  onValueChange={setPriorityFilter}
                >
                  <SelectTrigger className="border-oma-cocoa/20 focus:border-oma-plum">
                    <SelectValue placeholder="All priorities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label
                  htmlFor="sort"
                  className="text-sm font-medium text-oma-cocoa"
                >
                  Sort By
                </Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="border-oma-cocoa/20 focus:border-oma-plum">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_at">Date Created</SelectItem>
                    <SelectItem value="customer_name">Customer Name</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                    <SelectItem value="priority">Priority</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-between items-center mt-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                  }
                  className="border-oma-cocoa/20 text-oma-cocoa hover:bg-oma-cocoa/5"
                >
                  {sortOrder === "asc" ? "↑ Ascending" : "↓ Descending"}
                </Button>
              </div>
              <p className="text-sm text-oma-cocoa">
                Showing {filteredLeads.length} of {leads.length} leads
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-oma-plum mx-auto mb-4"></div>
            <p className="text-oma-cocoa">Loading leads...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredLeads.length === 0 && (
          <Card className="border border-oma-gold/10 bg-white">
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-oma-cocoa/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Filter className="h-8 w-8 text-oma-cocoa/50" />
                </div>
                <h3 className="text-lg font-canela text-oma-plum mb-2">
                  {leads.length === 0
                    ? "No leads yet"
                    : "No leads match your filters"}
                </h3>
                <p className="text-oma-cocoa mb-4">
                  {leads.length === 0
                    ? "When customers contact brands or submit orders, leads will appear here."
                    : "Try adjusting your search criteria or filters."}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Leads List */}
        {!loading && filteredLeads.length > 0 && (
          <div className="space-y-4">
            {filteredLeads.map((lead) => (
              <Card
                key={lead.id}
                className="border border-oma-gold/10 bg-white hover:shadow-md transition-shadow"
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-oma-plum">
                          {lead.customer_name}
                        </h3>
                        <Badge className={getStatusColor(lead.status)}>
                          {lead.status}
                        </Badge>
                        <Badge className={getPriorityColor(lead.priority)}>
                          {lead.priority}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-oma-cocoa">
                        <div>
                          <span className="font-medium">Email:</span>{" "}
                          {lead.contact_email}
                        </div>
                        {lead.contact_phone && (
                          <div>
                            <span className="font-medium">Phone:</span>{" "}
                            {lead.contact_phone}
                          </div>
                        )}
                        <div>
                          <span className="font-medium">Source:</span>{" "}
                          {lead.source}
                        </div>
                        <div>
                          <span className="font-medium">Type:</span>{" "}
                          {lead.lead_type}
                        </div>
                        <div>
                          <span className="font-medium">Brand:</span>{" "}
                          {lead.brand?.name ||
                            lead.brands?.name ||
                            "Unknown Brand"}
                          {process.env.NODE_ENV === "development" && (
                            <span className="text-xs text-gray-500 ml-2">
                              (Debug:{" "}
                              {JSON.stringify({
                                brand: lead.brand,
                                brands: lead.brands,
                              })}
                              )
                            </span>
                          )}
                        </div>
                        {lead.estimated_value && (
                          <div>
                            <span className="font-medium">Value:</span> £
                            {lead.estimated_value}
                          </div>
                        )}
                        <div>
                          <span className="font-medium">Created:</span>{" "}
                          {formatDate(lead.created_at)}
                        </div>
                        {lead.updated_at && (
                          <div>
                            <span className="font-medium">Updated:</span>{" "}
                            {formatDate(lead.updated_at)}
                          </div>
                        )}
                      </div>

                      {lead.notes && (
                        <div className="mt-3">
                          <span className="font-medium text-oma-cocoa">
                            Notes:
                          </span>
                          <p className="text-sm text-oma-cocoa/80 mt-1">
                            {lead.notes}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      <div className="flex items-center gap-2">
                        <Select
                          value={lead.status}
                          onValueChange={(value) =>
                            updateLeadStatus(lead.id, value)
                          }
                          disabled={updatingLeadId === lead.id}
                        >
                          <SelectTrigger className="w-32 border-oma-cocoa/20 focus:border-oma-plum">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="contacted">Contacted</SelectItem>
                            <SelectItem value="qualified">Qualified</SelectItem>
                            <SelectItem value="converted">Converted</SelectItem>
                            <SelectItem value="lost">Lost</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-oma-cocoa/20 text-oma-cocoa hover:bg-oma-cocoa/5"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-oma-cocoa/20 text-oma-cocoa hover:bg-oma-cocoa/5"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setLeadToDelete(lead);
                            setDeleteDialogOpen(true);
                          }}
                          className="border-red-200 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Lead</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the lead for{" "}
                <strong>{leadToDelete?.customer_name}</strong>? This action
                cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => leadToDelete && deleteLead(leadToDelete)}
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

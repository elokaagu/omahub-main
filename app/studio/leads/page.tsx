"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase-unified";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StudioNav } from "@/components/ui/studio-nav";
import {
  TrashIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/24/outline";
import { Mail, Phone, User, Building, MapPin } from "lucide-react";

interface Lead {
  id: string;
  brand_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  company_name?: string;
  source: string;
  status: string;
  priority: string;
  estimated_value?: number;
  estimated_budget?: number;
  lead_type?: string;
  location?: string;
  notes?: string;
  tags?: string[];
  last_contact_date?: string;
  next_follow_up_date?: string;
  created_at: string;
  updated_at?: string;
  contacted_at?: string;
  qualified_at?: string;
  converted_at?: string;
  brands?: {
    name: string;
    category?: string;
    image?: string;
  };
  inquiry?: {
    id: string;
    subject: string;
  };
}

interface LeadInteraction {
  id: string;
  interaction_type: string;
  interaction_date: string;
  subject?: string;
  description?: string;
  outcome?: string;
  next_action?: string;
}

export default function StudioLeadsPage() {
  const { user, loading: authLoading } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedLead, setExpandedLead] = useState<string | null>(null);
  const [leadInteractions, setLeadInteractions] = useState<LeadInteraction[]>(
    []
  );
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [updatingLeadId, setUpdatingLeadId] = useState<string | null>(null);

  // Filters and search
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");

  // Form states
  const [isAddingInteraction, setIsAddingInteraction] = useState(false);
  const [newInteraction, setNewInteraction] = useState({
    type: "email",
    subject: "",
    description: "",
    outcome: "",
    nextAction: "",
  });

  useEffect(() => {
    if (!authLoading && user) {
      loadLeads();
    }
  }, [user, authLoading]);

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

      const supabase = createClient();
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role, owned_brands")
        .eq("id", user?.id)
        .single();

      if (!profileError && profile?.role === "super_admin") {
        setIsSuperAdmin(true);
      } else {
        setIsSuperAdmin(false);
      }

      const response = await fetch("/api/admin/leads", {
        credentials: "include",
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch leads");
      }

      const data = await response.json();

      let filteredLeads = data.leads || [];
      if (profile?.role === "brand_admin" && profile.owned_brands?.length > 0) {
        filteredLeads = filteredLeads.filter((lead: Lead) =>
          profile.owned_brands!.includes(lead.brand_id)
        );
      }

      setLeads(filteredLeads);
    } catch (error) {
      console.error("Error loading leads:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to load leads"
      );
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortLeads = () => {
    let filtered = [...leads];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (lead) =>
          lead.customer_name.toLowerCase().includes(term) ||
          lead.customer_email.toLowerCase().includes(term) ||
          lead.lead_type?.toLowerCase().includes(term) ||
          lead.company_name?.toLowerCase().includes(term) ||
          lead.location?.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((lead) => lead.status === statusFilter);
    }

    if (priorityFilter !== "all") {
      filtered = filtered.filter((lead) => lead.priority === priorityFilter);
    }

    if (sourceFilter !== "all") {
      filtered = filtered.filter((lead) => lead.source === sourceFilter);
    }

    filtered.sort((a, b) => {
      let aValue: any = a[sortBy as keyof Lead];
      let bValue: any = b[sortBy as keyof Lead];

      if (
        sortBy === "created_at" ||
        sortBy === "last_contact_date" ||
        sortBy === "next_follow_up_date"
      ) {
        aValue = new Date(aValue || 0).getTime();
        bValue = new Date(bValue || 0).getTime();
      } else if (sortBy === "estimated_value") {
        aValue = Number(aValue) || 0;
        bValue = Number(bValue) || 0;
      }

      if (sortOrder === "desc") {
        return bValue > aValue ? 1 : -1;
      } else {
        return aValue > bValue ? 1 : -1;
      }
    });

    setFilteredLeads(filtered);
  };

  const loadLeadInteractions = async (leadId: string) => {
    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("lead_interactions")
        .select("*")
        .eq("lead_id", leadId)
        .order("interaction_date", { ascending: false });

      if (error) {
        console.error("Error loading lead interactions:", error);
        return;
      }

      setLeadInteractions(data || []);
    } catch (error) {
      console.error("Error loading lead interactions:", error);
    }
  };

  const toggleLeadExpansion = (leadId: string) => {
    if (expandedLead === leadId) {
      setExpandedLead(null);
      setLeadInteractions([]);
    } else {
      setExpandedLead(leadId);
      loadLeadInteractions(leadId);
    }
  };

  const updateLeadStatus = async (leadId: string, newStatus: string) => {
    // Prevent multiple concurrent updates
    if (updatingLeadId === leadId) {
      return;
    }

    // Find the lead to update
    const leadToUpdate = leads.find((lead) => lead.id === leadId);
    if (!leadToUpdate) {
      toast.error("Lead not found");
      return;
    }

    // Store original status for rollback
    const originalStatus = leadToUpdate.status;

    // Set loading state
    setUpdatingLeadId(leadId);

    // Optimistic update - update UI immediately
    setLeads((prev) =>
      prev.map((lead) =>
        lead.id === leadId ? { ...lead, status: newStatus } : lead
      )
    );

    try {
      // Prepare the update data
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

      // Use API endpoint for consistent handling
      const response = await fetch("/api/admin/leads", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          type: "lead",
          id: leadId,
          data: updateData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update lead status");
      }

      const result = await response.json();

      // Update with the actual data returned from server
      if (result.lead) {
        setLeads((prev) =>
          prev.map((lead) =>
            lead.id === leadId ? { ...lead, ...result.lead } : lead
          )
        );
      }

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
      // Clear loading state
      setUpdatingLeadId(null);
    }
  };

  const addInteraction = async (leadId: string) => {
    if (!newInteraction.description.trim()) {
      toast.error("Please enter a description for the interaction");
      return;
    }

    setIsAddingInteraction(true);

    try {
      const supabase = createClient();

      const { error } = await supabase.from("lead_interactions").insert({
        lead_id: leadId,
        interaction_type: newInteraction.type,
        interaction_date: new Date().toISOString(),
        subject: newInteraction.subject.trim() || null,
        description: newInteraction.description.trim(),
        outcome: newInteraction.outcome.trim() || null,
        next_action: newInteraction.nextAction.trim() || null,
      });

      if (error) {
        console.error("Error adding interaction:", error);
        toast.error("Failed to add interaction");
        return;
      }

      setNewInteraction({
        type: "email",
        subject: "",
        description: "",
        outcome: "",
        nextAction: "",
      });

      await loadLeadInteractions(leadId);
      toast.success("Interaction added successfully");
    } catch (error) {
      console.error("Error adding interaction:", error);
      toast.error("Failed to add interaction");
    } finally {
      setIsAddingInteraction(false);
    }
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
      case "urgent":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const deleteLead = async (lead: Lead) => {
    setIsDeleting(true);

    try {
      const supabase = createClient();

      const { error: interactionsError } = await supabase
        .from("lead_interactions")
        .delete()
        .eq("lead_id", lead.id);

      if (interactionsError) {
        console.error("Error deleting lead interactions:", interactionsError);
        toast.error("Failed to delete lead interactions");
        return;
      }

      const { error: leadError } = await supabase
        .from("leads")
        .delete()
        .eq("id", lead.id);

      if (leadError) {
        console.error("Error deleting lead:", leadError);
        toast.error("Failed to delete lead");
        return;
      }

      setLeads((prev) => prev.filter((l) => l.id !== lead.id));
      setDeleteDialogOpen(false);
      setLeadToDelete(null);

      if (expandedLead === lead.id) {
        setExpandedLead(null);
      }

      toast.success("Lead deleted successfully");
    } catch (error) {
      console.error("Error deleting lead:", error);
      toast.error("Failed to delete lead");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteClick = (lead: Lead, event: React.MouseEvent) => {
    event.stopPropagation();
    setLeadToDelete(lead);
    setDeleteDialogOpen(true);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-oma-cream flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-oma-plum mx-auto mb-4"></div>
          <p className="text-oma-cocoa">Loading your leads...</p>
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
                Please log in to view your leads.
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

        <div className="space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="mobile-heading-responsive font-canela text-oma-plum">
                Leads Management
              </h1>
              <p className="mobile-text-responsive text-oma-cocoa">
                {filteredLeads.length} total leads
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Input
                placeholder="Search leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mobile-interactive"
              />
              <div className="mobile-form-grid">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="mobile-interactive">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="qualified">Qualified</SelectItem>
                    <SelectItem value="converted">Converted</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={priorityFilter}
                  onValueChange={setPriorityFilter}
                >
                  <SelectTrigger className="mobile-interactive">
                    <SelectValue placeholder="All Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Filters Row */}
          <div className="mobile-form-grid lg:grid-cols-4">
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="mobile-interactive">
                <SelectValue placeholder="All Sources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="website">Website</SelectItem>
                <SelectItem value="referral">Referral</SelectItem>
                <SelectItem value="social_media">Social Media</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="phone">Phone</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="mobile-interactive">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Created Date</SelectItem>
                <SelectItem value="customer_name">Customer Name</SelectItem>
                <SelectItem value="status">Status</SelectItem>
                <SelectItem value="priority">Priority</SelectItem>
                <SelectItem value="estimated_value">Value</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger className="mobile-interactive">
                <SelectValue placeholder="Order" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Newest First</SelectItem>
                <SelectItem value="asc">Oldest First</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setPriorityFilter("all");
                setSourceFilter("all");
                setSortBy("created_at");
                setSortOrder("desc");
              }}
              className="mobile-interactive"
            >
              Clear Filters
            </Button>
          </div>
        </div>

        {/* Lead Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-oma-plum">
                  {filteredLeads.length}
                </div>
                <p className="text-sm text-oma-cocoa">Total Leads</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {filteredLeads.filter((l) => l.status === "converted").length}
                </div>
                <p className="text-sm text-oma-cocoa">Converted</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {
                    filteredLeads.filter((l) =>
                      ["new", "contacted", "qualified"].includes(l.status)
                    ).length
                  }
                </div>
                <p className="text-sm text-oma-cocoa">Active</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-oma-plum">
                  $
                  {filteredLeads
                    .reduce((sum, l) => sum + (l.estimated_value || 0), 0)
                    .toLocaleString()}
                </div>
                <p className="text-sm text-oma-cocoa">Total Pipeline Value</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Leads List */}
        {filteredLeads.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <h3 className="text-lg font-canela text-oma-plum mb-2">
                  {leads.length === 0
                    ? "No leads yet"
                    : "No leads match your filters"}
                </h3>
                <p className="text-oma-cocoa">
                  {leads.length === 0
                    ? isSuperAdmin
                      ? "When customers contact brands on the platform, leads will appear here."
                      : "When customers contact you through your brand pages, leads will appear here."
                    : "Try adjusting your search and filter criteria."}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredLeads.map((lead) => (
              <Card key={lead.id} className="transition-all duration-200">
                {/* Lead Summary Row */}
                <CardHeader
                  className="cursor-pointer hover:bg-oma-beige/20 transition-colors mobile-interactive"
                  onClick={() => toggleLeadExpansion(lead.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col gap-3">
                        <div className="flex-1">
                          <CardTitle className="mobile-heading-responsive font-canela text-oma-plum flex items-center gap-2">
                            <User className="h-5 w-5 flex-shrink-0" />
                            <span className="truncate">
                              {lead.customer_name}
                            </span>
                            {lead.company_name && (
                              <span className="text-sm text-oma-cocoa font-normal hidden sm:inline">
                                ({lead.company_name})
                              </span>
                            )}
                          </CardTitle>

                          {/* Mobile: Company name on separate line */}
                          {lead.company_name && (
                            <div className="sm:hidden text-sm text-oma-cocoa mt-1">
                              {lead.company_name}
                            </div>
                          )}

                          {/* Contact information - responsive layout */}
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2 mobile-text-responsive text-oma-cocoa">
                            <div className="flex items-center gap-1 min-w-0">
                              <Mail className="h-4 w-4 flex-shrink-0" />
                              <span className="truncate">
                                {lead.customer_email}
                              </span>
                            </div>
                            {lead.customer_phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="h-4 w-4 flex-shrink-0" />
                                <span>{lead.customer_phone}</span>
                              </div>
                            )}
                            {lead.location && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4 flex-shrink-0" />
                                <span>{lead.location}</span>
                              </div>
                            )}
                            {lead.brands && (
                              <div className="flex items-center gap-1">
                                <Building className="h-4 w-4 flex-shrink-0" />
                                <span>{lead.brands.name}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Mobile: Badges on separate row */}
                        <div className="flex flex-wrap items-center gap-2 sm:hidden">
                          <Badge className={getStatusColor(lead.status)}>
                            {lead.status.replace("_", " ")}
                          </Badge>
                          <Badge className={getPriorityColor(lead.priority)}>
                            {lead.priority}
                          </Badge>
                          {lead.estimated_value && (
                            <Badge variant="outline">
                              ${lead.estimated_value.toLocaleString()}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Desktop: Badges and actions in right column */}
                    <div className="hidden sm:flex items-center gap-3 flex-shrink-0">
                      <Badge className={getStatusColor(lead.status)}>
                        {lead.status.replace("_", " ")}
                      </Badge>
                      <Badge className={getPriorityColor(lead.priority)}>
                        {lead.priority}
                      </Badge>
                      {lead.estimated_value && (
                        <Badge variant="outline">
                          ${lead.estimated_value.toLocaleString()}
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleDeleteClick(lead, e)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 mobile-interactive"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                      {expandedLead === lead.id ? (
                        <ChevronUpIcon className="h-5 w-5 text-oma-cocoa" />
                      ) : (
                        <ChevronDownIcon className="h-5 w-5 text-oma-cocoa" />
                      )}
                    </div>

                    {/* Mobile: Action buttons row */}
                    <div className="sm:hidden flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleDeleteClick(lead, e)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 mobile-interactive"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                      {expandedLead === lead.id ? (
                        <ChevronUpIcon className="h-5 w-5 text-oma-cocoa" />
                      ) : (
                        <ChevronDownIcon className="h-5 w-5 text-oma-cocoa" />
                      )}
                    </div>
                  </div>
                </CardHeader>

                {/* Expanded Lead Details */}
                {expandedLead === lead.id && (
                  <CardContent className="border-t bg-oma-beige/10 mobile-padding">
                    <Tabs defaultValue="details" className="w-full">
                      <TabsList className="grid w-full grid-cols-3 mobile-interactive">
                        <TabsTrigger
                          value="details"
                          className="mobile-interactive"
                        >
                          Details
                        </TabsTrigger>
                        <TabsTrigger
                          value="interactions"
                          className="mobile-interactive"
                        >
                          Interactions
                        </TabsTrigger>
                        <TabsTrigger
                          value="actions"
                          className="mobile-interactive"
                        >
                          Actions
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="details" className="space-y-4 mt-4">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-medium text-oma-plum mb-2 mobile-text-responsive">
                                Lead Information
                              </h4>
                              <div className="space-y-2 mobile-text-responsive">
                                <div>
                                  <span className="font-medium">Source:</span>{" "}
                                  {lead.source}
                                </div>
                                <div>
                                  <span className="font-medium">Type:</span>{" "}
                                  {lead.lead_type || "Not specified"}
                                </div>
                                <div>
                                  <span className="font-medium">Created:</span>{" "}
                                  {new Date(
                                    lead.created_at
                                  ).toLocaleDateString()}
                                </div>
                              </div>
                            </div>

                            {lead.notes && (
                              <div>
                                <h4 className="font-medium text-oma-plum mb-2 mobile-text-responsive">
                                  Notes
                                </h4>
                                <p className="mobile-text-responsive text-oma-cocoa bg-white p-3 rounded border">
                                  {lead.notes}
                                </p>
                              </div>
                            )}
                          </div>

                          <div className="space-y-4">
                            <div>
                              <h4 className="font-medium text-oma-plum mb-2 mobile-text-responsive">
                                Status & Priority
                              </h4>
                              <div className="space-y-3">
                                <div>
                                  <label className="mobile-text-responsive font-medium text-oma-cocoa">
                                    Status
                                  </label>
                                  <Select
                                    value={lead.status}
                                    onValueChange={(value) =>
                                      updateLeadStatus(lead.id, value)
                                    }
                                    disabled={updatingLeadId === lead.id}
                                  >
                                    <SelectTrigger className="mt-1 mobile-interactive">
                                      <SelectValue />
                                      {updatingLeadId === lead.id && (
                                        <div className="ml-2 h-4 w-4 animate-spin rounded-full border-2 border-oma-plum border-t-transparent"></div>
                                      )}
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="new">New</SelectItem>
                                      <SelectItem value="contacted">
                                        Contacted
                                      </SelectItem>
                                      <SelectItem value="qualified">
                                        Qualified
                                      </SelectItem>
                                      <SelectItem value="converted">
                                        Converted
                                      </SelectItem>
                                      <SelectItem value="lost">Lost</SelectItem>
                                      <SelectItem value="closed">
                                        Closed
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            </div>

                            <div>
                              <h4 className="font-medium text-oma-plum mb-2 mobile-text-responsive">
                                Quick Actions
                              </h4>
                              <div className="mobile-button-group">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    window.open(
                                      `mailto:${lead.customer_email}`,
                                      "_blank"
                                    )
                                  }
                                  className="mobile-interactive"
                                >
                                  <Mail className="mr-2 h-4 w-4" />
                                  Email
                                </Button>
                                {lead.customer_phone && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      window.open(
                                        `tel:${lead.customer_phone}`,
                                        "_blank"
                                      )
                                    }
                                    className="mobile-interactive"
                                  >
                                    <Phone className="mr-2 h-4 w-4" />
                                    Call
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent
                        value="interactions"
                        className="space-y-4 mt-4"
                      >
                        {/* Add New Interaction */}
                        {!isAddingInteraction ? (
                          <Button
                            onClick={() => setIsAddingInteraction(true)}
                            className="bg-oma-plum hover:bg-oma-plum/90"
                          >
                            Add Interaction
                          </Button>
                        ) : (
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-lg">
                                Add New Interaction
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <Select
                                  value={newInteraction.type}
                                  onValueChange={(value) =>
                                    setNewInteraction((prev) => ({
                                      ...prev,
                                      type: value,
                                    }))
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Interaction Type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="email">Email</SelectItem>
                                    <SelectItem value="phone">
                                      Phone Call
                                    </SelectItem>
                                    <SelectItem value="meeting">
                                      Meeting
                                    </SelectItem>
                                    <SelectItem value="proposal">
                                      Proposal
                                    </SelectItem>
                                    <SelectItem value="follow_up">
                                      Follow Up
                                    </SelectItem>
                                  </SelectContent>
                                </Select>

                                <Input
                                  placeholder="Subject (optional)"
                                  value={newInteraction.subject}
                                  onChange={(e) =>
                                    setNewInteraction((prev) => ({
                                      ...prev,
                                      subject: e.target.value,
                                    }))
                                  }
                                />
                              </div>

                              <Textarea
                                placeholder="Description *"
                                value={newInteraction.description}
                                onChange={(e) =>
                                  setNewInteraction((prev) => ({
                                    ...prev,
                                    description: e.target.value,
                                  }))
                                }
                                rows={3}
                              />

                              <div className="grid grid-cols-2 gap-4">
                                <Input
                                  placeholder="Outcome (optional)"
                                  value={newInteraction.outcome}
                                  onChange={(e) =>
                                    setNewInteraction((prev) => ({
                                      ...prev,
                                      outcome: e.target.value,
                                    }))
                                  }
                                />

                                <Input
                                  placeholder="Next Action (optional)"
                                  value={newInteraction.nextAction}
                                  onChange={(e) =>
                                    setNewInteraction((prev) => ({
                                      ...prev,
                                      nextAction: e.target.value,
                                    }))
                                  }
                                />
                              </div>

                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  onClick={() => setIsAddingInteraction(false)}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  onClick={() => addInteraction(lead.id)}
                                  disabled={isAddingInteraction}
                                  className="bg-oma-plum hover:bg-oma-plum/90"
                                >
                                  {isAddingInteraction
                                    ? "Adding..."
                                    : "Add Interaction"}
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {/* Interactions List */}
                        <div className="space-y-3">
                          {leadInteractions.length === 0 ? (
                            <p className="text-center text-oma-cocoa py-4">
                              No interactions recorded yet
                            </p>
                          ) : (
                            leadInteractions.map((interaction) => (
                              <Card key={interaction.id}>
                                <CardContent className="pt-4">
                                  <div className="flex justify-between items-start mb-2">
                                    <div>
                                      <Badge variant="outline" className="mb-1">
                                        {interaction.interaction_type.replace(
                                          "_",
                                          " "
                                        )}
                                      </Badge>
                                      {interaction.subject && (
                                        <h5 className="font-medium text-oma-plum">
                                          {interaction.subject}
                                        </h5>
                                      )}
                                    </div>
                                    <span className="text-xs text-oma-cocoa">
                                      {new Date(
                                        interaction.interaction_date
                                      ).toLocaleDateString()}
                                    </span>
                                  </div>

                                  {interaction.description && (
                                    <p className="text-sm text-oma-cocoa mb-2">
                                      {interaction.description}
                                    </p>
                                  )}

                                  {(interaction.outcome ||
                                    interaction.next_action) && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                                      {interaction.outcome && (
                                        <div>
                                          <span className="font-medium">
                                            Outcome:
                                          </span>{" "}
                                          {interaction.outcome}
                                        </div>
                                      )}
                                      {interaction.next_action && (
                                        <div>
                                          <span className="font-medium">
                                            Next Action:
                                          </span>{" "}
                                          {interaction.next_action}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            ))
                          )}
                        </div>
                      </TabsContent>

                      <TabsContent value="actions" className="space-y-4 mt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="font-medium text-oma-plum mb-2">
                              Important Dates
                            </h4>
                            <div className="text-sm space-y-1">
                              <div>
                                <span className="font-medium">Created:</span>{" "}
                                {new Date(lead.created_at).toLocaleDateString()}
                              </div>
                              {lead.last_contact_date && (
                                <div>
                                  <span className="font-medium">
                                    Last Contact:
                                  </span>{" "}
                                  {new Date(
                                    lead.last_contact_date
                                  ).toLocaleDateString()}
                                </div>
                              )}
                              {lead.next_follow_up_date && (
                                <div>
                                  <span className="font-medium">
                                    Next Follow Up:
                                  </span>{" "}
                                  {new Date(
                                    lead.next_follow_up_date
                                  ).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          </div>

                          <div>
                            <h4 className="font-medium text-oma-plum mb-2">
                              Lead Management
                            </h4>
                            <div className="space-y-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={(e) => handleDeleteClick(lead, e)}
                              >
                                <TrashIcon className="mr-2 h-4 w-4" />
                                Delete Lead
                              </Button>
                            </div>
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* Delete Dialog */}
        <AlertDialog
          open={deleteDialogOpen}
          onOpenChange={() => setDeleteDialogOpen(false)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this lead? This action cannot be
                undone.
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

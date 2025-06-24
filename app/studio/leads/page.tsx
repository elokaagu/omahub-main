"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { createClientSupabaseClient } from "@/lib/supabase-unified";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StudioNav } from "@/components/ui/studio-nav";

interface Lead {
  id: string;
  brand_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  company_name?: string;
  lead_source: string;
  lead_status: string;
  lead_score: number;
  priority: string;
  estimated_budget?: number;
  estimated_project_value?: number;
  project_type?: string;
  project_timeline?: string;
  location?: string;
  notes?: string;
  tags?: string[];
  last_contact_date?: string;
  next_follow_up_date?: string;
  created_at: string;
  brand?: {
    name: string;
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
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [leadInteractions, setLeadInteractions] = useState<LeadInteraction[]>(
    []
  );
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

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
      const supabase = createClientSupabaseClient();

      // Check if user is super admin
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role, owned_brands")
        .eq("id", user?.id)
        .single();

      if (profileError) {
        console.error("Error fetching user profile:", profileError);
        toast.error("Failed to load your profile");
        return;
      }

      let leadsQuery = supabase
        .from("leads")
        .select(
          `
          *,
          brand:brands(name),
          inquiry:inquiries(id, subject)
        `
        )
        .order("created_at", { ascending: false });

      // If user is super admin, get all leads
      if (profile?.role === "super_admin") {
        console.log("🔑 Super admin access: Loading all leads");
        setIsSuperAdmin(true);
        // No additional filtering needed for super admin
      } else {
        setIsSuperAdmin(false);
        // Regular user: filter by owned brands
        if (!profile?.owned_brands || profile.owned_brands.length === 0) {
          setLeads([]);
          setLoading(false);
          return;
        }

        const brandIds = profile.owned_brands;
        leadsQuery = leadsQuery.in("brand_id", brandIds);
      }

      const { data: leadsData, error: leadsError } = await leadsQuery;

      if (leadsError) {
        console.error("Error fetching leads:", leadsError);
        toast.error("Failed to load leads");
        return;
      }

      console.log(`📊 Loaded ${leadsData?.length || 0} leads`);
      setLeads(leadsData || []);
    } catch (error) {
      console.error("Error loading leads:", error);
      toast.error("Failed to load leads");
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortLeads = () => {
    let filtered = [...leads];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (lead) =>
          lead.customer_name.toLowerCase().includes(term) ||
          lead.customer_email.toLowerCase().includes(term) ||
          lead.project_type?.toLowerCase().includes(term) ||
          lead.company_name?.toLowerCase().includes(term) ||
          lead.location?.toLowerCase().includes(term)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((lead) => lead.lead_status === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== "all") {
      filtered = filtered.filter((lead) => lead.priority === priorityFilter);
    }

    // Source filter
    if (sourceFilter !== "all") {
      filtered = filtered.filter((lead) => lead.lead_source === sourceFilter);
    }

    // Sort
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
      } else if (sortBy === "estimated_budget" || sortBy === "lead_score") {
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
      const supabase = createClientSupabaseClient();

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

  const updateLeadStatus = async (leadId: string, newStatus: string) => {
    try {
      const supabase = createClientSupabaseClient();

      const { error } = await supabase
        .from("leads")
        .update({
          lead_status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", leadId);

      if (error) {
        console.error("Error updating lead status:", error);
        toast.error("Failed to update lead status");
        return;
      }

      // Update local state
      setLeads((prev) =>
        prev.map((lead) =>
          lead.id === leadId ? { ...lead, lead_status: newStatus } : lead
        )
      );

      if (selectedLead?.id === leadId) {
        setSelectedLead((prev) =>
          prev ? { ...prev, lead_status: newStatus } : null
        );
      }

      toast.success("Lead status updated successfully");
    } catch (error) {
      console.error("Error updating lead status:", error);
      toast.error("Failed to update lead status");
    }
  };

  const addInteraction = async () => {
    if (!selectedLead || !newInteraction.type || !newInteraction.description) {
      toast.error("Please fill in required fields");
      return;
    }

    setIsAddingInteraction(true);

    try {
      const supabase = createClientSupabaseClient();

      const interactionData = {
        lead_id: selectedLead.id,
        interaction_type: newInteraction.type,
        subject: newInteraction.subject || null,
        description: newInteraction.description,
        outcome: newInteraction.outcome || null,
        next_action: newInteraction.nextAction || null,
        created_by: user?.id,
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("lead_interactions")
        .insert(interactionData);

      if (error) {
        console.error("Error adding interaction:", error);
        toast.error("Failed to add interaction");
        return;
      }

      // Update lead's last contact date
      await supabase
        .from("leads")
        .update({
          last_contact_date: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedLead.id);

      toast.success("Interaction added successfully");

      // Reset form
      setNewInteraction({
        type: "email",
        subject: "",
        description: "",
        outcome: "",
        nextAction: "",
      });

      // Reload interactions
      loadLeadInteractions(selectedLead.id);

      // Reload leads to update last contact date
      loadLeads();
    } catch (error) {
      console.error("Error adding interaction:", error);
      toast.error("Failed to add interaction");
    } finally {
      setIsAddingInteraction(false);
    }
  };

  const openLead = (lead: Lead) => {
    setSelectedLead(lead);
    loadLeadInteractions(lead.id);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-blue-100 text-blue-800";
      case "contacted":
        return "bg-yellow-100 text-yellow-800";
      case "qualified":
        return "bg-green-100 text-green-800";
      case "proposal_sent":
        return "bg-purple-100 text-purple-800";
      case "negotiating":
        return "bg-orange-100 text-orange-800";
      case "won":
        return "bg-green-100 text-green-800";
      case "lost":
        return "bg-red-100 text-red-800";
      case "nurturing":
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

  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-100 text-green-800";
    if (score >= 60) return "bg-yellow-100 text-yellow-800";
    if (score >= 40) return "bg-orange-100 text-orange-800";
    return "bg-red-100 text-red-800";
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
        <div className="mb-8">
          <h1 className="text-3xl font-canela text-oma-plum mb-2">
            Leads Dashboard
          </h1>
          <p className="text-oma-cocoa">
            {isSuperAdmin
              ? "Manage all customer leads across the platform"
              : "Track and manage your potential customers"}
          </p>
          {isSuperAdmin && (
            <div className="mt-2">
              <Badge className="bg-oma-plum text-white">
                Super Admin View - All Leads
              </Badge>
            </div>
          )}
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <Input
                placeholder="Search leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                  <SelectItem value="proposal_sent">Proposal Sent</SelectItem>
                  <SelectItem value="negotiating">Negotiating</SelectItem>
                  <SelectItem value="won">Won</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                  <SelectItem value="nurturing">Nurturing</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="contact_form">Contact Form</SelectItem>
                  <SelectItem value="social_media">Social Media</SelectItem>
                  <SelectItem value="referral">Referral</SelectItem>
                  <SelectItem value="website">Website</SelectItem>
                  <SelectItem value="phone">Phone</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="event">Event</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">Created Date</SelectItem>
                  <SelectItem value="lead_score">Lead Score</SelectItem>
                  <SelectItem value="estimated_budget">Budget</SelectItem>
                  <SelectItem value="last_contact_date">
                    Last Contact
                  </SelectItem>
                  <SelectItem value="next_follow_up_date">
                    Follow Up Date
                  </SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger>
                  <SelectValue placeholder="Order" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Descending</SelectItem>
                  <SelectItem value="asc">Ascending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

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
                  {filteredLeads.filter((l) => l.lead_status === "won").length}
                </div>
                <p className="text-sm text-oma-cocoa">Won</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {
                    filteredLeads.filter((l) =>
                      ["new", "contacted", "qualified"].includes(l.lead_status)
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
                    .reduce((sum, l) => sum + (l.estimated_budget || 0), 0)
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
              <Card
                key={lead.id}
                className="cursor-pointer transition-colors hover:bg-oma-beige/20"
                onClick={() => openLead(lead)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-canela text-oma-plum">
                        {lead.customer_name}
                        {lead.company_name && ` (${lead.company_name})`}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-oma-cocoa">
                          {lead.customer_email}
                        </span>
                        {lead.customer_phone && (
                          <span className="text-sm text-oma-cocoa">
                            • {lead.customer_phone}
                          </span>
                        )}
                        {lead.brand && (
                          <span className="text-sm text-oma-cocoa">
                            • Brand: {lead.brand.name}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getScoreColor(lead.lead_score)}>
                        Score: {lead.lead_score}
                      </Badge>
                      <Badge className={getStatusColor(lead.lead_status)}>
                        {lead.lead_status.replace("_", " ")}
                      </Badge>
                      <Badge className={getPriorityColor(lead.priority)}>
                        {lead.priority}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm font-medium text-oma-plum">
                        Project
                      </p>
                      <p className="text-sm text-oma-cocoa">
                        {lead.project_type || "Not specified"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-oma-plum">
                        Timeline
                      </p>
                      <p className="text-sm text-oma-cocoa">
                        {lead.project_timeline || "Not specified"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-oma-plum">
                        Budget
                      </p>
                      <p className="text-sm text-oma-cocoa">
                        {lead.estimated_budget
                          ? `$${lead.estimated_budget.toLocaleString()}`
                          : "Not specified"}
                      </p>
                    </div>
                  </div>

                  {lead.tags && lead.tags.length > 0 && (
                    <div className="mt-3">
                      <div className="flex flex-wrap gap-1">
                        {lead.tags.map((tag, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <p className="text-sm text-oma-cocoa/70 mt-2">
                    Created: {new Date(lead.created_at).toLocaleDateString()}
                    {lead.last_contact_date && (
                      <span>
                        {" "}
                        • Last Contact:{" "}
                        {new Date(lead.last_contact_date).toLocaleDateString()}
                      </span>
                    )}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Lead Detail Modal */}
        <Dialog
          open={!!selectedLead}
          onOpenChange={() => setSelectedLead(null)}
        >
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedLead?.customer_name}
                {selectedLead?.company_name &&
                  ` (${selectedLead.company_name})`}
              </DialogTitle>
              <DialogDescription>
                {selectedLead?.customer_email}
                {selectedLead?.customer_phone &&
                  ` • ${selectedLead.customer_phone}`}
              </DialogDescription>
            </DialogHeader>

            {selectedLead && (
              <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="interactions">Interactions</TabsTrigger>
                  <TabsTrigger value="actions">Actions</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-oma-plum mb-2">
                        Lead Information
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Status:</span>
                          <Badge
                            className={getStatusColor(selectedLead.lead_status)}
                          >
                            {selectedLead.lead_status.replace("_", " ")}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Priority:</span>
                          <Badge
                            className={getPriorityColor(selectedLead.priority)}
                          >
                            {selectedLead.priority}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Score:</span>
                          <Badge
                            className={getScoreColor(selectedLead.lead_score)}
                          >
                            {selectedLead.lead_score}/100
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Source:</span>
                          <span>
                            {selectedLead.lead_source.replace("_", " ")}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-oma-plum mb-2">
                        Project Details
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Type:</span>
                          <span>
                            {selectedLead.project_type || "Not specified"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Timeline:</span>
                          <span>
                            {selectedLead.project_timeline || "Not specified"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Budget:</span>
                          <span>
                            {selectedLead.estimated_budget
                              ? `$${selectedLead.estimated_budget.toLocaleString()}`
                              : "Not specified"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Location:</span>
                          <span>
                            {selectedLead.location || "Not specified"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {selectedLead.tags && selectedLead.tags.length > 0 && (
                    <div>
                      <h4 className="font-medium text-oma-plum mb-2">Tags</h4>
                      <div className="flex flex-wrap gap-1">
                        {selectedLead.tags.map((tag, index) => (
                          <Badge key={index} variant="outline">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedLead.notes && (
                    <div>
                      <h4 className="font-medium text-oma-plum mb-2">Notes</h4>
                      <div className="bg-oma-beige/20 p-4 rounded-lg">
                        <p className="text-sm text-oma-cocoa whitespace-pre-wrap">
                          {selectedLead.notes}
                        </p>
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="interactions" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium text-oma-plum">
                      Interaction History
                    </h4>
                    <Button
                      size="sm"
                      onClick={() => setIsAddingInteraction(true)}
                      className="bg-oma-plum hover:bg-oma-plum/90"
                    >
                      Add Interaction
                    </Button>
                  </div>

                  {isAddingInteraction && (
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
                              <SelectItem value="phone">Phone Call</SelectItem>
                              <SelectItem value="meeting">Meeting</SelectItem>
                              <SelectItem value="proposal">Proposal</SelectItem>
                              <SelectItem value="contract">Contract</SelectItem>
                              <SelectItem value="note">Note</SelectItem>
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
                            onClick={addInteraction}
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

                <TabsContent value="actions" className="space-y-4">
                  <div>
                    <h4 className="font-medium text-oma-plum mb-4">
                      Update Lead Status
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {[
                        "new",
                        "contacted",
                        "qualified",
                        "proposal_sent",
                        "negotiating",
                        "won",
                        "lost",
                        "nurturing",
                      ].map((status) => (
                        <Button
                          key={status}
                          variant={
                            selectedLead.lead_status === status
                              ? "default"
                              : "outline"
                          }
                          size="sm"
                          onClick={() =>
                            updateLeadStatus(selectedLead.id, status)
                          }
                          className={
                            selectedLead.lead_status === status
                              ? "bg-oma-plum hover:bg-oma-plum/90"
                              : ""
                          }
                        >
                          {status.replace("_", " ")}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <h4 className="font-medium text-oma-plum mb-2">
                        Important Dates
                      </h4>
                      <div className="text-sm space-y-1">
                        <div>
                          <span className="font-medium">Created:</span>{" "}
                          {new Date(
                            selectedLead.created_at
                          ).toLocaleDateString()}
                        </div>
                        {selectedLead.last_contact_date && (
                          <div>
                            <span className="font-medium">Last Contact:</span>{" "}
                            {new Date(
                              selectedLead.last_contact_date
                            ).toLocaleDateString()}
                          </div>
                        )}
                        {selectedLead.next_follow_up_date && (
                          <div>
                            <span className="font-medium">Next Follow Up:</span>{" "}
                            {new Date(
                              selectedLead.next_follow_up_date
                            ).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-oma-plum mb-2">
                        Quick Actions
                      </h4>
                      <div className="space-y-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start"
                          onClick={() =>
                            window.open(
                              `mailto:${selectedLead.customer_email}`,
                              "_blank"
                            )
                          }
                        >
                          Send Email
                        </Button>
                        {selectedLead.customer_phone && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full justify-start"
                            onClick={() =>
                              window.open(
                                `tel:${selectedLead.customer_phone}`,
                                "_blank"
                              )
                            }
                          >
                            Call Customer
                          </Button>
                        )}
                        {selectedLead.inquiry && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full justify-start"
                            onClick={() => {
                              setSelectedLead(null);
                              // Navigate to inbox would go here
                            }}
                          >
                            View Original Inquiry
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

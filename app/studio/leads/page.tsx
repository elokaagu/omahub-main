"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { StudioNav } from "@/components/ui/studio-nav";
import { Filter, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { Lead } from "./types";
import { normalizeLead } from "./types";
import { useStudioLeads } from "./useStudioLeads";
import { LeadsStatsCards } from "./components/LeadsStatsCards";
import { LeadsFiltersBar } from "./components/LeadsFiltersBar";
import { LeadsList } from "./components/LeadsList";
import { DeleteLeadDialog } from "./components/DeleteLeadDialog";

export default function StudioLeadsPage() {
  const { user, loading: authLoading } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";

  const {
    leads,
    setLeads,
    leadStats,
    statsError,
    leadsError,
    loading,
    refreshing,
    loadAll,
    refreshStats,
    statsRefreshing,
  } = useStudioLeads({
    userId: user?.id,
    authLoading,
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [updatingLeadId, setUpdatingLeadId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredLeads = useMemo(() => {
    let filtered = [...leads];

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (lead) =>
          lead.customer_name.toLowerCase().includes(q) ||
          lead.contact_email.toLowerCase().includes(q) ||
          (lead.notes && lead.notes.toLowerCase().includes(q))
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((lead) => lead.status === statusFilter);
    }

    if (sourceFilter !== "all") {
      filtered = filtered.filter((lead) => lead.source === sourceFilter);
    }

    if (priorityFilter !== "all") {
      filtered = filtered.filter((lead) => lead.priority === priorityFilter);
    }

    const sortKey = sortBy as keyof Lead;
    filtered.sort((a, b) => {
      let aValue: string | number = a[sortKey] as string | number;
      let bValue: string | number = b[sortKey] as string | number;

      if (sortBy === "created_at" || sortBy === "updated_at") {
        aValue = new Date(String(aValue || 0)).getTime();
        bValue = new Date(String(bValue || 0)).getTime();
      }

      if (aValue === bValue) return 0;
      const cmp = aValue > bValue ? 1 : -1;
      return sortOrder === "asc" ? cmp : -cmp;
    });

    return filtered;
  }, [leads, searchTerm, statusFilter, sourceFilter, priorityFilter, sortBy, sortOrder]);

  const updateLeadStatus = async (leadId: string, newStatus: string) => {
    if (updatingLeadId === leadId) return;

    const leadToUpdate = leads.find((lead) => lead.id === leadId);
    if (!leadToUpdate) {
      toast.error("Lead not found");
      return;
    }

    const originalStatus = leadToUpdate.status;
    setUpdatingLeadId(leadId);

    setLeads((prev) =>
      prev.map((lead) =>
        lead.id === leadId ? { ...lead, status: newStatus as Lead["status"] } : lead
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

      const response = await fetch("/api/leads", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: leadId, data: updateData }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          typeof errorData.error === "string"
            ? errorData.error
            : "Failed to update lead status"
        );
      }

      const result = await response.json();
      if (result.lead) {
        setLeads((prev) =>
          prev.map((lead) =>
            lead.id === leadId
              ? normalizeLead({ ...lead, ...result.lead })
              : lead
          )
        );
      }

      void refreshStats();

      window.dispatchEvent(
        new CustomEvent("leadUpdated", {
          detail: { leadId, newStatus },
        })
      );

      toast.success("Lead status updated successfully");
    } catch (error) {
      console.error("Error updating lead status:", error);
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

  const deleteLead = async () => {
    const lead = leadToDelete;
    if (!lead || isDeleting) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/leads?id=${lead.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          typeof errorData.error === "string"
            ? errorData.error
            : "Failed to delete lead"
        );
      }

      setLeads((prev) => prev.filter((l) => l.id !== lead.id));
      setDeleteDialogOpen(false);
      setLeadToDelete(null);
      toast.success("Lead deleted successfully");

      window.dispatchEvent(
        new CustomEvent("leadDeleted", {
          detail: { leadId: lead.id, leadName: lead.customer_name },
        })
      );

      void refreshStats();
    } catch (error) {
      console.error("Error deleting lead:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete lead"
      );
    } finally {
      setIsDeleting(false);
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
                Please log in to access the Studio Leads.
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

  return (
    <div className="min-h-screen bg-oma-cream">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <StudioNav />

        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-canela text-oma-plum mb-2">Studio Leads</h1>
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
          </div>
        </div>

        <LeadsStatsCards
          leadStats={leadStats}
          statsError={statsError}
          onRetryStats={() => void refreshStats()}
          statsRefreshing={statsRefreshing}
        />

        {leadsError && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Leads couldn’t load</AlertTitle>
            <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <span>{leadsError}</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-current shrink-0 w-fit"
                onClick={() => void loadAll()}
                disabled={loading || refreshing}
              >
                Try again
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <LeadsFiltersBar
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          sourceFilter={sourceFilter}
          onSourceFilterChange={setSourceFilter}
          priorityFilter={priorityFilter}
          onPriorityFilterChange={setPriorityFilter}
          sortBy={sortBy}
          onSortByChange={setSortBy}
          sortOrder={sortOrder}
          onToggleSortOrder={() => setSortOrder((o) => (o === "asc" ? "desc" : "asc"))}
          filteredCount={filteredLeads.length}
          totalCount={leads.length}
        />

        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-oma-plum mx-auto mb-4"></div>
            <p className="text-oma-cocoa">Loading leads...</p>
          </div>
        )}

        {!loading && filteredLeads.length === 0 && (
          <Card className="border border-oma-gold/10 bg-white">
            <CardContent className="pt-6">
              <div className="text-center py-8">
                {leadsError && leads.length === 0 ? (
                  <>
                    <div className="w-16 h-16 bg-oma-cocoa/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <AlertCircle className="h-8 w-8 text-oma-cocoa/50" />
                    </div>
                    <h3 className="text-lg font-canela text-oma-plum mb-2">
                      Unable to load leads
                    </h3>
                    <p className="text-oma-cocoa mb-4 max-w-md mx-auto">
                      Use the banner above or try again once your connection is stable.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      className="border-oma-plum text-oma-plum"
                      onClick={() => void loadAll()}
                      disabled={loading || refreshing}
                    >
                      Retry
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-oma-cocoa/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Filter className="h-8 w-8 text-oma-cocoa/50" />
                    </div>
                    <h3 className="text-lg font-canela text-oma-plum mb-2">
                      {leads.length === 0 ? "No leads yet" : "No leads match your filters"}
                    </h3>
                    <p className="text-oma-cocoa mb-4">
                      {leads.length === 0
                        ? "When customers contact brands or submit orders, leads will appear here."
                        : "Try adjusting your search criteria or filters."}
                    </p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {!loading && filteredLeads.length > 0 && (
          <LeadsList
            leads={filteredLeads}
            updatingLeadId={updatingLeadId}
            onStatusChange={(id, status) => void updateLeadStatus(id, status)}
            onRequestDelete={(lead) => {
              setLeadToDelete(lead);
              setDeleteDialogOpen(true);
            }}
          />
        )}

        <DeleteLeadDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          lead={leadToDelete}
          isDeleting={isDeleting}
          onConfirm={() => void deleteLead()}
        />
      </div>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { AlertCircle, Filter, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { Lead } from "../leads/types";
import { normalizeLead } from "../leads/types";
import { LeadsList } from "../leads/components/LeadsList";
import { DeleteLeadDialog } from "../leads/components/DeleteLeadDialog";
import { StudioAuthPlaceholder } from "@/components/studio/StudioAuthPlaceholder";
import { useStudioEventWaitlist } from "./useStudioEventWaitlist";

export default function StudioEventWaitlistPage() {
  const { user, loading: authLoading } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";

  const { leads, setLeads, error, loading, refreshing, loadAll } =
    useStudioEventWaitlist({
      userId: user?.id,
      authLoading,
      enabled: isSuperAdmin,
    });

  const [searchTerm, setSearchTerm] = useState("");
  const [updatingLeadId, setUpdatingLeadId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredLeads = useMemo(() => {
    if (!searchTerm.trim()) return leads;
    const q = searchTerm.toLowerCase();
    return leads.filter(
      (lead) =>
        lead.customer_name.toLowerCase().includes(q) ||
        (lead.contact_email && lead.contact_email.toLowerCase().includes(q)) ||
        (lead.contact_phone && lead.contact_phone.toLowerCase().includes(q)) ||
        (lead.notes && lead.notes.toLowerCase().includes(q)),
    );
  }, [leads, searchTerm]);

  const updateLeadStatus = async (leadId: string, newStatus: string) => {
    if (updatingLeadId === leadId) return;

    const leadToUpdate = leads.find((l) => l.id === leadId);
    if (!leadToUpdate) {
      toast.error("Entry not found");
      return;
    }

    const originalStatus = leadToUpdate.status;
    setUpdatingLeadId(leadId);

    setLeads((prev) =>
      prev.map((lead) =>
        lead.id === leadId
          ? { ...lead, status: newStatus as Lead["status"] }
          : lead,
      ),
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
            : "Failed to update status",
        );
      }

      const result = await response.json();
      if (result.lead) {
        setLeads((prev) =>
          prev.map((lead) =>
            lead.id === leadId
              ? normalizeLead({ ...lead, ...result.lead })
              : lead,
          ),
        );
      }

      window.dispatchEvent(
        new CustomEvent("leadUpdated", {
          detail: { leadId, newStatus },
        }),
      );

      toast.success("Status updated");
    } catch (err) {
      console.error(err);
      setLeads((prev) =>
        prev.map((lead) =>
          lead.id === leadId ? { ...lead, status: originalStatus } : lead,
        ),
      );
      toast.error(err instanceof Error ? err.message : "Update failed");
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
            : "Failed to delete entry",
        );
      }

      setLeads((prev) => prev.filter((l) => l.id !== lead.id));
      setDeleteDialogOpen(false);
      setLeadToDelete(null);
      toast.success("Removed from list");

      window.dispatchEvent(
        new CustomEvent("leadDeleted", {
          detail: { leadId: lead.id, leadName: lead.customer_name },
        }),
      );
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setIsDeleting(false);
    }
  };

  if (authLoading) {
    return <StudioAuthPlaceholder />;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-oma-cream flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-xl font-canela text-oma-plum mb-2">
                Authentication required
              </h2>
              <p className="text-oma-cocoa mb-4">Sign in to open Studio.</p>
              <Button asChild className="bg-oma-plum hover:bg-oma-plum/90">
                <Link href="/login">Log in</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen bg-oma-cream">
        <div className="max-w-2xl mx-auto px-6 py-16 text-center">
          <h1 className="text-2xl font-canela text-oma-plum mb-2">Waitlist</h1>
          <p className="text-oma-cocoa mb-6">
            Only super admins can view sitewide product preorder signups.
          </p>
          <Button
            asChild
            variant="outline"
            className="border-oma-plum text-oma-plum"
          >
            <Link href="/studio">Back to Studio</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-oma-cream">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-canela text-oma-plum mb-2">
              Product preorder waitlist
            </h1>
            <p className="text-oma-cocoa max-w-2xl">
              Everyone who submitted the sitewide product preorder form. Each row
              is a platform lead with designer, item, size, and notes in the
              details block.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-oma-plum text-oma-plum shrink-0"
            onClick={() => void loadAll()}
            disabled={loading || refreshing}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Input
            type="search"
            placeholder="Search by name, email, phone, or notes…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md bg-white border-oma-gold/20"
          />
          <p className="text-sm text-oma-cocoa">
            Showing {filteredLeads.length} of {leads.length} signups
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Could not load waitlist</AlertTitle>
            <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <span>{error}</span>
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

        {loading && (
          <p className="py-8 text-center text-sm text-oma-cocoa">
            Loading waitlist…
          </p>
        )}

        {!loading && filteredLeads.length === 0 && (
          <Card className="border border-oma-gold/10 bg-white">
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-oma-cocoa/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  {error && leads.length === 0 ? (
                    <AlertCircle className="h-8 w-8 text-oma-cocoa/50" />
                  ) : (
                    <Filter className="h-8 w-8 text-oma-cocoa/50" />
                  )}
                </div>
                <h3 className="text-lg font-canela text-oma-plum mb-2">
                  {error && leads.length === 0
                    ? "Unable to load signups"
                    : leads.length === 0
                      ? "No signups yet"
                      : "No matches"}
                </h3>
                <p className="text-oma-cocoa mb-4 max-w-md mx-auto">
                  {error && leads.length === 0
                    ? "Use the banner above or try again when your connection is stable."
                    : leads.length === 0
                      ? "Submissions from the product preorder page will appear here."
                      : "Try a different search term."}
                </p>
                {error && leads.length === 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    className="border-oma-plum text-oma-plum"
                    onClick={() => void loadAll()}
                    disabled={loading || refreshing}
                  >
                    Retry
                  </Button>
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

"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import type { StatusFilter } from "./types";
import { useStudioApplications } from "./useStudioApplications";
import { ApplicationsToolbar } from "./ApplicationsToolbar";
import { ApplicationsList } from "./ApplicationsList";
import { ApplicationDetailModal } from "./ApplicationDetailModal";
import { DeleteApplicationModal } from "./DeleteApplicationModal";

export default function ApplicationsPage() {
  const { user, loading: authLoading } = useAuth();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const isSuperAdmin = user?.role === "super_admin";

  const {
    applications,
    loading,
    error,
    fetchApplications,
    selectedApplication,
    setSelectedApplication,
    updatingApplicationId,
    deletingApplication,
    updateApplicationStatus,
    deleteApplication,
  } = useStudioApplications(isSuperAdmin === true);

  const accessDenied = Boolean(user && user.role !== "super_admin");

  const filteredApplications = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    return applications.filter((app) => {
      const matchesSearch =
        !searchTerm ||
        app.brand_name.toLowerCase().includes(searchLower) ||
        app.designer_name.toLowerCase().includes(searchLower) ||
        app.email.toLowerCase().includes(searchLower) ||
        app.location.toLowerCase().includes(searchLower) ||
        app.category.toLowerCase().includes(searchLower) ||
        app.description.toLowerCase().includes(searchLower);

      const matchesStatus =
        statusFilter === "all" || app.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [applications, searchTerm, statusFilter]);

  if (authLoading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-oma-plum mx-auto" />
          <p className="mt-4 text-oma-cocoa">Loading…</p>
        </div>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="text-center">
          <p className="text-red-500 mb-4">
            You do not have permission to access this page.
          </p>
          <Button onClick={() => window.history.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  if (loading && applications.length === 0 && !error) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-oma-plum mx-auto" />
          <p className="mt-4 text-oma-cocoa">Loading applications…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => void fetchApplications()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <ApplicationsToolbar
        totalCount={applications.length}
        filteredCount={filteredApplications.length}
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onRefresh={() => void fetchApplications()}
        loading={loading}
      />

      <ApplicationsList
        applications={applications}
        filteredApplications={filteredApplications}
        onClearFilters={() => {
          setSearchTerm("");
          setStatusFilter("all");
        }}
        onViewDetails={setSelectedApplication}
        onApprove={(id) => void updateApplicationStatus(id, "approved")}
        onReject={(id) => void updateApplicationStatus(id, "rejected")}
        onRequestDelete={setDeleteTargetId}
        updatingApplicationId={updatingApplicationId}
        deletingApplicationId={deletingApplication}
      />

      {selectedApplication && (
        <ApplicationDetailModal
          application={selectedApplication}
          open
          onOpenChange={(open) => {
            if (!open) setSelectedApplication(null);
          }}
          setApplication={setSelectedApplication}
          onSaveStatus={(id, status, notes) =>
            void updateApplicationStatus(id, status, notes)
          }
          updatingApplicationId={updatingApplicationId}
          onRequestDelete={(id) => {
            setDeleteTargetId(id);
          }}
          deletingApplicationId={deletingApplication}
        />
      )}

      <DeleteApplicationModal
        applicationId={deleteTargetId}
        open={deleteTargetId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTargetId(null);
        }}
        onConfirm={(id) => {
          setDeleteTargetId(null);
          void deleteApplication(id);
        }}
        deletingApplicationId={deletingApplication}
      />
    </div>
  );
}

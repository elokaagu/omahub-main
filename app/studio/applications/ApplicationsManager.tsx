"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import type { DesignerApplication, StatusFilter } from "./types";
import { useStudioApplications } from "./useStudioApplications";
import { ApplicationsToolbar } from "./ApplicationsToolbar";
import { ApplicationsList } from "./ApplicationsList";
import { ApplicationDetailModal } from "./ApplicationDetailModal";
import { DeleteApplicationModal } from "./DeleteApplicationModal";

type ApplicationsManagerProps = {
  /** Rendered on the server; the page has already checked for a super admin. */
  initialApplications: DesignerApplication[];
  initialError: string | null;
};

export function ApplicationsManager({
  initialApplications,
  initialError,
}: ApplicationsManagerProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

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
  } = useStudioApplications(initialApplications, initialError);

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

  if (loading && applications.length === 0 && !error) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="text-center">
          <div className="rounded-full h-12 w-12 border-b-2 border-gray-300 mx-auto" />
          <p className="mt-4 text-gray-600">Loading applications…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => void fetchApplications()}>Try Again</Button>
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

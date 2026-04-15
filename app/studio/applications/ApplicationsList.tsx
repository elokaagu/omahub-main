import { Button } from "@/components/ui/button";
import type { DesignerApplication } from "./types";
import { ApplicationCard } from "./ApplicationCard";

type ApplicationsListProps = {
  applications: DesignerApplication[];
  filteredApplications: DesignerApplication[];
  onClearFilters: () => void;
  onViewDetails: (application: DesignerApplication) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onRequestDelete: (id: string) => void;
  updatingApplicationId: string | null;
  deletingApplicationId: string | null;
};

export function ApplicationsList({
  applications,
  filteredApplications,
  onClearFilters,
  onViewDetails,
  onApprove,
  onReject,
  onRequestDelete,
  updatingApplicationId,
  deletingApplicationId,
}: ApplicationsListProps) {
  if (filteredApplications.length === 0) {
    return (
      <div className="text-center py-12">
        {applications.length === 0 ? (
          <>
            <p className="text-oma-cocoa mb-2">
              No applications found in the database.
            </p>
            <p className="text-sm text-gray-500">
              Applications submitted through the join form will appear here.
            </p>
          </>
        ) : (
          <>
            <p className="text-oma-cocoa mb-2">
              No applications match your filters.
            </p>
            <Button variant="outline" size="sm" onClick={onClearFilters}>
              Clear Filters
            </Button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      {filteredApplications.map((application) => (
        <ApplicationCard
          key={application.id}
          application={application}
          onViewDetails={onViewDetails}
          onApprove={onApprove}
          onReject={onReject}
          onRequestDelete={onRequestDelete}
          updatingApplicationId={updatingApplicationId}
          deletingApplicationId={deletingApplicationId}
        />
      ))}
    </div>
  );
}

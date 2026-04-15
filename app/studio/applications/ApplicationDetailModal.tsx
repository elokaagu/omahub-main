import type { Dispatch, SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle, ExternalLink } from "lucide-react";
import type { DesignerApplication } from "./types";
import { isApplicationStatus } from "./types";
import { ApplicationStatusBadge } from "./ApplicationStatusBadge";

type ApplicationDetailModalProps = {
  application: DesignerApplication;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  setApplication: Dispatch<SetStateAction<DesignerApplication | null>>;
  onSaveStatus: (
    applicationId: string,
    status: DesignerApplication["status"],
    notes?: string
  ) => void;
  updatingApplicationId: string | null;
  onRequestDelete: (applicationId: string) => void;
  deletingApplicationId: string | null;
};

export function ApplicationDetailModal({
  application,
  open,
  onOpenChange,
  setApplication,
  onSaveStatus,
  updatingApplicationId,
  onRequestDelete,
  deletingApplicationId,
}: ApplicationDetailModalProps) {
  const modalBusy = updatingApplicationId === application.id;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto sm:max-w-2xl"
        aria-labelledby="application-modal-title"
      >
        <DialogHeader className="text-left space-y-2 mb-6">
          <DialogTitle
            id="application-modal-title"
            className="text-2xl font-canela text-oma-plum pr-8"
          >
            {application.brand_name}
          </DialogTitle>
          <p className="text-lg text-oma-cocoa font-normal">
            by {application.designer_name}
          </p>
        </DialogHeader>

        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className="block text-sm font-medium text-oma-cocoa mb-1">
                Email
              </span>
              <p className="text-sm">{application.email}</p>
            </div>
            <div>
              <span className="block text-sm font-medium text-oma-cocoa mb-1">
                Location
              </span>
              <p className="text-sm">{application.location}</p>
            </div>
            {application.phone && (
              <div>
                <span className="block text-sm font-medium text-oma-cocoa mb-1">
                  Phone
                </span>
                <p className="text-sm">{application.phone}</p>
              </div>
            )}
            {application.website && (
              <div>
                <span className="block text-sm font-medium text-oma-cocoa mb-1">
                  Website
                </span>
                <a
                  href={application.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-oma-plum hover:underline text-sm"
                >
                  {application.website}
                </a>
              </div>
            )}
            {application.instagram && (
              <div>
                <span className="block text-sm font-medium text-oma-cocoa mb-1">
                  Instagram
                </span>
                <p className="text-sm">
                  @{application.instagram.replace(/^@/, "")}
                </p>
              </div>
            )}
            {application.year_founded && (
              <div>
                <span className="block text-sm font-medium text-oma-cocoa mb-1">
                  Year Founded
                </span>
                <p className="text-sm">{application.year_founded}</p>
              </div>
            )}
          </div>

          <div>
            <span className="block text-sm font-medium text-oma-cocoa mb-1">
              Category
            </span>
            <Badge variant="outline">{application.category}</Badge>
          </div>

          <div>
            <span className="block text-sm font-medium text-oma-cocoa mb-1">
              Description
            </span>
            <p className="text-sm whitespace-pre-wrap">{application.description}</p>
          </div>

          <div>
            <span className="block text-sm font-medium text-oma-cocoa mb-1">
              Status
            </span>
            <div className="flex items-center gap-2">
              <ApplicationStatusBadge status={application.status} />
              <span className="text-sm text-oma-cocoa">
                {application.reviewed_at
                  ? `Reviewed on ${new Date(application.reviewed_at).toLocaleDateString("en-GB")}`
                  : `Submitted on ${new Date(application.created_at).toLocaleDateString("en-GB")}`}
              </span>
            </div>
          </div>

          {application.brand_id && (
            <div className="bg-oma-beige/50 border border-oma-gold/30 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-oma-gold" />
                  <div>
                    <span className="block text-sm font-medium text-oma-plum mb-1">
                      Brand Created
                    </span>
                    <p className="text-xs text-oma-cocoa">
                      {application.brand_verified ? "Verified" : "Unverified"} •
                      Brand is ready for approval
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    window.open(`/studio/brands/${application.brand_id}`, "_blank")
                  }
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  View Brand
                </Button>
              </div>
            </div>
          )}

          {application.notes && (
            <div>
              <span className="block text-sm font-medium text-oma-cocoa mb-1">
                Notes
              </span>
              <p className="text-sm bg-oma-beige/30 p-3 rounded whitespace-pre-wrap">
                {application.notes}
              </p>
            </div>
          )}
        </div>

        <div className="border-t pt-4">
          <h3 className="text-lg font-medium text-oma-plum mb-3">Update Status</h3>
          <div className="space-y-3">
            <Select
              value={application.status}
              onValueChange={(value) => {
                if (!isApplicationStatus(value)) return;
                setApplication((prev) =>
                  prev ? { ...prev, status: value } : null
                );
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="reviewing">Reviewing</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            <Textarea
              placeholder="Add notes about this application..."
              value={application.notes || ""}
              onChange={(e) => {
                setApplication((prev) =>
                  prev ? { ...prev, notes: e.target.value } : null
                );
              }}
              rows={3}
            />

            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={() =>
                  onSaveStatus(
                    application.id,
                    application.status,
                    application.notes
                  )
                }
                disabled={modalBusy}
              >
                {modalBusy ? "Updating…" : "Update Status"}
              </Button>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => onRequestDelete(application.id)}
                disabled={deletingApplicationId === application.id}
              >
                {deletingApplicationId === application.id
                  ? "Deleting…"
                  : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Mail,
  MapPin,
  Globe,
  Instagram,
  Phone,
  Building,
} from "lucide-react";
import type { DesignerApplication } from "./types";
import { ApplicationStatusBadge } from "./ApplicationStatusBadge";

type ApplicationCardProps = {
  application: DesignerApplication;
  onViewDetails: (application: DesignerApplication) => void;
  onApprove: (applicationId: string) => void;
  onReject: (applicationId: string) => void;
  onRequestDelete: (applicationId: string) => void;
  updatingApplicationId: string | null;
  deletingApplicationId: string | null;
};

export function ApplicationCard({
  application,
  onViewDetails,
  onApprove,
  onReject,
  onRequestDelete,
  updatingApplicationId,
  deletingApplicationId,
}: ApplicationCardProps) {
  const rowBusy = updatingApplicationId === application.id;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-xl text-oma-plum">
              {application.brand_name}
            </CardTitle>
            <p className="text-oma-cocoa mt-1">by {application.designer_name}</p>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <ApplicationStatusBadge status={application.status} />
            <span className="text-sm text-oma-cocoa whitespace-nowrap">
              {application.created_at
                ? new Date(application.created_at).toLocaleDateString("en-GB")
                : "N/A"}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-oma-gold shrink-0" />
            <span className="truncate">{application.email}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-oma-gold shrink-0" />
            <span>{application.location}</span>
          </div>
          {application.phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-oma-gold shrink-0" />
              <span>{application.phone}</span>
            </div>
          )}
          {application.website && (
            <div className="flex items-center gap-2 text-sm">
              <Globe className="h-4 w-4 text-oma-gold shrink-0" />
              <a
                href={application.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-oma-plum hover:underline truncate"
              >
                {application.website}
              </a>
            </div>
          )}
          {application.instagram && (
            <div className="flex items-center gap-2 text-sm">
              <Instagram className="h-4 w-4 text-oma-gold shrink-0" />
              <span>@{application.instagram.replace(/^@/, "")}</span>
            </div>
          )}
          {application.year_founded && (
            <div className="flex items-center gap-2 text-sm">
              <Building className="h-4 w-4 text-oma-gold shrink-0" />
              <span>Founded {application.year_founded}</span>
            </div>
          )}
        </div>

        <div className="mb-4">
          <Badge variant="outline" className="mb-2">
            {application.category}
          </Badge>
          <p className="text-sm text-oma-cocoa line-clamp-3">
            {application.description}
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails(application)}
          >
            View Details
          </Button>

          {application.status === "new" && (
            <>
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => onApprove(application.id)}
                disabled={rowBusy}
              >
                {rowBusy ? "Updating…" : "Approve"}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onReject(application.id)}
                disabled={rowBusy}
              >
                {rowBusy ? "Updating…" : "Reject"}
              </Button>
            </>
          )}

          <Button
            variant="destructive"
            size="sm"
            onClick={() => onRequestDelete(application.id)}
            disabled={deletingApplicationId === application.id}
          >
            {deletingApplicationId === application.id ? "Deleting…" : "Delete"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

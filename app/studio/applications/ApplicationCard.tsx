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
  const email = application.email?.trim();
  const location = application.location?.trim();
  const phone = application.phone?.trim();
  const website = application.website?.trim();
  const instagram = application.instagram?.trim();
  const yearFounded =
    application.year_founded !== null &&
    application.year_founded !== undefined &&
    String(application.year_founded).trim() !== ""
      ? String(application.year_founded).trim()
      : "";

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
          {email && (
            <div className="flex items-center gap-2 text-sm text-oma-cocoa">
              <Mail className="h-4 w-4 text-oma-gold shrink-0" />
              <span className="truncate">{email}</span>
            </div>
          )}
          {location && (
            <div className="flex items-center gap-2 text-sm text-oma-cocoa">
              <MapPin className="h-4 w-4 text-oma-gold shrink-0" />
              <span>{location}</span>
            </div>
          )}
          {phone && (
            <div className="flex items-center gap-2 text-sm text-oma-cocoa">
              <Phone className="h-4 w-4 text-oma-gold shrink-0" />
              <span>{phone}</span>
            </div>
          )}
          {website && (
            <div className="flex items-center gap-2 text-sm text-oma-cocoa">
              <Globe className="h-4 w-4 text-oma-gold shrink-0" />
              <a
                href={website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-oma-plum hover:underline truncate"
              >
                {website}
              </a>
            </div>
          )}
          {instagram && (
            <div className="flex items-center gap-2 text-sm text-oma-cocoa">
              <Instagram className="h-4 w-4 text-oma-gold shrink-0" />
              <span>@{instagram.replace(/^@/, "")}</span>
            </div>
          )}
          {yearFounded && (
            <div className="flex items-center gap-2 text-sm text-oma-cocoa">
              <Building className="h-4 w-4 text-oma-gold shrink-0" />
              <span>Founded {yearFounded}</span>
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

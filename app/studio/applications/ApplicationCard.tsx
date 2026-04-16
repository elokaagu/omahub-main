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
  const createdOn = application.created_at
    ? new Date(application.created_at).toLocaleDateString("en-GB")
    : "N/A";
  const hasContactMeta =
    Boolean(email) ||
    Boolean(location) ||
    Boolean(phone) ||
    Boolean(website) ||
    Boolean(instagram) ||
    Boolean(yearFounded);
  const description = application.description?.trim();
  const category = application.category?.trim();

  return (
    <Card className="rounded-2xl border border-black/[0.08] bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <CardHeader className="space-y-3 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <CardTitle className="truncate text-xl font-canela text-oma-plum">
              {application.brand_name}
            </CardTitle>
            <p className="mt-1 text-sm text-oma-cocoa">by {application.designer_name}</p>
          </div>
          <div className="ml-2 flex flex-wrap items-center justify-end gap-2">
            <ApplicationStatusBadge status={application.status} />
            <span className="whitespace-nowrap text-sm text-oma-cocoa">
              {createdOn}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasContactMeta && (
          <div className="grid grid-cols-1 gap-2 rounded-xl border border-oma-beige/70 bg-oma-cream/20 p-3 sm:grid-cols-2">
            {email && (
              <div className="flex items-center gap-2 text-sm text-oma-cocoa">
                <Mail className="h-4 w-4 shrink-0 text-oma-gold" />
                <span className="truncate">{email}</span>
              </div>
            )}
            {location && (
              <div className="flex items-center gap-2 text-sm text-oma-cocoa">
                <MapPin className="h-4 w-4 shrink-0 text-oma-gold" />
                <span className="truncate">{location}</span>
              </div>
            )}
            {phone && (
              <div className="flex items-center gap-2 text-sm text-oma-cocoa">
                <Phone className="h-4 w-4 shrink-0 text-oma-gold" />
                <span className="truncate">{phone}</span>
              </div>
            )}
            {website && (
              <div className="flex items-center gap-2 text-sm text-oma-cocoa">
                <Globe className="h-4 w-4 shrink-0 text-oma-gold" />
                <a
                  href={website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate text-oma-plum hover:underline"
                >
                  {website}
                </a>
              </div>
            )}
            {instagram && (
              <div className="flex items-center gap-2 text-sm text-oma-cocoa">
                <Instagram className="h-4 w-4 shrink-0 text-oma-gold" />
                <span>@{instagram.replace(/^@/, "")}</span>
              </div>
            )}
            {yearFounded && (
              <div className="flex items-center gap-2 text-sm text-oma-cocoa">
                <Building className="h-4 w-4 shrink-0 text-oma-gold" />
                <span>Founded {yearFounded}</span>
              </div>
            )}
          </div>
        )}

        {(category || description) && (
          <div className="space-y-2">
            {category && (
              <Badge variant="outline" className="bg-white">
                {category}
              </Badge>
            )}
            {description && (
              <p className="line-clamp-3 text-sm leading-relaxed text-oma-cocoa">
                {description}
              </p>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-2 border-t border-oma-beige/60 pt-3">
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

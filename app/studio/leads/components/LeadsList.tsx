"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2 } from "lucide-react";
import type { Lead } from "../types";

function getStatusColor(status: string) {
  switch (status) {
    case "new":
      return "bg-blue-100 text-blue-800";
    case "contacted":
      return "bg-yellow-100 text-yellow-800";
    case "qualified":
      return "bg-purple-100 text-purple-800";
    case "converted":
      return "bg-green-100 text-green-800";
    case "lost":
      return "bg-red-100 text-red-800";
    case "closed":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function getPriorityColor(priority: string) {
  switch (priority) {
    case "high":
      return "bg-red-100 text-red-800";
    case "normal":
      return "bg-yellow-100 text-yellow-800";
    case "low":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-GB");
}

type LeadsListProps = {
  leads: Lead[];
  updatingLeadId: string | null;
  onStatusChange: (leadId: string, status: string) => void;
  onRequestDelete: (lead: Lead) => void;
};

export function LeadsList({
  leads,
  updatingLeadId,
  onStatusChange,
  onRequestDelete,
}: LeadsListProps) {
  return (
    <div className="space-y-4">
      {leads.map((lead) => (
        <Card
          key={lead.id}
          className="border border-oma-gold/10 bg-white hover:shadow-md transition-shadow"
        >
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h3 className="text-lg font-semibold text-oma-plum">
                    {lead.customer_name}
                  </h3>
                  <Badge className={getStatusColor(lead.status)}>{lead.status}</Badge>
                  <Badge className={getPriorityColor(lead.priority)}>{lead.priority}</Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-oma-cocoa">
                  <div>
                    <span className="font-medium">Email:</span> {lead.contact_email}
                  </div>
                  {lead.contact_phone && (
                    <div>
                      <span className="font-medium">Phone:</span> {lead.contact_phone}
                    </div>
                  )}
                  <div>
                    <span className="font-medium">Source:</span> {lead.source}
                  </div>
                  <div>
                    <span className="font-medium">Type:</span> {lead.lead_type}
                  </div>
                  <div>
                    <span className="font-medium">Brand:</span>{" "}
                    {lead.brand?.name ?? "Unknown Brand"}
                  </div>
                  {lead.estimated_value != null && (
                    <div>
                      <span className="font-medium">Value:</span> £{lead.estimated_value}
                    </div>
                  )}
                  <div>
                    <span className="font-medium">Created:</span>{" "}
                    {formatDate(lead.created_at)}
                  </div>
                  {lead.updated_at && (
                    <div>
                      <span className="font-medium">Updated:</span>{" "}
                      {formatDate(lead.updated_at)}
                    </div>
                  )}
                </div>

                {lead.notes && (
                  <div className="mt-3">
                    <span className="font-medium text-oma-cocoa">Notes:</span>
                    <p className="text-sm text-oma-cocoa/80 mt-1">{lead.notes}</p>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 ml-4 shrink-0">
                <Select
                  value={lead.status}
                  onValueChange={(value) => onStatusChange(lead.id, value)}
                  disabled={updatingLeadId === lead.id}
                >
                  <SelectTrigger className="w-32 border-oma-cocoa/20 focus:border-oma-plum">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="qualified">Qualified</SelectItem>
                    <SelectItem value="converted">Converted</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRequestDelete(lead)}
                  className="border-red-200 text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

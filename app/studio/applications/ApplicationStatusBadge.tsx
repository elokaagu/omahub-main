import { Badge } from "@/components/ui/badge";
import type { ApplicationStatus } from "./types";

export function ApplicationStatusBadge({ status }: { status: ApplicationStatus }) {
  switch (status) {
    case "new":
      return (
        <Badge variant="secondary" className="bg-gray-200 text-gray-800">
          New
        </Badge>
      );
    case "reviewing":
      return (
        <Badge variant="default" className="bg-blue-500 text-white">
          Reviewing
        </Badge>
      );
    case "approved":
      return (
        <Badge
          variant="default"
          className="bg-green-500 text-white hover:bg-green-600"
        >
          Approved
        </Badge>
      );
    case "rejected":
      return (
        <Badge
          variant="destructive"
          className="bg-red-500 text-white hover:bg-red-600"
        >
          Rejected
        </Badge>
      );
  }
}

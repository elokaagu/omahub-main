import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RefreshCw, Search, X } from "lucide-react";
import type { StatusFilter } from "./types";
import { isStatusFilter } from "./types";

type ApplicationsToolbarProps = {
  totalCount: number;
  filteredCount: number;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (value: StatusFilter) => void;
  onRefresh: () => void;
  loading: boolean;
};

export function ApplicationsToolbar({
  totalCount,
  filteredCount,
  searchTerm,
  onSearchTermChange,
  statusFilter,
  onStatusFilterChange,
  onRefresh,
  loading,
}: ApplicationsToolbarProps) {
  return (
    <>
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-canela text-oma-plum mb-2">
            Designer Applications
          </h1>
          <p className="text-oma-cocoa">
            Review and manage designer applications for the platform
            {totalCount > 0 && (
              <span className="ml-2 text-sm">
                ({totalCount} total
                {filteredCount !== totalCount && `, ${filteredCount} shown`})
              </span>
            )}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={onRefresh}
          disabled={loading}
          className="shrink-0"
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
          />
          {loading ? "Refreshing…" : "Refresh"}
        </Button>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search applications..."
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            className="pl-10 pr-10 max-w-md"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => onSearchTermChange("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            if (isStatusFilter(v)) onStatusFilterChange(v);
          }}
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="reviewing">Reviewing</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </>
  );
}

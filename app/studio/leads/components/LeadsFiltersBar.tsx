"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";

type LeadsFiltersBarProps = {
  searchTerm: string;
  onSearchTermChange: (v: string) => void;
  statusFilter: string;
  onStatusFilterChange: (v: string) => void;
  sourceFilter: string;
  onSourceFilterChange: (v: string) => void;
  priorityFilter: string;
  onPriorityFilterChange: (v: string) => void;
  sortBy: string;
  onSortByChange: (v: string) => void;
  sortOrder: "asc" | "desc";
  onToggleSortOrder: () => void;
  filteredCount: number;
  totalCount: number;
};

export function LeadsFiltersBar({
  searchTerm,
  onSearchTermChange,
  statusFilter,
  onStatusFilterChange,
  sourceFilter,
  onSourceFilterChange,
  priorityFilter,
  onPriorityFilterChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onToggleSortOrder,
  filteredCount,
  totalCount,
}: LeadsFiltersBarProps) {
  return (
    <Card className="border border-oma-gold/10 bg-white mb-6">
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <Label htmlFor="search" className="text-sm font-medium text-oma-cocoa">
              Search
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-oma-cocoa/50" />
              <Input
                id="search"
                placeholder="Search leads..."
                value={searchTerm}
                onChange={(e) => onSearchTermChange(e.target.value)}
                className="pl-10 border-oma-cocoa/20 focus:border-oma-plum"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="status" className="text-sm font-medium text-oma-cocoa">
              Status
            </Label>
            <Select value={statusFilter} onValueChange={onStatusFilterChange}>
              <SelectTrigger id="status" className="border-oma-cocoa/20 focus:border-oma-plum">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="qualified">Qualified</SelectItem>
                <SelectItem value="converted">Converted</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="source" className="text-sm font-medium text-oma-cocoa">
              Source
            </Label>
            <Select value={sourceFilter} onValueChange={onSourceFilterChange}>
              <SelectTrigger id="source" className="border-oma-cocoa/20 focus:border-oma-plum">
                <SelectValue placeholder="All sources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="website">Website</SelectItem>
                <SelectItem value="custom_order">Custom Order</SelectItem>
                <SelectItem value="product_request">Product Request</SelectItem>
                <SelectItem value="referral">Referral</SelectItem>
                <SelectItem value="social_media">Social Media</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="priority" className="text-sm font-medium text-oma-cocoa">
              Priority
            </Label>
            <Select value={priorityFilter} onValueChange={onPriorityFilterChange}>
              <SelectTrigger id="priority" className="border-oma-cocoa/20 focus:border-oma-plum">
                <SelectValue placeholder="All priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="sort" className="text-sm font-medium text-oma-cocoa">
              Sort By
            </Label>
            <Select value={sortBy} onValueChange={onSortByChange}>
              <SelectTrigger id="sort" className="border-oma-cocoa/20 focus:border-oma-plum">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Date Created</SelectItem>
                <SelectItem value="customer_name">Customer Name</SelectItem>
                <SelectItem value="status">Status</SelectItem>
                <SelectItem value="priority">Priority</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-between items-center mt-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleSortOrder}
              className="border-oma-cocoa/20 text-oma-cocoa hover:bg-oma-cocoa/5"
            >
              {sortOrder === "asc" ? "↑ Ascending" : "↓ Descending"}
            </Button>
          </div>
          <p className="text-sm text-oma-cocoa">
            Showing {filteredCount} of {totalCount} leads
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

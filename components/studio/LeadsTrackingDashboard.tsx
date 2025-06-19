"use client";

import { useState, useEffect } from "react";
import {
  useLeads,
  useLeadsAnalytics,
  useLeadMutations,
  type Lead,
  type LeadsAnalytics,
} from "@/hooks/useLeads";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

const statusColors = {
  new: "bg-blue-100 text-blue-800",
  contacted: "bg-yellow-100 text-yellow-800",
  qualified: "bg-purple-100 text-purple-800",
  converted: "bg-green-100 text-green-800",
  lost: "bg-red-100 text-red-800",
  closed: "bg-gray-100 text-gray-800",
};

const priorityColors = {
  low: "bg-gray-100 text-gray-800",
  normal: "bg-blue-100 text-blue-800",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800",
};

export default function LeadsTrackingDashboard() {
  const [filters, setFilters] = useState<{
    brand_id: string;
    status: Lead["status"] | "";
    source: Lead["source"] | "";
    search: string;
    limit: number;
    offset: number;
  }>({
    brand_id: "",
    status: "",
    source: "",
    search: "",
    limit: 10,
    offset: 0,
  });

  const {
    leads,
    loading: leadsLoading,
    total,
    refetch: refetchLeads,
  } = useLeads(filters);
  const {
    analytics,
    loading: analyticsLoading,
    refetch: refetchAnalytics,
  } = useLeadsAnalytics();
  const { updateLead } = useLeadMutations();

  const handleStatusChange = async (
    leadId: string,
    newStatus: Lead["status"]
  ) => {
    try {
      await updateLead(leadId, { status: newStatus });
      toast.success("Lead status updated successfully");
      refetchLeads();
      refetchAnalytics();
    } catch (error) {
      toast.error("Failed to update lead status");
    }
  };

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  if (leadsLoading || analyticsLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-500">Total Leads</h3>
          <p className="text-2xl font-semibold">
            {analytics?.total_leads || 0}
          </p>
          <p className="text-sm text-gray-500">
            This month: {analytics?.this_month_leads || 0}
          </p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-500">Conversion Rate</h3>
          <p className="text-2xl font-semibold">
            {analytics?.conversion_rate || 0}%
          </p>
          <p className="text-sm text-gray-500">
            Converted: {analytics?.converted_leads || 0}
          </p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-500">Total Revenue</h3>
          <p className="text-2xl font-semibold">
            {formatCurrency(analytics?.total_booking_value || 0)}
          </p>
          <p className="text-sm text-gray-500">
            This month: {formatCurrency(analytics?.this_month_revenue || 0)}
          </p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-500">
            Commission Earned
          </h3>
          <p className="text-2xl font-semibold">
            {formatCurrency(analytics?.total_commission_earned || 0)}
          </p>
          <p className="text-sm text-gray-500">
            This month: {formatCurrency(analytics?.this_month_commission || 0)}
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Leads by Source Chart */}
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">Leads by Source</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={Object.entries(analytics?.leads_by_source || {}).map(
                    ([name, value]) => ({
                      name,
                      value,
                    })
                  )}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {Object.entries(analytics?.leads_by_source || {}).map(
                    (entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    )
                  )}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Monthly Trends Chart */}
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">Monthly Trends</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.monthly_trends || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="leads" fill="#8884d8" name="Leads" />
                <Bar dataKey="bookings" fill="#82ca9d" name="Bookings" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Leads Management</h2>
          <div className="mt-4 flex gap-4">
            <Select
              value={filters.status}
              onValueChange={(value) => handleFilterChange("status", value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="qualified">Qualified</SelectItem>
                <SelectItem value="converted">Converted</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.source}
              onValueChange={(value) => handleFilterChange("source", value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Sources</SelectItem>
                <SelectItem value="website">Website</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="phone">Phone</SelectItem>
                <SelectItem value="referral">Referral</SelectItem>
                <SelectItem value="direct">Direct</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder="Search by name or email"
              className="max-w-sm"
              onChange={(e) => handleFilterChange("search", e.target.value)}
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Brand</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{lead.customer_name}</div>
                    <div className="text-sm text-gray-500">
                      {lead.customer_email}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {lead.brand_image && (
                      <img
                        src={lead.brand_image}
                        alt={lead.brand_name}
                        className="w-6 h-6 rounded-full"
                      />
                    )}
                    <span>{lead.brand_name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{lead.source}</Badge>
                </TableCell>
                <TableCell>
                  <Select
                    value={lead.status}
                    onValueChange={(value: Lead["status"]) =>
                      handleStatusChange(lead.id!, value)
                    }
                  >
                    <SelectTrigger className="w-[130px]">
                      <SelectValue>
                        <Badge
                          className={
                            statusColors[
                              lead.status as keyof typeof statusColors
                            ]
                          }
                        >
                          {lead.status}
                        </Badge>
                      </SelectValue>
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
                </TableCell>
                <TableCell>
                  <Badge
                    className={
                      priorityColors[
                        lead.priority as keyof typeof priorityColors
                      ] || priorityColors.normal
                    }
                  >
                    {lead.priority || "normal"}
                  </Badge>
                </TableCell>
                <TableCell>{formatDate(lead.created_at!)}</TableCell>
                <TableCell>
                  {formatCurrency(lead.estimated_value || 0)}
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm">
                    View Details
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="p-4 border-t">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing {leads.length} of {total} leads
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    offset: Math.max(0, prev.offset - prev.limit),
                  }))
                }
                disabled={filters.offset === 0}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    offset: prev.offset + prev.limit,
                  }))
                }
                disabled={filters.offset + filters.limit >= total}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Mail, 
  Users, 
  TrendingUp, 
  Calendar,
  Download,
  Filter,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";

interface NewsletterSubscriber {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  subscription_status: 'active' | 'unsubscribed' | 'bounced' | 'pending';
  source: 'website' | 'contact_form' | 'studio_signup' | 'manual_import';
  subscribed_at: string;
  unsubscribed_at: string | null;
  last_email_sent: string | null;
  email_count: number;
  created_at: string;
  updated_at: string;
}

interface SubscriptionStats {
  total: number;
  active: number;
  unsubscribed: number;
  bounced: number;
  pending: number;
  thisMonth: number;
  lastMonth: number;
  growth: number;
}

export default function SubscriptionsPage() {
  const { user } = useAuth();
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [stats, setStats] = useState<SubscriptionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(20);

  // Check if user has access
  useEffect(() => {
    if (user && user.role !== 'super_admin') {
      toast.error("Access denied. Only super admins can view newsletter subscriptions.");
      // Redirect or show access denied message
      return;
    }
    
    if (user?.role === 'super_admin') {
      fetchSubscribers();
      fetchStats();
    }
  }, [user]);

  const fetchSubscribers = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        search: searchTerm,
        status: statusFilter !== "all" ? statusFilter : "",
        source: sourceFilter !== "all" ? sourceFilter : "",
      });

      const response = await fetch(`/api/studio/newsletter/subscribers?${params}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch subscribers");
      }

      const data = await response.json();
      setSubscribers(data.subscribers || []);
      setTotalPages(Math.ceil((data.total || 0) / itemsPerPage));
      
    } catch (error) {
      console.error("Error fetching subscribers:", error);
      toast.error("Failed to fetch subscribers");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/studio/newsletter/stats");
      
      if (!response.ok) {
        throw new Error("Failed to fetch stats");
      }

      const data = await response.json();
      setStats(data.stats);
      
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleStatusChange = async (subscriberId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/studio/newsletter/subscribers/${subscriberId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ subscription_status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      toast.success("Subscription status updated successfully");
      fetchSubscribers(); // Refresh the list
      fetchStats(); // Refresh stats
      
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update subscription status");
    }
  };

  const exportSubscribers = async () => {
    try {
      const response = await fetch("/api/studio/newsletter/export");
      
      if (!response.ok) {
        throw new Error("Failed to export subscribers");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `newsletter-subscribers-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success("Subscribers exported successfully");
      
    } catch (error) {
      console.error("Error exporting subscribers:", error);
      toast.error("Failed to export subscribers");
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: "bg-green-100 text-green-800", label: "Active" },
      unsubscribed: { color: "bg-red-100 text-red-800", label: "Unsubscribed" },
      bounced: { color: "bg-yellow-100 text-yellow-800", label: "Bounced" },
      pending: { color: "bg-blue-100 text-blue-800", label: "Pending" },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getSourceBadge = (source: string) => {
    const sourceConfig = {
      website: { color: "bg-blue-100 text-blue-800", label: "Website" },
      contact_form: { color: "bg-purple-100 text-purple-800", label: "Contact Form" },
      studio_signup: { color: "bg-indigo-100 text-indigo-800", label: "Studio Signup" },
      manual_import: { color: "bg-gray-100 text-gray-800", label: "Manual Import" },
    };
    
    const config = sourceConfig[source as keyof typeof sourceConfig] || sourceConfig.website;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  // Check access
  if (!user || user.role !== 'super_admin') {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">Only super admins can access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-oma-plum mb-2">Newsletter Subscriptions</h1>
          <p className="text-oma-cocoa">Manage and monitor newsletter subscribers</p>
        </div>
        
        <div className="flex gap-3 mt-4 lg:mt-0">
          <Button
            onClick={exportSubscribers}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button
            onClick={() => { fetchSubscribers(); fetchStats(); }}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Subscribers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                {stats.growth > 0 ? "+" : ""}{stats.growth}% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Subscribers</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
              <p className="text-xs text-muted-foreground">
                {((stats.active / stats.total) * 100).toFixed(1)}% of total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.thisMonth}</div>
              <p className="text-xs text-muted-foreground">
                New subscriptions this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unsubscribed</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.unsubscribed}</div>
              <p className="text-xs text-muted-foreground">
                {((stats.unsubscribed / stats.total) * 100).toFixed(1)}% of total
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by email, name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-input rounded-md text-sm"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="unsubscribed">Unsubscribed</option>
                <option value="bounced">Bounced</option>
                <option value="pending">Pending</option>
              </select>
              
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="px-3 py-2 border border-input rounded-md text-sm"
              >
                <option value="all">All Sources</option>
                <option value="website">Website</option>
                <option value="contact_form">Contact Form</option>
                <option value="studio_signup">Studio Signup</option>
                <option value="manual_import">Manual Import</option>
              </select>
              
              <Button
                onClick={() => { setCurrentPage(1); fetchSubscribers(); }}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Apply
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscribers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Subscribers</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-oma-plum mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Loading subscribers...</p>
            </div>
          ) : subscribers.length === 0 ? (
            <div className="text-center py-8">
              <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No subscribers found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Email</th>
                      <th className="text-left py-3 px-4 font-medium">Name</th>
                      <th className="text-left py-3 px-4 font-medium">Status</th>
                      <th className="text-left py-3 px-4 font-medium">Source</th>
                      <th className="text-left py-3 px-4 font-medium">Subscribed</th>
                      <th className="text-left py-3 px-4 font-medium">Emails Sent</th>
                      <th className="text-left py-3 px-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscribers.map((subscriber) => (
                      <tr key={subscriber.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="font-medium">{subscriber.email}</div>
                        </td>
                        <td className="py-3 px-4">
                          {subscriber.first_name || subscriber.last_name ? (
                            <div>
                              {subscriber.first_name} {subscriber.last_name}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {getStatusBadge(subscriber.subscription_status)}
                        </td>
                        <td className="py-3 px-4">
                          {getSourceBadge(subscriber.source)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm">
                            {new Date(subscriber.subscribed_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm">{subscriber.email_count}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            {subscriber.subscription_status === 'active' ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStatusChange(subscriber.id, 'unsubscribed')}
                                className="text-red-600 border-red-200 hover:bg-red-50"
                              >
                                Unsubscribe
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStatusChange(subscriber.id, 'active')}
                                className="text-green-600 border-green-200 hover:bg-green-50"
                              >
                                Reactivate
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

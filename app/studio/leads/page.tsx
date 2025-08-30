"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase-unified";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Users,
  TrendingUp,
  Calendar,
  Mail,
  Phone,
  Building,
  MapPin,
  RefreshCw,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";

interface Lead {
  id: string;
  brand_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  company_name?: string;
  lead_source: string;
  lead_status: string;
  lead_score: number;
  priority: string;
  estimated_budget?: number;
  project_type?: string;
  project_timeline?: string;
  location?: string;
  notes?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
  brand?: {
    name: string;
    category?: string;
  };
}

interface LeadsAnalytics {
  total_leads: number;
  qualified_leads: number;
  converted_leads: number;
  total_bookings: number;
  this_month_leads: number;
  this_month_bookings: number;
  conversion_rate: number;
  leads_by_source: Record<string, number>;
  leads_by_status: Record<string, number>;
}

export default function StudioLeadsPage() {
  const { user, loading: authLoading } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [analytics, setAnalytics] = useState<LeadsAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  // Check if user has access
  useEffect(() => {
    if (!authLoading && user) {
      if (user.role === 'super_admin' || user.role === 'brand_admin') {
        loadLeads();
        loadAnalytics();
      } else {
        toast.error("Access denied. Only admins can view leads.");
      }
    }
  }, [user, authLoading]);

  const loadLeads = async () => {
    try {
      setLoading(true);
      const supabase = createClient();

      let query = supabase
        .from('leads')
        .select(`
          *,
          brand:brands(name, category)
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (searchTerm) {
        query = query.or(`customer_name.ilike.%${searchTerm}%,customer_email.ilike.%${searchTerm}%,company_name.ilike.%${searchTerm}%`);
      }
      if (statusFilter !== 'all') {
        query = query.eq('lead_status', statusFilter);
      }
      if (sourceFilter !== 'all') {
        query = query.eq('lead_source', sourceFilter);
      }
      if (priorityFilter !== 'all') {
        query = query.eq('priority', priorityFilter);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching leads:', error);
        toast.error('Failed to fetch leads');
        return;
      }

      setLeads(data || []);
    } catch (error) {
      console.error('Error loading leads:', error);
      toast.error('Failed to load leads');
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const supabase = createClient();
      
      // Get current month dates
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      // Fetch all leads for analytics
      const { data: allLeads, error: leadsError } = await supabase
        .from('leads')
        .select('*');

      if (leadsError) {
        console.error('Error fetching leads for analytics:', leadsError);
        return;
      }

      // Calculate analytics
      const totalLeads = allLeads?.length || 0;
      const qualifiedLeads = allLeads?.filter(lead => lead.lead_status === 'qualified').length || 0;
      const convertedLeads = allLeads?.filter(lead => lead.lead_status === 'converted').length || 0;
      
      // This month leads
      const thisMonthLeads = allLeads?.filter(lead => {
        const leadDate = new Date(lead.created_at);
        return leadDate >= startOfMonth && leadDate <= endOfMonth;
      }).length || 0;

      // Calculate conversion rate
      const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

      // Group by source
      const leadsBySource: Record<string, number> = {};
      allLeads?.forEach(lead => {
        leadsBySource[lead.lead_source] = (leadsBySource[lead.lead_source] || 0) + 1;
      });

      // Group by status
      const leadsByStatus: Record<string, number> = {};
      allLeads?.forEach(lead => {
        leadsByStatus[lead.lead_status] = (leadsByStatus[lead.lead_status] || 0) + 1;
      });

      // For now, set bookings to 0 (can be expanded later)
      const totalBookings = 0;
      const thisMonthBookings = 0;

      setAnalytics({
        total_leads: totalLeads,
        qualified_leads: qualifiedLeads,
        converted_leads: convertedLeads,
        total_bookings: totalBookings,
        this_month_leads: thisMonthLeads,
        this_month_bookings: thisMonthBookings,
        conversion_rate: conversionRate,
        leads_by_source: leadsBySource,
        leads_by_status: leadsByStatus,
      });

    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await Promise.all([loadLeads(), loadAnalytics()]);
    setRefreshing(false);
    toast.success('Data refreshed successfully');
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      new: { color: "bg-blue-100 text-blue-800", label: "New" },
      contacted: { color: "bg-yellow-100 text-yellow-800", label: "Contacted" },
      qualified: { color: "bg-green-100 text-green-800", label: "Qualified" },
      converted: { color: "bg-purple-100 text-purple-800", label: "Converted" },
      lost: { color: "bg-red-100 text-red-800", label: "Lost" },
      closed: { color: "bg-gray-100 text-gray-800", label: "Closed" },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.new;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getSourceBadge = (source: string) => {
    const sourceConfig = {
      contact_form: { color: "bg-purple-100 text-purple-800", label: "Contact Form" },
      brand_request_form: { color: "bg-indigo-100 text-indigo-800", label: "Brand Request" },
      website: { color: "bg-blue-100 text-blue-800", label: "Website" },
      whatsapp: { color: "bg-green-100 text-green-800", label: "WhatsApp" },
      instagram: { color: "bg-pink-100 text-pink-800", label: "Instagram" },
      email: { color: "bg-orange-100 text-orange-800", label: "Email" },
      phone: { color: "bg-teal-100 text-teal-800", label: "Phone" },
      referral: { color: "bg-amber-100 text-amber-800", label: "Referral" },
    };
    
    const config = sourceConfig[source as keyof typeof sourceConfig] || sourceConfig.contact_form;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      low: { color: "bg-gray-100 text-gray-800", label: "Low" },
      normal: { color: "bg-blue-100 text-blue-800", label: "Normal" },
      high: { color: "bg-orange-100 text-orange-800", label: "High" },
      urgent: { color: "bg-red-100 text-red-800", label: "Urgent" },
    };
    
    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.normal;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  if (authLoading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-oma-plum mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || (user.role !== 'super_admin' && user.role !== 'brand_admin')) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">Only admins can access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-oma-plum mb-2">Leads & Bookings Analytics</h1>
          <p className="text-oma-cocoa">Track and manage your leads and conversions</p>
        </div>
        
        <div className="flex gap-3 mt-4 lg:mt-0">
          <Button
            onClick={refreshData}
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-black">Total Leads</CardTitle>
              <Users className="h-4 w-4 text-black" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">{analytics.total_leads}</div>
              <p className="text-xs text-black">
                This month: {analytics.this_month_leads}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-black">Qualified Leads</CardTitle>
              <TrendingUp className="h-4 w-4 text-black" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">{analytics.qualified_leads}</div>
              <p className="text-xs text-black">
                Ready for follow-up
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-black">Conversion Rate</CardTitle>
              <Calendar className="h-4 w-4 text-black" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">{analytics.conversion_rate}%</div>
              <p className="text-xs text-black">
                Converted: {analytics.converted_leads}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-black">Total Bookings</CardTitle>
              <Mail className="h-4 w-4 text-black" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">{analytics.total_bookings}</div>
              <p className="text-xs text-black">
                This month: {analytics.this_month_bookings}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Data Status */}
      {leads.length === 0 && !loading ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-5 w-5 bg-yellow-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">!</span>
            </div>
            <h4 className="font-medium text-yellow-800">No Data Available</h4>
          </div>
          <p className="text-yellow-700">
            The dashboard is showing zeros because there are no leads in the system yet. 
            This is normal for a new installation. Data will appear here once leads are created 
            through contact forms, brand requests, or other lead generation methods.
          </p>
        </div>
      ) : null}

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-black" />
                <Input
                  placeholder="Search by name, email, company..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 text-black placeholder:text-black/60"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32 text-black bg-white">
                  <SelectValue placeholder="Status" />
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
              
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="w-32 text-black bg-white">
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="contact_form">Contact Form</SelectItem>
                  <SelectItem value="brand_request_form">Brand Request</SelectItem>
                  <SelectItem value="website">Website</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="phone">Phone</SelectItem>
                  <SelectItem value="referral">Referral</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-32 text-black bg-white">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                onClick={() => { loadLeads(); loadAnalytics(); }}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Apply
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-black">Recent Leads</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-oma-plum mx-auto"></div>
              <p className="mt-2 text-black">Loading leads...</p>
            </div>
          ) : leads.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-black mx-auto mb-4" />
              <p className="text-black">No leads found</p>
            </div>
          ) : (
            <>
              <div className="text-sm text-gray-600 mb-4">
                Showing {leads.length} of {leads.length} leads
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-black">Customer</th>
                      <th className="text-left py-3 px-4 font-medium text-black">Brand</th>
                      <th className="text-left py-3 px-4 font-medium text-black">Source</th>
                      <th className="text-left py-3 px-4 font-medium text-black">Type</th>
                      <th className="text-left py-3 px-4 font-medium text-black">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-black">Priority</th>
                      <th className="text-left py-3 px-4 font-medium text-black">Date</th>
                      <th className="text-left py-3 px-4 font-medium text-black">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((lead) => (
                      <tr key={lead.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="font-medium text-black">{lead.customer_name}</div>
                          <div className="text-sm text-gray-600">{lead.customer_email}</div>
                          {lead.customer_phone && (
                            <div className="text-sm text-gray-500 flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {lead.customer_phone}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-black">
                            {lead.brand?.name || 'Unknown Brand'}
                          </div>
                          {lead.company_name && (
                            <div className="text-sm text-gray-600 flex items-center gap-1">
                              <Building className="h-3 w-3" />
                              {lead.company_name}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {getSourceBadge(lead.lead_source)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm text-black">
                            {lead.project_type || 'General Inquiry'}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {getStatusBadge(lead.lead_status)}
                        </td>
                        <td className="py-3 px-4">
                          {getPriorityBadge(lead.priority)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm text-black">
                            {new Date(lead.created_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 p-0"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

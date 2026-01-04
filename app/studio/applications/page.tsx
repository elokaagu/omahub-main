"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Mail, MapPin, Globe, Instagram, Phone, Building, RefreshCw, Search, X, ExternalLink, CheckCircle } from "lucide-react";

interface DesignerApplication {
  id: string;
  brand_name: string;
  designer_name: string;
  email: string;
  phone?: string;
  website?: string;
  instagram?: string;
  location: string;
  category: string;
  description: string;
  year_founded?: number;
  status: "new" | "reviewing" | "approved" | "rejected";
  notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
  brand_id?: string | null;
  brand_verified?: boolean;
}

export default function ApplicationsPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<DesignerApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<DesignerApplication | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [deletingApplication, setDeletingApplication] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Ensure we only render portals on the client
  useEffect(() => {
    setMounted(true);
  }, []);

  // Check user access and fetch applications
  useEffect(() => {
    if (user) {
      if (user.role !== 'super_admin') {
        setAccessDenied(true);
        setLoading(false);
        return;
      }
      fetchApplications();
    } else if (user === null) {
      // User is not logged in
      setLoading(false);
    }
  }, [user]);

  // Handle Escape key to close modals
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedApplication) {
          setSelectedApplication(null);
        }
        if (showDeleteConfirm) {
          setShowDeleteConfirm(null);
        }
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [selectedApplication, showDeleteConfirm]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (selectedApplication || showDeleteConfirm) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedApplication, showDeleteConfirm]);

  // Fetch applications - CRITICAL: This must fetch ALL applications without filtering
  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("🔄 [Applications] Fetching all applications from API...");
      
      // Force fresh fetch with cache busting
      const timestamp = Date.now();
      const response = await fetch(`/api/studio/applications?t=${timestamp}`, {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("❌ [Applications] API Error:", {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
        });
        throw new Error(errorData.error || `Failed to fetch applications (${response.status})`);
      }
      
      const data = await response.json();
      
      console.log("✅ [Applications] API Response:", {
        count: data.applications?.length || 0,
        rawCount: data.rawCount || 0,
        timestamp: data.timestamp,
      });
      
      // Log each application for debugging
      if (data.applications && data.applications.length > 0) {
        console.log("📋 [Applications] All applications received:", 
          data.applications.map((app: DesignerApplication) => ({
            id: app.id,
            brand_name: app.brand_name,
            designer_name: app.designer_name,
            email: app.email,
            status: app.status,
            created_at: app.created_at,
          }))
        );
      } else {
        console.warn("⚠️ [Applications] No applications in API response");
      }
      
      // IMPORTANT: Set applications directly from API - no filtering at this stage
      const apps = data.applications || [];
      setApplications(apps);
      
      console.log(`✅ [Applications] Set ${apps.length} applications in state`);
      
      if (apps.length === 0) {
        console.warn("⚠️ [Applications] No applications found. This could mean:");
        console.warn("   1. No applications exist in the database");
        console.warn("   2. Applications are in a different table (check inquiries vs designer_applications)");
        console.warn("   3. There's an RLS policy blocking access");
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch applications";
      console.error("❌ [Applications] Fetch error:", err);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Update application status
  const updateApplicationStatus = async (applicationId: string, status: string, notes?: string) => {
    try {
      setUpdatingStatus(true);
      
      // Optimistic update
      setApplications(prev => prev.map(app => 
        app.id === applicationId 
          ? { ...app, status: status as any, notes: notes || app.notes, updated_at: new Date().toISOString() }
          : app
      ));
      
      if (selectedApplication?.id === applicationId) {
        setSelectedApplication(prev => prev ? {
          ...prev,
          status: status as any,
          notes: notes || prev.notes,
          updated_at: new Date().toISOString()
        } : null);
      }
      
      const response = await fetch(`/api/studio/applications/${applicationId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status, notes }),
      });

      if (!response.ok) {
        await fetchApplications(); // Revert on error
        const errorText = await response.text();
        throw new Error(`Failed to update: ${errorText}`);
      }

      const result = await response.json();
      
      if (result.application) {
        setApplications(prev => prev.map(app => 
          app.id === applicationId ? { ...app, ...result.application } : app
        ));
        
        if (selectedApplication?.id === applicationId) {
          setSelectedApplication({
            ...selectedApplication,
            ...result.application
          });
        }
      }

      toast.success(`Application ${status === 'approved' ? 'approved' : status === 'rejected' ? 'rejected' : 'updated'} successfully`);
      
      if (status === 'approved' || status === 'rejected') {
        setSelectedApplication(null);
      }
    } catch (err) {
      console.error("❌ Update error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to update application");
      await fetchApplications();
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Delete application
  const deleteApplication = async (applicationId: string) => {
    try {
      setDeletingApplication(applicationId);
      
      const applicationToDelete = applications.find(app => app.id === applicationId);
      
      console.log(`🗑️ [Applications] Attempting to delete application:`, {
        id: applicationId,
        brand_name: applicationToDelete?.brand_name,
        url: `/api/studio/applications/${applicationId}`
      });
      
      // Optimistic update - remove from UI immediately
      setApplications(prev => prev.filter(app => app.id !== applicationId));
      setSelectedApplication(null);
      setShowDeleteConfirm(null);
      
      const response = await fetch(`/api/studio/applications/${applicationId}`, {
        method: "DELETE",
      });

      console.log(`🗑️ [Applications] Delete response:`, {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        const errorData = await response.json().catch(async () => {
          // Try to get error text if JSON parsing fails
          return { error: await response.text() };
        });
        
        console.error(`❌ [Applications] Delete failed:`, {
          status: response.status,
          error: errorData,
          applicationId
        });
        
        // If 404 (not found), don't revert - it might have been deleted by someone else
        // or the ID might be wrong, but we've already removed it from UI
        if (response.status === 404) {
          console.warn(`⚠️ [Applications] Application not found (404) - keeping it removed from UI`);
          toast.error("Application not found - it may have already been deleted");
          // Don't revert optimistic update for 404 - keep it removed
          // Refresh to sync with server state
          await fetchApplications();
          return;
        }
        
        // For other errors, revert the optimistic update
        if (applicationToDelete) {
          console.log(`🔄 [Applications] Reverting optimistic delete for application:`, applicationToDelete.brand_name);
          setApplications(prev => {
            if (!prev.find(app => app.id === applicationId)) {
              return [...prev, applicationToDelete].sort((a, b) => 
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
              );
            }
            return prev;
          });
        }
        
        throw new Error(errorData.error || `Failed to delete: ${response.statusText}`);
      }

      const result = await response.json();
      console.log(`✅ [Applications] Delete successful:`, result);
      
      toast.success("Application deleted successfully");
      
      // Refresh to ensure UI is in sync with server
      await fetchApplications();
    } catch (err) {
      console.error("❌ [Applications] Delete error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to delete application");
      // Refresh to sync with server state
      await fetchApplications();
    } finally {
      setDeletingApplication(null);
    }
  };

  // Filter applications - ONLY for display, not for fetching
  const filteredApplications = applications.filter(app => {
    // Search filter
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      !searchTerm ||
      app.brand_name.toLowerCase().includes(searchLower) ||
      app.designer_name.toLowerCase().includes(searchLower) ||
      app.email.toLowerCase().includes(searchLower) ||
      app.location.toLowerCase().includes(searchLower) ||
      app.category.toLowerCase().includes(searchLower) ||
      app.description.toLowerCase().includes(searchLower);
    
    // Status filter
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Status badge component
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "new":
        return <Badge variant="secondary" className="bg-gray-200 text-gray-800">New</Badge>;
      case "reviewing":
        return <Badge variant="default" className="bg-blue-500 text-white">Reviewing</Badge>;
      case "approved":
        return <Badge variant="default" className="bg-green-500 text-white hover:bg-green-600">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive" className="bg-red-500 text-white hover:bg-red-600">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-oma-plum mx-auto"></div>
          <p className="mt-4 text-oma-cocoa">Loading applications...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={fetchApplications}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Access denied state
  if (accessDenied) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="text-center">
          <p className="text-red-500 mb-4">You do not have permission to access this page.</p>
          <Button onClick={() => window.history.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-canela text-oma-plum mb-2">Designer Applications</h1>
          <p className="text-oma-cocoa">
            Review and manage designer applications for the platform
            {applications.length > 0 && (
              <span className="ml-2 text-sm">
                ({applications.length} total{filteredApplications.length !== applications.length && `, ${filteredApplications.length} shown`})
              </span>
            )}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={fetchApplications}
          disabled={loading}
          className="shrink-0"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          {loading ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search applications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-10 max-w-md"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
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

      {/* Applications List */}
      <div className="grid gap-6">
        {filteredApplications.length === 0 ? (
          <div className="text-center py-12">
            {applications.length === 0 ? (
              <>
                <p className="text-oma-cocoa mb-2">No applications found in the database.</p>
                <p className="text-sm text-gray-500">
                  Applications submitted through the join form will appear here.
                </p>
              </>
            ) : (
              <>
                <p className="text-oma-cocoa mb-2">No applications match your filters.</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("all");
                  }}
                >
                  Clear Filters
                </Button>
              </>
            )}
          </div>
        ) : (
          filteredApplications.map((application) => (
            <Card 
              key={application.id} 
              className="hover:shadow-md transition-shadow"
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-xl text-oma-plum">
                      {application.brand_name}
                    </CardTitle>
                    <p className="text-oma-cocoa mt-1">by {application.designer_name}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {getStatusBadge(application.status)}
                    <span className="text-sm text-oma-cocoa whitespace-nowrap">
                      {application.created_at 
                        ? new Date(application.created_at).toLocaleDateString("en-GB")
                        : 'N/A'
                      }
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
                      <span>@{application.instagram.replace(/^@/, '')}</span>
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
                  <Badge variant="outline" className="mb-2">{application.category}</Badge>
                  <p className="text-sm text-oma-cocoa line-clamp-3">{application.description}</p>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedApplication(application)}
                  >
                    View Details
                  </Button>
                  
                  {application.status === "new" && (
                    <>
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => updateApplicationStatus(application.id, "approved")}
                        disabled={updatingStatus}
                      >
                        {updatingStatus ? "Updating..." : "Approve"}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => updateApplicationStatus(application.id, "rejected")}
                        disabled={updatingStatus}
                      >
                        {updatingStatus ? "Updating..." : "Reject"}
                      </Button>
                    </>
                  )}
                  
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(application.id)}
                    disabled={deletingApplication === application.id}
                  >
                    {deletingApplication === application.id ? "Deleting..." : "Delete"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Detail Modal */}
      {mounted && selectedApplication && typeof document !== 'undefined' && document.body && createPortal(
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedApplication(null);
            }
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div 
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 id="modal-title" className="text-2xl font-canela text-oma-plum mb-2">
                    {selectedApplication.brand_name}
                  </h2>
                  <p className="text-lg text-oma-cocoa">by {selectedApplication.designer_name}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedApplication(null)}
                  aria-label="Close modal"
                  className="hover:bg-gray-100 rounded-full p-2"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-oma-cocoa mb-1">Email</label>
                    <p className="text-sm">{selectedApplication.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-oma-cocoa mb-1">Location</label>
                    <p className="text-sm">{selectedApplication.location}</p>
                  </div>
                  {selectedApplication.phone && (
                    <div>
                      <label className="block text-sm font-medium text-oma-cocoa mb-1">Phone</label>
                      <p className="text-sm">{selectedApplication.phone}</p>
                    </div>
                  )}
                  {selectedApplication.website && (
                    <div>
                      <label className="block text-sm font-medium text-oma-cocoa mb-1">Website</label>
                      <a 
                        href={selectedApplication.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-oma-plum hover:underline text-sm"
                      >
                        {selectedApplication.website}
                      </a>
                    </div>
                  )}
                  {selectedApplication.instagram && (
                    <div>
                      <label className="block text-sm font-medium text-oma-cocoa mb-1">Instagram</label>
                      <p className="text-sm">@{selectedApplication.instagram.replace(/^@/, '')}</p>
                    </div>
                  )}
                  {selectedApplication.year_founded && (
                    <div>
                      <label className="block text-sm font-medium text-oma-cocoa mb-1">Year Founded</label>
                      <p className="text-sm">{selectedApplication.year_founded}</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-oma-cocoa mb-1">Category</label>
                  <Badge variant="outline">{selectedApplication.category}</Badge>
                </div>

                <div>
                  <label className="block text-sm font-medium text-oma-cocoa mb-1">Description</label>
                  <p className="text-sm whitespace-pre-wrap">{selectedApplication.description}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-oma-cocoa mb-1">Status</label>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(selectedApplication.status)}
                    <span className="text-sm text-oma-cocoa">
                      {selectedApplication.reviewed_at 
                        ? `Reviewed on ${new Date(selectedApplication.reviewed_at).toLocaleDateString("en-GB")}`
                        : `Submitted on ${new Date(selectedApplication.created_at).toLocaleDateString("en-GB")}`
                      }
                    </span>
                  </div>
                </div>

                {selectedApplication.brand_id && (
                  <div className="bg-oma-beige/50 border border-oma-gold/30 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-oma-gold" />
                        <div>
                          <label className="block text-sm font-medium text-oma-plum mb-1">Brand Created</label>
                          <p className="text-xs text-oma-cocoa">
                            {selectedApplication.brand_verified ? "Verified" : "Unverified"} • Brand is ready for approval
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/studio/brands/${selectedApplication.brand_id}`, '_blank')}
                        className="flex items-center gap-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        View Brand
                      </Button>
                    </div>
                  </div>
                )}

                {selectedApplication.notes && (
                  <div>
                    <label className="block text-sm font-medium text-oma-cocoa mb-1">Notes</label>
                    <p className="text-sm bg-oma-beige/30 p-3 rounded whitespace-pre-wrap">{selectedApplication.notes}</p>
                  </div>
                )}
              </div>

              {/* Status Update Section */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-medium text-oma-plum mb-3">Update Status</h3>
                <div className="space-y-3">
                  <Select 
                    value={selectedApplication.status} 
                    onValueChange={(value) => {
                      setSelectedApplication({
                        ...selectedApplication,
                        status: value as any
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="reviewing">Reviewing</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>

                  <Textarea
                    placeholder="Add notes about this application..."
                    value={selectedApplication.notes || ""}
                    onChange={(e) => {
                      setSelectedApplication({
                        ...selectedApplication,
                        notes: e.target.value
                      });
                    }}
                    rows={3}
                  />

                  <div className="flex gap-2 flex-wrap">
                    <Button
                      onClick={() => updateApplicationStatus(
                        selectedApplication.id, 
                        selectedApplication.status,
                        selectedApplication.notes
                      )}
                      disabled={updatingStatus}
                    >
                      {updatingStatus ? "Updating..." : "Update Status"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedApplication(null)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => setShowDeleteConfirm(selectedApplication.id)}
                      disabled={deletingApplication === selectedApplication.id}
                    >
                      {deletingApplication === selectedApplication.id ? "Deleting..." : "Delete"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Confirmation Modal */}
      {mounted && showDeleteConfirm && typeof document !== 'undefined' && document.body && createPortal(
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowDeleteConfirm(null);
            }
          }}
          role="dialog"
          aria-modal="true"
        >
          <div 
            className="bg-white rounded-lg max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <h3 className="text-lg font-medium text-oma-cocoa mb-4">Delete Application</h3>
              <p className="text-sm text-oma-cocoa mb-6">
                Are you sure you want to delete this application? This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(null)}
                  disabled={deletingApplication === showDeleteConfirm}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    deleteApplication(showDeleteConfirm);
                  }}
                  disabled={deletingApplication === showDeleteConfirm}
                >
                  {deletingApplication === showDeleteConfirm ? "Deleting..." : "Delete Permanently"}
                </Button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

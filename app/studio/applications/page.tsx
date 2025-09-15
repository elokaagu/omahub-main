"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Calendar, Mail, MapPin, Globe, Instagram, Phone, Building } from "lucide-react";

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

  // Check if user has super admin access
  useEffect(() => {
    if (user) {
      // Only super admins can access designer applications
      if (user.role !== 'super_admin') {
        setAccessDenied(true);
        setLoading(false);
        return;
      }
      fetchApplications();
    }
  }, [user]);

  // Fetch applications
  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/studio/applications");
      
      if (!response.ok) {
        throw new Error("Failed to fetch applications");
      }
      
      const data = await response.json();
      setApplications(data.applications || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch applications");
      toast.error("Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  // Update application status
  const updateApplicationStatus = async (applicationId: string, status: string, notes?: string) => {
    try {
      console.log(`🔄 Updating application ${applicationId} to status: ${status}`);
      setUpdatingStatus(true);
      
      const response = await fetch(`/api/studio/applications/${applicationId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status, notes }),
      });

      console.log(`📊 Update response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Update failed:`, errorText);
        throw new Error(`Failed to update application: ${errorText}`);
      }

      const result = await response.json();
      console.log(`✅ Update successful:`, result);

      toast.success("Application status updated successfully");
      
      // Refresh applications
      await fetchApplications();
      
      // Close detail view
      setSelectedApplication(null);
    } catch (err) {
      console.error("❌ Update error:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to update application status";
      toast.error(errorMessage);
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Delete application
  const deleteApplication = async (applicationId: string) => {
    try {
      setDeletingApplication(applicationId);
      console.log(`🗑️ Attempting to delete application: ${applicationId}`);
      
      const response = await fetch(`/api/studio/applications/${applicationId}`, {
        method: "DELETE",
      });

      console.log(`🗑️ Delete response status: ${response.status}`);
      console.log(`🗑️ Delete response URL: ${response.url}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`🗑️ Delete failed with status ${response.status}:`, errorText);
        
        if (response.status === 404) {
          throw new Error("API route not found. Please check if the route is deployed correctly.");
        } else if (response.status === 500) {
          throw new Error("Server error occurred while deleting the application.");
        } else {
          throw new Error(`Failed to delete application (${response.status}): ${errorText}`);
        }
      }

      const result = await response.json();
      console.log(`🗑️ Delete successful:`, result);

      toast.success("Application deleted successfully");
      
      // Refresh applications
      await fetchApplications();
      
      // Close detail view if it was the deleted application
      if (selectedApplication?.id === applicationId) {
        setSelectedApplication(null);
      }
      
      // Hide delete confirmation
      setShowDeleteConfirm(null);
    } catch (err) {
      console.error("🗑️ Delete error:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to delete application";
      toast.error(errorMessage);
    } finally {
      setDeletingApplication(null);
    }
  };

  // Filter applications based on search and status
  const filteredApplications = applications.filter(app => {
    const matchesSearch = 
      app.brand_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.designer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "new":
        return <Badge variant="secondary">New</Badge>;
      case "reviewing":
        return <Badge variant="default">Reviewing</Badge>;
      case "approved":
        return <Badge variant="default" className="bg-green-500">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

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

  if (error) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={fetchApplications}>Try Again</Button>
        </div>
      </div>
    );
  }

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
      <div className="mb-8">
        <h1 className="text-3xl font-canela text-oma-plum mb-2">Designer Applications</h1>
        <p className="text-oma-cocoa">Review and manage designer applications for the platform</p>
      </div>

      {/* Filters and Search */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search applications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
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

      {/* Applications Grid */}
      <div className="grid gap-6">
        {filteredApplications.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-oma-cocoa">No applications found</p>
          </div>
        ) : (
          filteredApplications.map((application) => (
            <Card key={application.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl text-oma-plum">
                      {application.brand_name}
                    </CardTitle>
                    <p className="text-oma-cocoa mt-1">by {application.designer_name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(application.status)}
                    <span className="text-sm text-oma-cocoa">
                      {new Date(application.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-oma-gold" />
                    <span>{application.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-oma-gold" />
                    <span>{application.location}</span>
                  </div>
                  {application.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-oma-gold" />
                      <span>{application.phone}</span>
                    </div>
                  )}
                  {application.website && (
                    <div className="flex items-center gap-2 text-sm">
                      <Globe className="h-4 w-4 text-oma-gold" />
                      <a 
                        href={application.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-oma-plum hover:underline"
                      >
                        {application.website}
                      </a>
                    </div>
                  )}
                  {application.instagram && (
                    <div className="flex items-center gap-2 text-sm">
                      <Instagram className="h-4 w-4 text-oma-gold" />
                      <span>@{application.instagram}</span>
                    </div>
                  )}
                  {application.year_founded && (
                    <div className="flex items-center gap-2 text-sm">
                      <Building className="h-4 w-4 text-oma-gold" />
                      <span>Founded {application.year_founded}</span>
                    </div>
                  )}
                </div>
                
                <div className="mb-4">
                  <Badge variant="outline" className="mb-2">{application.category}</Badge>
                  <p className="text-sm text-oma-cocoa line-clamp-3">{application.description}</p>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedApplication(application)}
                  >
                    View Details
                  </Button>
                  {application.status === "new" && (
                    <Button
                      size="sm"
                      onClick={() => {
                        console.log(`🔄 Starting review for application: ${application.id}`);
                        updateApplicationStatus(application.id, "reviewing");
                      }}
                      disabled={updatingStatus}
                    >
                      {updatingStatus ? "Updating..." : "Start Review"}
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      console.log(`🗑️ Delete button clicked for application: ${application.id}`);
                      setShowDeleteConfirm(application.id);
                    }}
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

      {/* Application Detail Modal */}
      {selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-canela text-oma-plum mb-2">
                    {selectedApplication.brand_name}
                  </h2>
                  <p className="text-lg text-oma-cocoa">by {selectedApplication.designer_name}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedApplication(null)}
                >
                  ✕
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
                      <p className="text-sm">@{selectedApplication.instagram}</p>
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
                  <p className="text-sm">{selectedApplication.description}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-oma-cocoa mb-1">Current Status</label>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(selectedApplication.status)}
                    <span className="text-sm text-oma-cocoa">
                      {selectedApplication.reviewed_at 
                        ? `Reviewed on ${new Date(selectedApplication.reviewed_at).toLocaleDateString()}`
                        : `Submitted on ${new Date(selectedApplication.created_at).toLocaleDateString()}`
                      }
                    </span>
                  </div>
                </div>

                {selectedApplication.notes && (
                  <div>
                    <label className="block text-sm font-medium text-oma-cocoa mb-1">Notes</label>
                    <p className="text-sm bg-oma-beige/30 p-3 rounded">{selectedApplication.notes}</p>
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

                  <div className="flex gap-2">
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
                      {deletingApplication === selectedApplication.id ? "Deleting..." : "Delete Application"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="text-center">
              <h3 className="text-lg font-medium text-oma-cocoa mb-4">Delete Application</h3>
              <p className="text-sm text-oma-cocoa mb-6">
                Are you sure you want to delete this application? This action cannot be undone and will permanently remove the application from the database.
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
                    console.log(`🗑️ Confirming delete for application: ${showDeleteConfirm}`);
                    deleteApplication(showDeleteConfirm);
                  }}
                  disabled={deletingApplication === showDeleteConfirm}
                >
                  {deletingApplication === showDeleteConfirm ? "Deleting..." : "Delete Permanently"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

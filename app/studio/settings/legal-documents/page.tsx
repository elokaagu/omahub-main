"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import OmaHubEditor from "@/app/components/OmaHubEditor";
import { toast } from "sonner";
import {
  FileText,
  Plus,
  Save,
  Eye,
  Calendar,
  Hash,
  CheckCircle,
  XCircle,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

interface LegalDocument {
  id: string;
  document_type: "terms_of_service" | "privacy_policy";
  title: string;
  content: string;
  effective_date: string;
  version: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function LegalDocumentsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedDocument, setSelectedDocument] =
    useState<LegalDocument | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [setupRequired, setSetupRequired] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    document_type: "terms_of_service" as "terms_of_service" | "privacy_policy",
    title: "",
    content: "",
    effective_date: "",
  });

  useEffect(() => {
    if (!authLoading && user && user.role !== "super_admin") {
      router.push("/studio");
      return;
    }
    if (!authLoading && user?.role === "super_admin") {
      fetchDocuments();
    }
  }, [authLoading, user, router]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/legal-documents?active=false");
      const data = await response.json();

      if (response.ok) {
        setDocuments(data.documents);
        if (data.notice) {
          setSetupRequired(true);
          toast.info("Using default documents. Database setup required.");
        }
      } else {
        toast.error(data.error || "Failed to fetch documents");
        if (response.status === 500) {
          setSetupRequired(true);
        }
      }
    } catch (error) {
      console.error("Error fetching documents:", error);
      toast.error("Failed to fetch documents");
      setSetupRequired(true);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (document: LegalDocument) => {
    setSelectedDocument(document);
    setFormData({
      document_type: document.document_type,
      title: document.title,
      content: document.content,
      effective_date: document.effective_date,
    });
    setIsEditing(true);
    setIsCreating(false);
  };

  const handleCreate = () => {
    setSelectedDocument(null);
    setFormData({
      document_type: "terms_of_service",
      title: "",
      content: "",
      effective_date: new Date().toISOString().split("T")[0],
    });
    setIsCreating(true);
    setIsEditing(false);
  };

  const handleCreateForType = (
    type: "terms_of_service" | "privacy_policy"
  ) => {
    setSelectedDocument(null);
    setFormData({
      document_type: type,
      title: "",
      content: "",
      effective_date: new Date().toISOString().split("T")[0],
    });
    setIsCreating(true);
    setIsEditing(false);
  };

  const handleCreateFromVersion = (document: LegalDocument) => {
    setSelectedDocument(null);
    setFormData({
      document_type: document.document_type,
      title: document.title,
      content: document.content,
      effective_date: new Date().toISOString().split("T")[0],
    });
    setIsCreating(true);
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setSaving(true);
      const method = isCreating ? "POST" : "PUT";
      const body = isCreating
        ? formData
        : { ...formData, id: selectedDocument?.id };

      const response = await fetch("/api/legal-documents", {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);
        await fetchDocuments();
        setIsEditing(false);
        setIsCreating(false);
        setSelectedDocument(null);
      } else {
        toast.error(data.error || "Failed to save document");
      }
    } catch (error) {
      console.error("Error saving document:", error);
      toast.error("Failed to save document");
    } finally {
      setSaving(false);
    }
  };

  const handleActivateVersion = async (document: LegalDocument) => {
    if (document.is_active) return;

    try {
      setSaving(true);

      // Best effort: deactivate currently active version for same type first.
      const currentActive = documents.find(
        (d) => d.document_type === document.document_type && d.is_active
      );
      if (currentActive) {
        await fetch("/api/legal-documents", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: currentActive.id, is_active: false }),
        });
      }

      const response = await fetch("/api/legal-documents", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: document.id, is_active: true }),
      });

      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || "Failed to activate version");
        return;
      }

      setDocuments((prev) =>
        prev.map((doc) => {
          if (doc.document_type !== document.document_type) return doc;
          if (doc.id === document.id) return { ...doc, is_active: true };
          return { ...doc, is_active: false };
        })
      );
      toast.success("Version activated");
    } catch (error) {
      console.error("Error activating version:", error);
      toast.error("Failed to activate version");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setIsCreating(false);
    setSelectedDocument(null);
    setFormData({
      document_type: "terms_of_service",
      title: "",
      content: "",
      effective_date: "",
    });
  };

  const getDocumentTypeLabel = (type: string) => {
    return type === "terms_of_service" ? "Terms of Service" : "Privacy Policy";
  };

  const getPublicUrl = (type: string) => {
    return type === "terms_of_service"
      ? "/terms-of-service"
      : "/privacy-policy";
  };

  if (authLoading || loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8 text-gray-600">
        Sign in to manage legal documents.
      </div>
    );
  }

  if (user.role !== "super_admin") {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8 text-gray-600">
        You do not have permission to manage legal documents.
      </div>
    );
  }

  if (isEditing || isCreating) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-6">
          <Button variant="ghost" onClick={handleCancel} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Documents
          </Button>
          <h1 className="text-2xl font-bold">
            {isCreating ? "Create New Legal Document" : "Edit Legal Document"}
          </h1>
          <p className="text-gray-600 mt-1">
            {isCreating
              ? "Create a new legal document that will be displayed on your site"
              : "Edit the legal document content and settings"}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Document Details</CardTitle>
            <CardDescription>
              Configure the document type, title, and effective date
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="document_type">Document Type</Label>
                <Select
                  value={formData.document_type}
                  onValueChange={(
                    value: "terms_of_service" | "privacy_policy"
                  ) => setFormData({ ...formData, document_type: value })}
                  disabled={!isCreating}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="terms_of_service">
                      Terms of Service
                    </SelectItem>
                    <SelectItem value="privacy_policy">
                      Privacy Policy
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="effective_date">Effective Date</Label>
                <Input
                  id="effective_date"
                  type="date"
                  value={formData.effective_date}
                  onChange={(e) =>
                    setFormData({ ...formData, effective_date: e.target.value })
                  }
                />
              </div>
            </div>

            <div>
              <Label htmlFor="title">Document Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Enter document title"
              />
            </div>

            <div>
              <Label htmlFor="content">Document Content</Label>
              <div className="mt-2">
                <OmaHubEditor
                  content={formData.content}
                  onChange={(content: string) =>
                    setFormData({ ...formData, content })
                  }
                />
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving..." : "Save Document"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Link href="/studio/settings">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Settings
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Legal Documents</h1>
          <p className="text-gray-600 mt-1">
            Manage your Terms of Service and Privacy Policy
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Create Document
        </Button>
      </div>

      {setupRequired && (
        <Card className="mb-6 border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Database Setup Required
            </CardTitle>
            <CardDescription className="text-orange-700">
              The legal documents table needs to be created in your database to
              enable full functionality.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-orange-700">
            <p className="mb-4">To set up the legal documents system:</p>
            <ol className="list-decimal list-inside space-y-2 mb-4">
              <li>Go to your Supabase Dashboard</li>
              <li>Navigate to SQL Editor</li>
              <li>
                Copy and paste the SQL from{" "}
                <code className="bg-orange-100 px-2 py-1 rounded">
                  scripts/create-legal-documents-table.sql
                </code>
              </li>
              <li>Run the SQL script</li>
              <li>Refresh this page</li>
            </ol>
            <p className="text-sm">
              Until then, default documents will be displayed on your public
              pages.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6">
        {["terms_of_service", "privacy_policy"].map((type) => {
          const typeDocuments = documents.filter(
            (doc) => doc.document_type === type
          );
          const activeDocument = typeDocuments.find((doc) => doc.is_active);
          const allVersions = [...typeDocuments].sort(
            (a, b) => b.version - a.version
          );

          return (
            <Card key={type}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {getDocumentTypeLabel(type)}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() =>
                        handleCreateForType(
                          type as "terms_of_service" | "privacy_policy"
                        )
                      }
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      New Version
                    </Button>
                    <Link href={getPublicUrl(type)} target="_blank">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View Public
                      </Button>
                    </Link>
                  </div>
                </CardTitle>
                <CardDescription>
                  {activeDocument
                    ? `Active version ${activeDocument.version} (effective ${new Date(
                        activeDocument.effective_date
                      ).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })})`
                    : "No active version"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {allVersions.length > 0 ? (
                  <div className="space-y-3">
                    {allVersions.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            {doc.is_active ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-gray-400" />
                            )}
                            <span className="font-medium">
                              Version {doc.version}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(
                                doc.effective_date
                              ).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                            </div>
                            <div className="flex items-center gap-1">
                              <Hash className="h-3 w-3" />
                              {doc.title}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!doc.is_active && (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={saving}
                              onClick={() => handleActivateVersion(doc)}
                            >
                              Activate
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCreateFromVersion(doc)}
                          >
                            Duplicate
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(doc)}
                          >
                            Edit
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>No documents created yet</p>
                    <p className="text-sm">
                      Create your first{" "}
                      {getDocumentTypeLabel(type).toLowerCase()}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

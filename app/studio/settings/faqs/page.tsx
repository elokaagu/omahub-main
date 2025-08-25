"use client";



import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  HelpCircle,
  Save,
  X,
  GripVertical,
} from "lucide-react";
import { toast } from "sonner";
import OmaHubEditor from "@/app/components/OmaHubEditor";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  display_order: number;
  is_active: boolean;
  page_location: string;
  created_at: string;
  updated_at: string;
}

const categories = [
  { value: "general", label: "General" },
  { value: "designers", label: "Designers" },
  { value: "customers", label: "Customers" },
  { value: "platform", label: "Platform" },
  { value: "billing", label: "Billing" },
  { value: "shipping", label: "Shipping" },
];

const pageLocations = [
  { value: "general", label: "General" },
  { value: "how-it-works", label: "How It Works" },
  { value: "contact", label: "Contact" },
  { value: "join", label: "Join" },
  { value: "all", label: "All Pages" },
];

export default function FAQManagementPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedFaq, setSelectedFaq] = useState<FAQ | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterLocation, setFilterLocation] = useState<string>("all");
  const [showInactive, setShowInactive] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    question: "",
    answer: "",
    category: "general",
    display_order: 0,
    page_location: "general",
    is_active: true,
  });

  // Check if user is super admin
  useEffect(() => {
    if (user && user.role !== "super_admin") {
      router.push("/studio");
      return;
    }
  }, [user, router]);

  useEffect(() => {
    if (user?.role === "super_admin") {
      fetchFAQs();
    }
  }, [user, showInactive]);

  const fetchFAQs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (showInactive) {
        params.append("include_inactive", "true");
      }

      const response = await fetch(`/api/admin/faqs?${params}`);
      const data = await response.json();

      if (response.ok) {
        setFaqs(data.faqs);
      } else {
        toast.error(data.error || "Failed to fetch FAQs");
      }
    } catch (error) {
      console.error("Error fetching FAQs:", error);
      toast.error("Failed to fetch FAQs");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.question.trim() || !formData.answer.trim()) {
      toast.error("Please fill in both question and answer");
      return;
    }

    try {
      setSaving(true);

      const method = isEditing ? "PUT" : "POST";
      const body = isEditing ? { id: selectedFaq?.id, ...formData } : formData;

      const response = await fetch("/api/admin/faqs", {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(result.message);
        setIsDialogOpen(false);
        resetForm();
        fetchFAQs();
      } else {
        toast.error(result.error || "Failed to save FAQ");
      }
    } catch (error) {
      console.error("Error saving FAQ:", error);
      toast.error("Failed to save FAQ");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (faq: FAQ) => {
    setSelectedFaq(faq);
    setFormData({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      display_order: faq.display_order,
      page_location: faq.page_location,
      is_active: faq.is_active,
    });
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this FAQ?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/faqs?id=${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(result.message);
        fetchFAQs();
      } else {
        toast.error(result.error || "Failed to delete FAQ");
      }
    } catch (error) {
      console.error("Error deleting FAQ:", error);
      toast.error("Failed to delete FAQ");
    }
  };

  const toggleActive = async (faq: FAQ) => {
    try {
      const response = await fetch("/api/admin/faqs", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: faq.id,
          question: faq.question,
          answer: faq.answer,
          category: faq.category,
          display_order: faq.display_order,
          page_location: faq.page_location,
          is_active: !faq.is_active,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(
          `FAQ ${!faq.is_active ? "activated" : "deactivated"} successfully`
        );
        fetchFAQs();
      } else {
        toast.error(result.error || "Failed to update FAQ");
      }
    } catch (error) {
      console.error("Error updating FAQ:", error);
      toast.error("Failed to update FAQ");
    }
  };

  const resetForm = () => {
    setFormData({
      question: "",
      answer: "",
      category: "general",
      display_order: 0,
      page_location: "general",
      is_active: true,
    });
    setSelectedFaq(null);
    setIsEditing(false);
  };

  const filteredFaqs = faqs.filter((faq) => {
    if (filterCategory !== "all" && faq.category !== filterCategory) {
      return false;
    }
    if (filterLocation !== "all" && faq.page_location !== filterLocation) {
      return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-canela text-gray-900 mb-2">
            FAQ Management
          </h1>
          <p className="text-oma-cocoa/80">
            Manage frequently asked questions across the platform
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                resetForm();
                setIsDialogOpen(true);
              }}
              className="bg-oma-plum hover:bg-oma-plum/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add FAQ
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {isEditing ? "Edit FAQ" : "Add New FAQ"}
              </DialogTitle>
              <DialogDescription>
                {isEditing
                  ? "Update the FAQ details below"
                  : "Create a new frequently asked question"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="question">Question *</Label>
                <Input
                  id="question"
                  value={formData.question}
                  onChange={(e) =>
                    setFormData({ ...formData, question: e.target.value })
                  }
                  placeholder="Enter the question"
                  required
                />
              </div>
              <div>
                <Label htmlFor="answer">Answer *</Label>
                <OmaHubEditor
                  content={formData.answer}
                  onChange={(content: string) =>
                    setFormData({ ...formData, answer: content })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="page_location">Page Location</Label>
                  <Select
                    value={formData.page_location}
                    onValueChange={(value) =>
                      setFormData({ ...formData, page_location: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select page" />
                    </SelectTrigger>
                    <SelectContent>
                      {pageLocations.map((location) => (
                        <SelectItem key={location.value} value={location.value}>
                          {location.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="display_order">Display Order</Label>
                  <Input
                    id="display_order"
                    type="number"
                    value={formData.display_order}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        display_order: parseInt(e.target.value) || 0,
                      })
                    }
                    placeholder="0"
                  />
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_active: checked })
                    }
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-oma-plum hover:bg-oma-plum/90"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Saving..." : isEditing ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-2">
          <Label htmlFor="filter-category">Category:</Label>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.value} value={category.value}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2">
          <Label htmlFor="filter-location">Page:</Label>
          <Select value={filterLocation} onValueChange={setFilterLocation}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Pages</SelectItem>
              {pageLocations.map((location) => (
                <SelectItem key={location.value} value={location.value}>
                  {location.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="show-inactive"
            checked={showInactive}
            onCheckedChange={setShowInactive}
          />
          <Label htmlFor="show-inactive">Show Inactive</Label>
        </div>
      </div>

      {/* FAQ List */}
      <div className="space-y-4">
        {filteredFaqs.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No FAQs found
              </h3>
              <p className="text-gray-500 mb-4">
                {faqs.length === 0
                  ? "Get started by creating your first FAQ"
                  : "Try adjusting your filters to see more results"}
              </p>
              {faqs.length === 0 && (
                <Button
                  onClick={() => {
                    resetForm();
                    setIsDialogOpen(true);
                  }}
                  className="bg-oma-plum hover:bg-oma-plum/90"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add First FAQ
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredFaqs.map((faq) => (
            <Card key={faq.id} className={!faq.is_active ? "opacity-60" : ""}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">
                      {faq.question}
                    </CardTitle>
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge variant="secondary">{faq.category}</Badge>
                      <Badge variant="outline">
                        {pageLocations.find(
                          (loc) => loc.value === faq.page_location
                        )?.label || faq.page_location}
                      </Badge>
                      <Badge variant="outline">
                        Order: {faq.display_order}
                      </Badge>
                      {faq.is_active ? (
                        <Badge className="bg-green-100 text-green-800">
                          <Eye className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <EyeOff className="h-3 w-3 mr-1" />
                          Inactive
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleActive(faq)}
                      title={faq.is_active ? "Deactivate" : "Activate"}
                    >
                      {faq.is_active ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(faq)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(faq.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {faq.answer}
                </p>
                <div className="mt-4 text-xs text-gray-500">
                  Created: {new Date(faq.created_at).toLocaleDateString()} •
                  Updated: {new Date(faq.updated_at).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

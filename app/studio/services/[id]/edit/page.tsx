"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  getProductById,
  updateProduct,
  deleteProduct,
} from "@/lib/services/productService";
import { getAllBrands } from "@/lib/services/brandService";
import { Brand } from "@/lib/supabase";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileUpload } from "@/components/ui/file-upload";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Scissors,
  Clock,
  DollarSign,
  Users,
  Sparkles,
  MessageCircle,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

const serviceTypes = [
  {
    id: "consultation",
    title: "Design Consultation",
    description: "One-on-one design planning session",
    icon: MessageCircle,
    category: "Custom Design",
  },
  {
    id: "alterations",
    title: "Alterations & Repairs",
    description: "Adjustments and fixes for existing garments",
    icon: Scissors,
    category: "Alterations",
  },
  {
    id: "custom_design",
    title: "Custom Design Service",
    description: "Complete custom garment creation",
    icon: Sparkles,
    category: "Custom Design",
  },
  {
    id: "fitting",
    title: "Fitting Sessions",
    description: "Professional fitting and adjustment sessions",
    icon: Users,
    category: "Alterations",
  },
];

const tailorSpecialties = [
  "Bridal Wear",
  "Wedding Dresses",
  "Evening Gowns",
  "Cocktail Dresses",
  "Formal Wear",
  "Business Attire",
  "Casual Wear",
  "Alterations",
  "Custom Design",
  "Bespoke Tailoring",
  "Made-to-Measure",
  "Fitting Services",
  "Pattern Making",
  "Embroidery",
  "Beadwork",
];

export default function EditServicePage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const serviceId = params?.id as string;
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const brandsData = await getAllBrands();
        setBrands(brandsData);
        const service = await getProductById(serviceId);
        if (!service) throw new Error("Service not found");
        setFormData({
          ...service,
          consultation_fee: service.consultation_fee?.toString() || "",
          hourly_rate: service.hourly_rate?.toString() || "",
          fixed_price: service.fixed_price?.toString() || "",
          price_range: service.price_range || "",
          specialties: service.specialties || [],
          includes: service.includes || [],
          images: service.images || (service.image ? [service.image] : []),
          image: service.image || "",
        });
      } catch (err: any) {
        setError(err.message || "Failed to load service");
      } finally {
        setLoading(false);
      }
    };
    if (serviceId) fetchData();
  }, [serviceId]);

  const handleInputChange = (name: string, value: string | boolean) => {
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSpecialtyToggle = (specialty: string) => {
    setFormData((prev: any) => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter((s: string) => s !== specialty)
        : [...prev.specialties, specialty],
    }));
  };

  const handleArrayChange = (field: "includes", value: string) => {
    if (!value.trim()) return;
    setFormData((prev: any) => ({
      ...prev,
      [field]: [...prev[field], value.trim()],
    }));
  };

  const removeArrayItem = (field: "includes", index: number) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: prev[field].filter((_: any, i: number) => i !== index),
    }));
  };

  const handleImageUpload = (url: string, index?: number) => {
    if (index !== undefined) {
      setFormData((prev: any) => {
        const newImages = [...prev.images];
        newImages[index] = url;
        return {
          ...prev,
          images: newImages,
          image: index === 0 ? url : prev.image || url,
        };
      });
    } else {
      setFormData((prev: any) => ({
        ...prev,
        image: url,
        images: prev.images.length === 0 ? [url] : prev.images,
      }));
    }
  };

  const removeImage = (index: number) => {
    setFormData((prev: any) => {
      const newImages = prev.images.filter((_: any, i: number) => i !== index);
      return {
        ...prev,
        images: newImages,
        image: index === 0 && newImages.length > 0 ? newImages[0] : prev.image,
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.title ||
      !formData.description ||
      !formData.brand_id ||
      !formData.service_type
    ) {
      toast.error("Please fill in all required fields");
      return;
    }
    setIsSaving(true);
    try {
      const updateData = {
        ...formData,
        price: formData.contact_for_pricing
          ? 0
          : parseFloat(
              formData.consultation_fee ||
                formData.hourly_rate ||
                formData.fixed_price ||
                "0"
            ),
        consultation_fee: formData.consultation_fee
          ? parseFloat(formData.consultation_fee)
          : undefined,
        hourly_rate: formData.hourly_rate
          ? parseFloat(formData.hourly_rate)
          : undefined,
        fixed_price: formData.fixed_price
          ? parseFloat(formData.fixed_price)
          : undefined,
        images: formData.images,
        image: formData.images?.[0] || formData.image,
      };
      await updateProduct(serviceId, updateData);
      toast.success("Service updated successfully");
      router.push("/studio/services");
    } catch (err: any) {
      toast.error(err.message || "Failed to update service");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!serviceId) return;
    try {
      await deleteProduct(serviceId);
      toast.success("Service deleted successfully");
      router.push("/studio/services");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete service");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-oma-plum border-t-transparent rounded-full"></div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }
  if (!formData) return null;

  // Tailor-specific categories
  const tailoredCategories = [
    "Bridal",
    "Custom Design",
    "Evening Gowns",
    "Alterations",
    "Tailored",
    "Event Wear",
    "Wedding Guest",
    "Birthday",
  ];
  const isTailorBrand = () => {
    const selectedBrand = brands.find(
      (brand) => brand.id === formData.brand_id
    );
    return selectedBrand
      ? tailoredCategories.includes(selectedBrand.category)
      : false;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center mb-8">
        <Button
          variant="outline"
          size="icon"
          className="mr-4"
          onClick={() => router.push("/studio/services")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-canela text-gray-900">Edit Service</h1>
          <p className="text-gray-600 mt-1">
            Update your tailoring service or consultation
          </p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Brand Selection */}
        <Card className="border border-oma-gold/10 bg-white">
          <CardHeader>
            <CardTitle className="text-black">Select Brand</CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={formData.brand_id}
              onValueChange={(value) => handleInputChange("brand_id", value)}
              disabled
            >
              <SelectTrigger className="w-full border-oma-cocoa/20 bg-white/80">
                <SelectValue placeholder="Select brand" />
              </SelectTrigger>
              <SelectContent>
                {brands.map((brand) => (
                  <SelectItem key={brand.id} value={brand.id}>
                    {brand.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
        {/* Service Type */}
        <Card className="border border-oma-gold/10 bg-white">
          <CardHeader>
            <CardTitle className="text-black">Service Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {serviceTypes.map((service) => {
                const Icon = service.icon;
                return (
                  <div
                    key={service.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      formData.service_type === service.id
                        ? "border-oma-plum bg-oma-plum/10"
                        : "border-gray-200 hover:border-oma-plum/50"
                    }`}
                    onClick={() =>
                      handleInputChange("service_type", service.id)
                    }
                  >
                    <div className="flex items-start gap-3">
                      <Icon className="h-6 w-6 text-oma-plum mt-1" />
                      <div>
                        <h3 className="font-medium text-black">
                          {service.title}
                        </h3>
                        <p className="text-sm text-black/70 mt-1">
                          {service.description}
                        </p>
                        <Badge variant="outline" className="mt-2 text-xs">
                          {service.category}
                        </Badge>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
        {/* Service Details */}
        <Card className="border border-oma-gold/10 bg-white">
          <CardHeader>
            <CardTitle className="text-black">Service Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-black">
                Service Title *
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="e.g., Bridal Gown Consultation"
                className="border-oma-cocoa/20 focus:border-oma-plum"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="text-black">
                Service Description *
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                placeholder="Describe what this service includes, the process, and what clients can expect..."
                rows={4}
                className="border-oma-cocoa/20 focus:border-oma-plum"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="duration" className="text-black">
                  Duration
                </Label>
                <Input
                  id="duration"
                  value={formData.duration || ""}
                  onChange={(e) =>
                    handleInputChange("duration", e.target.value)
                  }
                  placeholder="e.g., 1-2 hours"
                  className="border-oma-cocoa/20 focus:border-oma-plum"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lead_time" className="text-black">
                  Lead Time
                </Label>
                <Input
                  id="lead_time"
                  value={formData.lead_time || ""}
                  onChange={(e) =>
                    handleInputChange("lead_time", e.target.value)
                  }
                  placeholder="e.g., 2-3 weeks"
                  className="border-oma-cocoa/20 focus:border-oma-plum"
                />
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Service Images */}
        <Card className="border border-oma-gold/10 bg-white">
          <CardHeader>
            <CardTitle className="text-black">Service Images</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[0, 1].map((index) => (
                <div key={index} className="space-y-2">
                  <Label className="text-sm text-gray-600">
                    Image {index + 1} {index === 0 && "(Main)"}
                  </Label>
                  <div className="relative">
                    <FileUpload
                      key={`image-${index}-${formData.images[index] || "empty"}`}
                      onUploadComplete={(url) => handleImageUpload(url, index)}
                      defaultValue={formData.images[index] || ""}
                      bucket="product-images"
                      path="services"
                      accept={{
                        "image/png": [".png"],
                        "image/jpeg": [".jpg", ".jpeg"],
                        "image/webp": [".webp"],
                      }}
                      maxSize={5}
                    />
                    {formData.images[index] && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-2 text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => removeImage(index)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        {/* Pricing */}
        <Card className="border border-oma-gold/10 bg-white">
          <CardHeader>
            <CardTitle className="text-black">Pricing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="consultation_fee" className="text-black">
                  Consultation Fee
                </Label>
                <Input
                  id="consultation_fee"
                  value={formData.consultation_fee}
                  onChange={(e) =>
                    handleInputChange("consultation_fee", e.target.value)
                  }
                  placeholder="$100"
                  className="border-oma-cocoa/20 focus:border-oma-plum"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hourly_rate" className="text-black">
                  Hourly Rate
                </Label>
                <Input
                  id="hourly_rate"
                  value={formData.hourly_rate}
                  onChange={(e) =>
                    handleInputChange("hourly_rate", e.target.value)
                  }
                  placeholder="$75/hour"
                  className="border-oma-cocoa/20 focus:border-oma-plum"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fixed_price" className="text-black">
                  Fixed Price
                </Label>
                <Input
                  id="fixed_price"
                  value={formData.fixed_price}
                  onChange={(e) =>
                    handleInputChange("fixed_price", e.target.value)
                  }
                  placeholder="$500"
                  className="border-oma-cocoa/20 focus:border-oma-plum"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price_range" className="text-black">
                  Price Range
                </Label>
                <Input
                  id="price_range"
                  value={formData.price_range}
                  onChange={(e) =>
                    handleInputChange("price_range", e.target.value)
                  }
                  placeholder="$500 - $2,000"
                  className="border-oma-cocoa/20 focus:border-oma-plum"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Checkbox
                id="contact_for_pricing"
                checked={formData.contact_for_pricing}
                onCheckedChange={(checked) =>
                  handleInputChange("contact_for_pricing", !!checked)
                }
              />
              <Label htmlFor="contact_for_pricing" className="text-black">
                Contact for Pricing
              </Label>
            </div>
          </CardContent>
        </Card>
        {/* Specialties */}
        <Card className="border border-oma-gold/10 bg-white">
          <CardHeader>
            <CardTitle className="text-black">Specialties</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {tailorSpecialties.map((specialty) => (
                <div
                  key={specialty}
                  className={`p-3 border rounded-lg cursor-pointer transition-all text-sm ${
                    formData.specialties.includes(specialty)
                      ? "border-oma-plum bg-oma-plum/10 text-oma-plum"
                      : "border-gray-200 hover:border-oma-plum/50"
                  }`}
                  onClick={() => handleSpecialtyToggle(specialty)}
                >
                  {specialty}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        {/* Sessions, Delivery, What's Included */}
        <Card className="border border-oma-gold/10 bg-white">
          <CardHeader>
            <CardTitle className="text-black">
              Sessions, Delivery, What's Included
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="sessions_included" className="text-black">
                  Sessions Included
                </Label>
                <Input
                  id="sessions_included"
                  value={formData.sessions_included || ""}
                  onChange={(e) =>
                    handleInputChange("sessions_included", e.target.value)
                  }
                  placeholder="e.g., 3 fitting sessions"
                  className="border-oma-cocoa/20 focus:border-oma-plum"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="delivery_method" className="text-black">
                  Delivery Method
                </Label>
                <Select
                  value={formData.delivery_method || ""}
                  onValueChange={(value) =>
                    handleInputChange("delivery_method", value)
                  }
                >
                  <SelectTrigger className="border-oma-cocoa/20 focus:border-oma-plum">
                    <SelectValue placeholder="Select delivery method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pickup">Pickup from Studio</SelectItem>
                    <SelectItem value="delivery">Home Delivery</SelectItem>
                    <SelectItem value="both">Pickup or Delivery</SelectItem>
                    <SelectItem value="consultation">
                      Consultation Only
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {/* What's Included */}
            <div className="space-y-2">
              <Label className="text-black">What's Included</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  placeholder="Add what's included (e.g., Initial consultation)"
                  className="border-oma-cocoa/20 focus:border-oma-plum"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleArrayChange("includes", e.currentTarget.value);
                      e.currentTarget.value = "";
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="border-oma-plum text-oma-plum hover:bg-oma-plum hover:text-white"
                  onClick={(e) => {
                    const input = e.currentTarget
                      .previousElementSibling as HTMLInputElement;
                    handleArrayChange("includes", input.value);
                    input.value = "";
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.includes.map((item: string, index: number) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="flex items-center gap-1 bg-oma-beige text-oma-plum"
                  >
                    {item}
                    <button
                      type="button"
                      onClick={() => removeArrayItem("includes", index)}
                      className="ml-1 hover:text-red-600"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Submit */}
        <div className="flex gap-4 pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/studio/services")}
            disabled={isSaving}
            className="border-oma-cocoa text-black hover:bg-oma-cocoa hover:text-white"
          >
            Cancel
          </Button>
          <AlertDialog
            open={showDeleteDialog}
            onOpenChange={setShowDeleteDialog}
          >
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="destructive"
                className="ml-auto"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete Service
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Service</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete the service
                  <span className="font-semibold text-oma-plum">
                    {" "}
                    {formData.title}{" "}
                  </span>
                  ? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-red-600 text-white hover:bg-red-700"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </form>
    </div>
  );
}

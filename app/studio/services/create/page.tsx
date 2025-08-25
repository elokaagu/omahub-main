"use client";



import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileUpload } from "@/components/ui/file-upload";
import { getTailorBrands } from "@/lib/services/brandService";
import { createProduct } from "@/lib/services/productService";
import { Brand } from "@/lib/supabase";
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
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/lib/supabase";
import { useTailoringEvent } from "@/contexts/NavigationContext";

// Service types for tailors
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

// Tailor specialties
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

export default function CreateServicePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const tailoringEvent = useTailoringEvent();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    service_type: "",
    brand_id: "",
    image: "",
    images: [] as string[],
    // Pricing
    consultation_fee: "",
    hourly_rate: "",
    fixed_price: "",
    price_range: "",
    contact_for_pricing: false,
    // Service details
    duration: "",
    sessions_included: "",
    specialties: [] as string[],
    requirements: "",
    lead_time: "",
    // Process
    measurement_guide: "",
    fitting_sessions: "",
    delivery_method: "",
    includes: [] as string[],
  });

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

  // Check if selected brand is a tailor brand
  const isTailorBrand = (): boolean => {
    return brands.some((brand) => brand.id === formData.brand_id);
  };

  // Fetch brands
  useEffect(() => {
    const fetchData = async () => {
      try {
        const brandsData = await getTailorBrands();
        console.log("Fetched tailoring brands:", brandsData);

        // Filter brands based on user role
        if (user?.role === "super_admin") {
          setBrands(brandsData);
        } else if (user?.role === "brand_admin") {
          if (!supabase) {
            console.error("Supabase client not available");
            setBrands([]);
            return;
          }

          const userProfile = await supabase
            .from("profiles")
            .select("owned_brands")
            .eq("id", user.id)
            .single();

          if (userProfile.data?.owned_brands) {
            const ownedBrandIds = userProfile.data.owned_brands;
            const ownedBrands = brandsData.filter((brand) =>
              ownedBrandIds.includes(brand.id)
            );
            setBrands(ownedBrands);
          } else {
            setBrands([]);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load brands");
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === "super_admin" || user?.role === "brand_admin") {
      fetchData();
    }

    // Subscribe to tailoring events to refetch brands
    const unsubscribe = tailoringEvent.subscribe(() => {
      fetchData();
    });
    return () => unsubscribe();
  }, [user]);

  const handleInputChange = (name: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleServiceTypeSelect = (serviceType: any) => {
    setFormData((prev) => ({
      ...prev,
      service_type: serviceType.id,
      title: serviceType.title,
      description: serviceType.description,
      // Set defaults based on service type
      contact_for_pricing: serviceType.id === "custom_design",
    }));
  };

  const handleSpecialtyToggle = (specialty: string) => {
    setFormData((prev) => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter((s) => s !== specialty)
        : [...prev.specialties, specialty],
    }));
  };

  const handleArrayChange = (field: "includes", value: string) => {
    if (!value.trim()) return;

    setFormData((prev) => ({
      ...prev,
      [field]: [...prev[field], value.trim()],
    }));
  };

  const removeArrayItem = (field: "includes", index: number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  const handleImageUpload = (url: string, index?: number) => {
    if (index !== undefined) {
      setFormData((prev) => {
        const newImages = [...prev.images];
        newImages[index] = url;
        return {
          ...prev,
          images: newImages,
          image: index === 0 ? url : prev.image || url,
        };
      });
    } else {
      setFormData((prev) => ({
        ...prev,
        image: url,
        images: prev.images.length === 0 ? [url] : prev.images,
      }));
    }
  };

  const removeImage = (index: number) => {
    setFormData((prev) => {
      const newImages = prev.images.filter((_, i) => i !== index);
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

    if (!isTailorBrand()) {
      toast.error("Services can only be created for tailor brands");
      return;
    }

    // Validate pricing
    if (
      !formData.contact_for_pricing &&
      !formData.consultation_fee &&
      !formData.hourly_rate &&
      !formData.fixed_price
    ) {
      toast.error("Please set pricing or enable 'Contact for Pricing'");
      return;
    }

    try {
      setIsLoading(true);

      // Create as a special product with service metadata
      const serviceData = {
        title: formData.title,
        description: formData.description,
        price: formData.contact_for_pricing
          ? 0
          : parseFloat(
              formData.consultation_fee ||
                formData.hourly_rate ||
                formData.fixed_price ||
                "0"
            ),
        image:
          formData.image || formData.images[0] || "/placeholder-service.jpg",
        images:
          formData.images.length > 0
            ? formData.images
            : [formData.image || "/placeholder-service.jpg"],
        brand_id: formData.brand_id,
        category:
          serviceTypes.find((s) => s.id === formData.service_type)?.category ||
          "Custom Design",
        categories: [
          serviceTypes.find((s) => s.id === formData.service_type)?.category ||
          "Custom Design"
        ],
        in_stock: true,
        is_custom: true,
        // Service-specific metadata
        service_type: ["consultation", "product", "service"].includes(
          formData.service_type
        )
          ? (formData.service_type as "consultation" | "product" | "service")
          : undefined,
        consultation_fee: formData.consultation_fee
          ? parseFloat(formData.consultation_fee)
          : undefined,
        hourly_rate: formData.hourly_rate
          ? parseFloat(formData.hourly_rate)
          : undefined,
        fixed_price: formData.fixed_price
          ? parseFloat(formData.fixed_price)
          : undefined,
        price_range: formData.price_range || undefined,
        contact_for_pricing: formData.contact_for_pricing,
        specialties: formData.specialties,
        duration: formData.duration || undefined,
        sessions_included: formData.sessions_included || undefined,
        requirements: formData.requirements || undefined,
        lead_time: formData.lead_time || undefined,
        measurement_guide: formData.measurement_guide || undefined,
        fitting_sessions: formData.fitting_sessions || undefined,
        delivery_method: formData.delivery_method || undefined,
        includes: formData.includes || [],
      };

      await createProduct(serviceData);
      toast.success("Service created successfully");
      router.push("/studio/products");
    } catch (error) {
      console.error("Error creating service:", error);
      toast.error("Failed to create service");
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-oma-plum border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center mb-8">
        <Button
          variant="outline"
          size="icon"
          className="mr-4"
          onClick={() => router.push("/studio/products")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-canela text-gray-900">Create Service</h1>
          <p className="text-gray-600 mt-1">
            Add a new tailoring service or consultation
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
            <div className="space-y-2">
              <Label htmlFor="brand" className="text-black">
                Tailor Brand *
              </Label>
              <Select
                value={formData.brand_id}
                onValueChange={(value) => handleInputChange("brand_id", value)}
                required
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a brand" />
                </SelectTrigger>
                <SelectContent>
                  {brands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id}>
                      {brand.name}
                      {brand.category && (
                        <Badge className="ml-2" variant="secondary">
                          {brand.category}
                        </Badge>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {brands.filter((brand) =>
                tailoredCategories.includes(brand.category)
              ).length === 0 && (
                <p className="text-sm text-amber-600">
                  No tailor brands found. Please create a tailor brand first.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Service Type Selection */}
        {formData.brand_id && isTailorBrand() && (
          <Card className="border border-oma-gold/10 bg-white">
            <CardHeader>
              <CardTitle className="text-black">Service Type</CardTitle>
              <p className="text-sm text-black/70">
                Choose the type of service you're offering
              </p>
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
                      onClick={() => handleServiceTypeSelect(service)}
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
        )}

        {/* Service Details */}
        {formData.service_type && (
          <>
            {/* Basic Information */}
            <Card className="border border-oma-gold/10 bg-white">
              <CardHeader>
                <CardTitle className="text-black">
                  Service Information
                </CardTitle>
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
                      value={formData.duration}
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
                      value={formData.lead_time}
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
                <p className="text-sm text-black/70">
                  Upload images showcasing your work or service process
                </p>
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
                          onUploadComplete={(url) =>
                            handleImageUpload(url, index)
                          }
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
                {/* Contact for Pricing */}
                <div className="flex items-center justify-between p-4 bg-oma-beige/30 rounded-lg">
                  <div className="space-y-0.5">
                    <Label
                      htmlFor="contact_for_pricing"
                      className="text-black font-medium"
                    >
                      Contact for Pricing
                    </Label>
                    <p className="text-sm text-black/70">
                      Let customers contact you for custom pricing
                    </p>
                  </div>
                  <Checkbox
                    id="contact_for_pricing"
                    checked={formData.contact_for_pricing}
                    onCheckedChange={(checked) =>
                      handleInputChange("contact_for_pricing", checked)
                    }
                  />
                </div>

                {formData.contact_for_pricing ? (
                  <div className="space-y-2">
                    <Label htmlFor="price_range" className="text-black">
                      Price Range (Optional)
                    </Label>
                    <Input
                      id="price_range"
                      value={formData.price_range}
                      onChange={(e) =>
                        handleInputChange("price_range", e.target.value)
                      }
                      placeholder="e.g., Starting from $200 or $200 - $800"
                      className="border-oma-cocoa/20 focus:border-oma-plum"
                    />
                            <p className="text-xs text-muted-foreground mt-1">
          Use "Starting from X" for minimum pricing, or provide a range like "200 - 800"
        </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                        placeholder="100"
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
                        placeholder="50"
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
                        placeholder="500"
                        className="border-oma-cocoa/20 focus:border-oma-plum"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Specialties */}
            <Card className="border border-oma-gold/10 bg-white">
              <CardHeader>
                <CardTitle className="text-black">Specialties</CardTitle>
                <p className="text-sm text-black/70">
                  Select your areas of expertise for this service
                </p>
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

            {/* Service Details */}
            <Card className="border border-oma-gold/10 bg-white">
              <CardHeader>
                <CardTitle className="text-black">Service Process</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="requirements" className="text-black">
                    Requirements
                  </Label>
                  <Textarea
                    id="requirements"
                    value={formData.requirements}
                    onChange={(e) =>
                      handleInputChange("requirements", e.target.value)
                    }
                    placeholder="What do clients need to bring or prepare for this service?"
                    rows={3}
                    className="border-oma-cocoa/20 focus:border-oma-plum"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="measurement_guide" className="text-black">
                    Measurement Guide
                  </Label>
                  <Textarea
                    id="measurement_guide"
                    value={formData.measurement_guide}
                    onChange={(e) =>
                      handleInputChange("measurement_guide", e.target.value)
                    }
                    placeholder="Describe your measurement process..."
                    rows={3}
                    className="border-oma-cocoa/20 focus:border-oma-plum"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="sessions_included" className="text-black">
                      Sessions Included
                    </Label>
                    <Input
                      id="sessions_included"
                      value={formData.sessions_included}
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
                      value={formData.delivery_method}
                      onValueChange={(value) =>
                        handleInputChange("delivery_method", value)
                      }
                    >
                      <SelectTrigger className="border-oma-cocoa/20 focus:border-oma-plum">
                        <SelectValue placeholder="Select delivery method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pickup">
                          Pickup from Studio
                        </SelectItem>
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
                    {formData.includes.map((item, index) => (
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
                onClick={() => router.push("/studio/products")}
                disabled={isLoading}
                className="border-oma-cocoa text-black hover:bg-oma-cocoa hover:text-white"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-oma-plum hover:bg-oma-plum/90"
                disabled={isLoading}
              >
                {isLoading ? "Creating..." : "Create Service"}
              </Button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}

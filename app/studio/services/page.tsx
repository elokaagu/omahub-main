"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getAllBrands } from "@/lib/services/brandService";
import {
  getProductsByBrand,
  getAllProductsByBrand,
} from "@/lib/services/productService";
import { Brand, Product } from "@/lib/supabase";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PlusCircle,
  RefreshCw,
  Search,
  Edit,
  Eye,
  Scissors,
  Clock,
  DollarSign,
  Users,
  Sparkles,
  MessageCircle,
} from "lucide-react";
import { AuthImage } from "@/components/ui/auth-image";
import { Loading } from "@/components/ui/loading";
import { supabase } from "@/lib/supabase";
import {
  usePathname,
  useSearchParams,
  useRouter as useNextRouter,
} from "next/navigation";
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
import { deleteProduct } from "@/lib/services/productService";
import { useTailoringEvent } from "@/contexts/NavigationContext";
import { formatProductPrice } from "@/lib/utils/priceFormatter";
import { getProductMainImage } from "@/lib/utils/productImageUtils";

type ServiceWithBrand = Product & {
  brand: {
    name: string;
    id: string;
    category: string;
    location: string;
    price_range?: string;
  };
};

// Service type icons
const serviceIcons = {
  consultation: MessageCircle,
  product: Scissors,
  portfolio: Sparkles,
  service: MessageCircle,
};

// Service type display labels
const serviceTypeLabels = {
  consultation: "Consultation",
  product: "Product",
  portfolio: "Portfolio",
  service: "Service",
};

// Get appropriate icon for service
const getServiceIcon = (service: ServiceWithBrand) => {
  // For portfolio items, show Sparkles icon
  if (service.service_type === "portfolio") {
    return Sparkles;
  }

  // For consultations, show MessageCircle
  if (service.service_type === "consultation") {
    return MessageCircle;
  }

  // For services, show MessageCircle
  if (service.service_type === "service") {
    return MessageCircle;
  }

  // Default to Scissors for products
  return Scissors;
};

// Get service type display label
const getServiceTypeLabel = (service: ServiceWithBrand): string => {
  if (
    service.service_type &&
    serviceTypeLabels[service.service_type as keyof typeof serviceTypeLabels]
  ) {
    return serviceTypeLabels[
      service.service_type as keyof typeof serviceTypeLabels
    ];
  }

  // Fallback based on product properties
  if (service.is_custom) {
    return "Custom Design";
  }

  if (service.consultation_fee) {
    return "Consultation";
  }

  if (service.hourly_rate) {
    return "Hourly Service";
  }

  return "Product";
};

export default function ServicesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const nextRouter = useNextRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [services, setServices] = useState<ServiceWithBrand[]>([]);
  const [filteredServices, setFilteredServices] = useState<ServiceWithBrand[]>(
    []
  );
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [selectedServiceType, setSelectedServiceType] = useState("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const tailoringEvent = useTailoringEvent();

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

  useEffect(() => {
    // Only fetch data on mount or when user/pathname changes
    if (searchParams.get("refresh") === "1") {
      fetchData();
      nextRouter.replace(pathname);
    } else {
      fetchData();
    }
    // Subscribe to tailoring events to refetch brands/services
    const unsubscribe = tailoringEvent.subscribe(() => {
      fetchData();
    });
    return () => unsubscribe();
  }, [user, pathname]);

  useEffect(() => {
    filterServices();
  }, [services, searchQuery, selectedBrand, selectedServiceType]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const brandsData = await getAllBrands();

      // Filter to only tailor brands
      const tailorBrands = brandsData.filter((brand) =>
        tailoredCategories.includes(brand.category)
      );

      // Filter brands based on user role
      let userBrands: Brand[] = [];
      if (user?.role === "super_admin") {
        userBrands = tailorBrands;
      } else if (user?.role === "brand_admin") {
        if (!supabase) {
          console.error("Supabase client not available");
          return;
        }

        const userProfile = await supabase
          .from("profiles")
          .select("owned_brands")
          .eq("id", user.id)
          .single();

        if (userProfile.data?.owned_brands) {
          const ownedBrandIds = userProfile.data.owned_brands;
          // Show all tailoring-enabled brands owned by the user, regardless of category
          userBrands = brandsData.filter((brand) =>
            ownedBrandIds.includes(brand.id)
          );
        }
      }

      setBrands(userBrands);

      // Fetch services (products with service_type) for these brands
      const allServices: ServiceWithBrand[] = [];

      for (const brand of userBrands) {
        try {
          const brandProducts = await getAllProductsByBrand(brand.id); // Use getAllProductsByBrand to include portfolio items

          // Show all products for tailoring brands
          const brandServices = brandProducts.map((product) => ({
            ...product,
            brand: {
              name: brand.name,
              id: brand.id,
              category: brand.category,
              location: brand.location,
            },
          }));
          allServices.push(...brandServices);
        } catch (error) {
          console.error(
            `Error fetching services for brand ${brand.name}:`,
            error
          );
        }
      }

      setServices(allServices);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterServices = () => {
    let filtered = [...services];

    // Filter by brand
    if (selectedBrand !== "all") {
      filtered = filtered.filter(
        (service) => service.brand.id === selectedBrand
      );
    }

    // Filter by service type
    if (selectedServiceType !== "all") {
      filtered = filtered.filter((service) => {
        if (selectedServiceType === "product") {
          return (
            service.service_type === "product" ||
            (!service.service_type && !service.is_custom)
          );
        }
        if (selectedServiceType === "portfolio") {
          return service.service_type === "portfolio";
        }
        if (selectedServiceType === "consultation") {
          return (
            service.service_type === "consultation" || service.consultation_fee
          );
        }
        if (selectedServiceType === "service") {
          return service.service_type === "service";
        }
        return service.service_type === selectedServiceType;
      });
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (service) =>
          service.title.toLowerCase().includes(query) ||
          service.description.toLowerCase().includes(query) ||
          service.brand.name.toLowerCase().includes(query)
      );
    }

    setFilteredServices(filtered);
  };

  const handleEditService = (serviceId: string) => {
    // Stay on the Services page after editing
    router.push(`/studio/services/${serviceId}/edit`);
  };

  const handleViewService = (serviceId: string) => {
    window.open(`/product/${serviceId}`, "_blank");
  };

  const handleDelete = async (serviceId: string) => {
    try {
      await deleteProduct(serviceId);
      setShowDeleteDialog(false);
      setDeletingId(null);
      fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to delete service");
    }
  };

  const formatPrice = (service: ServiceWithBrand): string => {
    // For portfolio items, always show "Contact for Pricing"
    if (service.service_type === "portfolio") {
      return "Contact for Pricing";
    }

    if (service.contact_for_pricing) {
      return "Contact for Pricing";
    }

    if (service.consultation_fee && service.consultation_fee > 0) {
      return (
        formatProductPrice(
          { price: service.consultation_fee },
          { price_range: service.brand?.price_range }
        ).displayPrice + " consultation"
      );
    }

    if (service.hourly_rate && service.hourly_rate > 0) {
      return (
        formatProductPrice(
          { price: service.hourly_rate },
          { price_range: service.brand?.price_range }
        ).displayPrice + "/hour"
      );
    }

    if (service.price && service.price > 0) {
      return formatProductPrice(
        { price: service.price },
        { price_range: service.brand?.price_range }
      ).displayPrice;
    }

    return "Contact for Pricing";
  };

  if (loading) {
    return <Loading />;
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Please sign in to access the studio.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-canela text-gray-900">Services</h1>
          <p className="text-gray-600 mt-1">
            Manage your tailoring services and consultations
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            className="flex items-center gap-2 border-oma-plum text-oma-plum hover:bg-oma-plum/10 w-full sm:w-auto"
            onClick={fetchData}
            disabled={loading}
            aria-label="Refresh services"
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh
          </Button>
          <Link href="/studio/services/create" className="w-full sm:w-auto">
            <Button className="bg-oma-plum hover:bg-oma-plum/90 flex items-center gap-2 w-full sm:w-auto">
              <PlusCircle className="h-4 w-4" />
              Add Service
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black/40 w-4 h-4" />
          <Input
            placeholder="Search services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 border-oma-cocoa/20 focus:border-oma-plum bg-white/80"
          />
        </div>

        <Select value={selectedBrand} onValueChange={setSelectedBrand}>
          <SelectTrigger className="w-full sm:w-48 border-oma-cocoa/20 bg-white/80">
            <SelectValue placeholder="Filter by brand" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Brands</SelectItem>
            {brands.map((brand) => (
              <SelectItem key={brand.id} value={brand.id}>
                {brand.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={selectedServiceType}
          onValueChange={setSelectedServiceType}
        >
          <SelectTrigger className="w-full sm:w-48 border-oma-cocoa/20 bg-white/80">
            <SelectValue placeholder="Service type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Services</SelectItem>
            <SelectItem value="product">Products</SelectItem>
            <SelectItem value="portfolio">Portfolio Items</SelectItem>
            <SelectItem value="consultation">Consultations</SelectItem>
            <SelectItem value="service">Other Services</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Services Grid */}
      {filteredServices.length === 0 ? (
        <Card className="border border-oma-gold/10 bg-white">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Scissors className="h-12 w-12 text-oma-plum/50 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No services found
            </h3>
            <p className="text-gray-500 text-center mb-6">
              {searchQuery ||
              selectedBrand !== "all" ||
              selectedServiceType !== "all"
                ? "Try adjusting your filters to see more services."
                : "Start by creating your first tailoring service."}
            </p>
            <Link href="/studio/services/create">
              <Button className="bg-oma-plum hover:bg-oma-plum/90">
                <PlusCircle className="h-4 w-4 mr-2" />
                Create Service
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => {
            const ServiceIcon = getServiceIcon(service);
            const serviceTypeLabel = getServiceTypeLabel(service);

            return (
              <Card
                key={service.id}
                className="border border-oma-gold/10 bg-white hover:shadow-md transition-shadow"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <ServiceIcon className="h-5 w-5 text-oma-plum" />
                      <Badge variant="outline" className="text-xs">
                        {serviceTypeLabel}
                      </Badge>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewService(service.id)}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditService(service.id)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog
                        open={showDeleteDialog && deletingId === service.id}
                        onOpenChange={(open) => {
                          setShowDeleteDialog(open);
                          if (!open) setDeletingId(null);
                        }}
                      >
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setDeletingId(service.id);
                              setShowDeleteDialog(true);
                            }}
                            className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Service</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete the service{" "}
                              <span className="font-semibold text-oma-plum">
                                {service.title}
                              </span>
                              ? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-red-600 text-white hover:bg-red-700"
                              onClick={() => handleDelete(service.id)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  <CardTitle className="text-lg">{service.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {service.brand.name} • {service.brand.location}
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-0">
                  {getProductMainImage(service) && (
                    <div className="relative h-32 mb-4 rounded-lg overflow-hidden">
                      <AuthImage
                        src={getProductMainImage(service)}
                        alt={service.title}
                        width={300}
                        height={128}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {service.description}
                  </p>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-oma-plum">
                        {formatPrice(service)}
                      </span>
                      {service.lead_time && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="h-3 w-3" />
                          {service.lead_time}
                        </div>
                      )}
                    </div>

                    {service.specialties && service.specialties.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {service.specialties
                          .slice(0, 2)
                          .map((specialty: string, index: number) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="text-xs"
                            >
                              {specialty}
                            </Badge>
                          ))}
                        {service.specialties.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{service.specialties.length - 2} more
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

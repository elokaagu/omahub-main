"use client";



import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Trash2, Eye, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { AuthImage } from "@/components/ui/auth-image";

// Helper function to get the main image for portfolio items
const getPortfolioMainImage = (item: PortfolioItem): string => {
  // If item has multiple images, use the first one
  if (item.images && item.images.length > 0) {
    const firstImage = item.images[0];
    if (firstImage) {
      return firstImage;
    }
  }

  // Fallback to the main image field
  return item.image || "";
};

interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  image: string;
  images: string[];
  category: string;
  brand_id: string;
  brand_name: string;
  price_range?: string;
  specialties?: string[];
  lead_time?: string;
  consultation_fee?: number;
  materials?: string[];
  techniques?: string[];
  inspiration?: string;
  created_at: string;
  updated_at: string;
}

export default function PortfolioPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPortfolioItems();
  }, []);

  const fetchPortfolioItems = async () => {
    try {
      // Fetch portfolio items from dedicated portfolio API
      const response = await fetch("/api/studio/portfolio");
      if (response.ok) {
        const data = await response.json();
        
        // Enrich with brand names from the joined data
        const enrichedPortfolio = data.map((item: any) => ({
          ...item,
          brand_name: item.brand?.name || "Unknown Brand",
        }));

        console.log("📸 Portfolio items fetched:", enrichedPortfolio.length);
        
        // Debug: Log image information for each portfolio item
        enrichedPortfolio.forEach((item: PortfolioItem, index: number) => {
          console.log(`📸 Portfolio item ${index + 1}:`, {
            title: item.title,
            mainImage: item.image,
            imagesArray: item.images,
            imagesArrayLength: item.images?.length || 0,
            firstImage: item.images?.[0] || "none"
          });
        });
        
        setPortfolioItems(enrichedPortfolio);
      } else {
        throw new Error("Failed to fetch portfolio items");
      }
    } catch (error) {
      console.error("Error fetching portfolio items:", error);
      toast.error("Failed to fetch portfolio items");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this portfolio item?")) {
      return;
    }

    try {
      const response = await fetch(`/api/studio/products/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Portfolio item deleted successfully");
        fetchPortfolioItems(); // Refresh the list
      } else {
        throw new Error("Failed to delete portfolio item");
      }
    } catch (error) {
      console.error("Error deleting portfolio item:", error);
      toast.error("Failed to delete portfolio item");
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-canela text-gray-900">
            Portfolio Management
          </h1>
          <p className="text-gray-600 mt-2">
            Showcase your work and craftsmanship without individual pricing
          </p>
        </div>
        <Button asChild className="bg-oma-plum hover:bg-oma-plum/90 text-white">
          <Link href="/studio/portfolio/create">
            <Plus className="h-4 w-4 mr-2" />
            Create Portfolio
          </Link>
        </Button>
      </div>

      {portfolioItems.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <ImageIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No portfolio items yet
            </h3>
            <p className="text-gray-600 mb-6">
              Start building your portfolio to showcase your work to potential
              clients.
            </p>
            <Button
              asChild
              className="bg-oma-plum hover:bg-oma-plum/90 text-white"
            >
              <Link href="/studio/portfolio/create">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Portfolio
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {portfolioItems.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <div className="aspect-[4/5] relative overflow-hidden">
                {getPortfolioMainImage(item) ? (
                  <AuthImage
                    src={getPortfolioMainImage(item)}
                    alt={item.title}
                    width={400}
                    height={500}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <ImageIcon className="h-12 w-12 text-gray-400" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 transition-opacity" />
              </div>

              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{item.title}</CardTitle>
                    <p className="text-sm text-gray-600 mb-2">
                      {item.brand_name} • {item.category}
                    </p>
                    {item.price_range && (
                      <p className="text-sm font-medium text-oma-plum">
                        {item.price_range}
                      </p>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                  {item.description}
                </p>

                {item.specialties && item.specialties.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-2">Specialties:</p>
                    <div className="flex flex-wrap gap-1">
                      {item.specialties.slice(0, 3).map((specialty, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-100 text-xs text-gray-700 rounded-full"
                        >
                          {specialty}
                        </span>
                      ))}
                      {item.specialties.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-xs text-gray-700 rounded-full">
                          +{item.specialties.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="text-oma-plum border-oma-plum hover:bg-oma-plum hover:text-white"
                    >
                      <Link href={`/studio/products/${item.id}/edit`}>
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Link>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="text-oma-cocoa border-oma-cocoa/20 hover:bg-oma-cocoa hover:text-white"
                    >
                      <Link href={`/brand/${item.brand_id}`}>
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Link>
                    </Button>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(item.id)}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

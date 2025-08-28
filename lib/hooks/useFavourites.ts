import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";

interface Brand {
  id: string;
  name: string;
  image: string;
  category: string;
  location: string;
  is_verified: boolean;
  rating: number;
  item_type: "brand";
}

interface Catalogue {
  id: string;
  title: string;
  image: string;
  brand_id: string;
  description?: string;
  item_type: "catalogue";
}

interface Product {
  id: string;
  title: string;
  image: string;
  brand_id: string;
  price: number;
  sale_price?: number;
  category: string;
  item_type: "product";
}

export interface FavouriteResult {
  id: string;
  user_id: string;
  item_id: string;
  item_type: "brand" | "catalogue" | "product";
}

type FavouriteItem = Brand | Catalogue | Product;

const useFavourites = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [favourites, setFavourites] = useState<FavouriteItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch favourites
  const fetchFavourites = useCallback(async () => {
    if (!user) {
      setFavourites([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/favourites`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Failed to fetch favourites: ${response.status}`
        );
      }

      const data = await response.json();
      console.log("📧 Fetched favourites:", data.favourites?.length || 0);
      console.log("📧 Fetched favourites data:", data.favourites);
      setFavourites(data.favourites || []);
      console.log(
        "📧 State updated with favourites count:",
        data.favourites?.length || 0
      );
      setError(null);
    } catch (err) {
      console.error("❌ Error fetching favourites:", err);
      setError("Failed to load favourites");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Add to favourites
  const addFavourite = useCallback(
    async (
      itemId: string,
      itemType: "brand" | "catalogue" | "product"
    ): Promise<boolean> => {
      try {
        // Add debugging
        console.log("🔍 addFavourite called with:", {
          itemId,
          itemType,
        });

        const res = await fetch("/api/favourites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemId, itemType }),
        });

        console.log("🔍 API response status:", res.status);
        const responseData = await res.json();
        console.log("🔍 API response data:", responseData);

        if (!res.ok) {
          // Handle specific error cases
          if (
            res.status === 400 &&
            responseData.error === "Item already in favourites"
          ) {
            // Item is already favourited, just refresh the list
            console.log("✅ Item already in favourites, refreshing list");
            await fetchFavourites();
            // Return false to indicate this was not a successful addition
            return false;
          }

          throw new Error(
            responseData.error || `Failed to add favourite: ${res.status}`
          );
        }

        console.log("✅ Favourite added successfully to database");

        // Refresh from server to get the updated list
        await fetchFavourites();

        // Return true to indicate successful addition
        return true;
      } catch (err: any) {
        console.error("❌ Error in addFavourite:", err);
        toast({
          title: "Error",
          description: err.message || "Failed to add favourite",
          variant: "destructive",
        });
        // Return false on error
        return false;
      }
    },
    [fetchFavourites, toast]
  );

  // Remove from favourites
  const removeFavourite = useCallback(
    async (itemId: string, itemType: "brand" | "catalogue" | "product") => {
      try {
        console.log("🔄 Removing favourite:", { itemId, itemType });

        const res = await fetch(
          `/api/favourites?itemId=${itemId}&itemType=${itemType}`,
          {
            method: "DELETE",
          }
        );

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(
            errorData.error || `Failed to remove favourite: ${res.status}`
          );
        }

        console.log("✅ Favourite removed successfully from database");

        // Immediately update local state to reflect the removal
        setFavourites((prev) =>
          prev.filter(
            (fav) => !(fav.id === itemId && fav.item_type === itemType)
          )
        );

        // Also refresh from server to ensure consistency
        await fetchFavourites();
        
        // Return true to indicate successful removal
        return true;
      } catch (err: any) {
        console.error("❌ Error in removeFavourite:", err);
        toast({
          title: "Error",
          description: err.message || "Failed to remove favourite",
          variant: "destructive",
        });
        
        // Return false on error
        return false;
      }
    },
    [fetchFavourites, toast]
  );

  // Check if an item is favourited
  const isFavourite = useCallback(
    (itemId: string, itemType: "brand" | "catalogue" | "product"): boolean => {
      const result = favourites.some(
        (favourite) =>
          favourite.id === itemId && favourite.item_type === itemType
      );
      console.log("🔍 isFavourite check:", {
        itemId,
        itemType,
        result,
        favouritesCount: favourites.length,
        favourites: favourites.map((f) => ({
          id: f.id,
          item_type: f.item_type,
        })),
        currentFavourites: favourites,
      });
      return result;
    },
    [favourites]
  );

  // Toggle favourite
  const toggleFavourite = useCallback(
    async (
      itemId: string,
      itemType: "brand" | "catalogue" | "product"
    ): Promise<boolean> => {
      if (isFavourite(itemId, itemType)) {
        const success = await removeFavourite(itemId, itemType);
        return success; // Return the success status from removeFavourite
      } else {
        const success = await addFavourite(itemId, itemType);
        return success; // Return the success status from addFavourite
      }
    },
    [isFavourite, removeFavourite, addFavourite]
  );

  // Fetch favourites on component mount or user change
  useEffect(() => {
    if (user) {
      fetchFavourites();
    }
  }, [user?.id]); // Only depend on user ID, not the entire fetchFavourites function

  return {
    favourites,
    loading,
    error,
    addFavourite,
    removeFavourite,
    isFavourite,
    toggleFavourite,
    fetchFavourites,
  };
};

export default useFavourites;

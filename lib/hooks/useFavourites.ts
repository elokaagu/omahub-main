import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { clearMalformedCookies } from "@/lib/utils/cookieUtils";
import { createClient } from "@/lib/supabase-unified";
import { toast } from "sonner";

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
  const { user, session } = useAuth();
  const [favourites, setFavourites] = useState<FavouriteItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Helper function to validate and refresh session if needed
  const ensureValidSession = async (): Promise<boolean> => {
    if (!session) return false;

    try {
      const supabase = createClient();
      
      // Check if current session is still valid
      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !currentSession) {
        console.log("🔄 Session invalid, attempting refresh...");
        
        // Try to refresh the session
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError || !refreshData.session) {
          console.error("❌ Session refresh failed:", refreshError);
          return false;
        }
        
        console.log("✅ Session refreshed successfully");
        return true;
      }
      
      return true;
    } catch (error) {
      console.error("❌ Error validating session:", error);
      return false;
    }
  };

  // Fetch favourites
  const fetchFavourites = useCallback(async () => {
    if (!user) {
      setFavourites([]);
      setLoading(false);
      return;
    }

    // Ensure we have a valid session before making API calls
    const hasValidSession = await ensureValidSession();
    if (!hasValidSession) {
      console.error("❌ No valid session for fetching favourites");
      setError("Authentication required - please sign in again");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/favourites`, {
        credentials: 'include', // Ensure cookies are sent
      });

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
  }, [user?.id, session]);

  // Add to favourites
  const addFavourite = useCallback(
    async (
      itemId: string,
      itemType: "brand" | "catalogue" | "product"
    ): Promise<boolean> => {
      try {
        // Ensure we have a valid session before making API calls
        const hasValidSession = await ensureValidSession();
        if (!hasValidSession) {
          console.error("❌ No valid session for adding favourite");
          toast.error("Authentication required - please sign in again");
          return false;
        }

        // Add debugging
        console.log("🔍 addFavourite called with:", {
          itemId,
          itemType,
        });

        const res = await fetch("/api/favourites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: 'include', // Ensure cookies are sent
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

        // Optimistically update local state immediately for better UX
        const newFavourite = {
          id: itemId,
          item_type: itemType,
          // Add other required fields based on item type
          ...(itemType === "brand" && { name: "", image: "", category: "", location: "", is_verified: false, rating: 0 }),
          ...(itemType === "catalogue" && { title: "", image: "", brand_id: "", description: "" }),
          ...(itemType === "product" && { title: "", image: "", brand_id: "", price: 0, sale_price: 0, category: "" }),
        };

        setFavourites((prev) => [...prev, newFavourite as FavouriteItem]);

        // Also refresh from server to get complete data
        await fetchFavourites();

        return true;
      } catch (error) {
        console.error("❌ Error in addFavourite:", error);
        toast.error(error instanceof Error ? error.message : "Failed to add to favourites");
        return false;
      }
    },
    [fetchFavourites, toast]
  );

  // Remove from favourites
  const removeFavourite = useCallback(
    async (
      itemId: string,
      itemType: "brand" | "catalogue" | "product"
    ): Promise<boolean> => {
      try {
        // Ensure we have a valid session before making API calls
        const hasValidSession = await ensureValidSession();
        if (!hasValidSession) {
          console.error("❌ No valid session for removing favourite");
          toast.error("Authentication required - please sign in again");
          return false;
        }

        console.log("🔍 removeFavourite called with:", {
          itemId,
          itemType,
        });

        const res = await fetch(
          `/api/favourites?itemId=${itemId}&itemType=${itemType}`,
          {
            method: "DELETE",
            credentials: 'include', // Ensure cookies are sent
          }
        );

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(
            errorData.error || `Failed to remove favourite: ${res.status}`
          );
        }

        console.log("✅ Favourite removed successfully from database");

        // Optimistically update local state immediately for better UX
        setFavourites((prev) =>
          prev.filter(
            (favourite) =>
              !(favourite.id === itemId && favourite.item_type === itemType)
          )
        );

        return true;
      } catch (error) {
        console.error("❌ Error in removeFavourite:", error);
        toast.error(error instanceof Error ? error.message : "Failed to remove from favourites");
        return false;
      }
    },
    [toast]
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
        searchingFor: { itemId, itemType },
        foundMatch: favourites.find(
          (f) => f.id === itemId && f.item_type === itemType
        ),
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
      // Clear any malformed cookies that might be causing parsing errors
      clearMalformedCookies();
      fetchFavourites();
    }
  }, [user?.id, session]); // Also depend on session changes

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

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface FavouriteItem {
  id: string;
  item_type: "brand" | "catalogue" | "product";
  favourite_id: string;
  [key: string]: any;
}

export default function useFavourites() {
  const { user } = useAuth();
  const [favourites, setFavourites] = useState<FavouriteItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Check if an item is favourited
  const isFavourite = useCallback((itemId: string, itemType: string): boolean => {
    return favourites.some(
      (item) => item.id === itemId && item.item_type === itemType
    );
  }, [favourites]);

  // Fetch favourites from the API
  const fetchFavourites = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await fetch("/api/favourites", {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setFavourites(data.favourites || []);
      console.log("✅ Favourites fetched successfully:", data.favourites?.length || 0);
    } catch (error) {
      console.error("❌ Error fetching favourites:", error);
      toast.error("Failed to load favourites");
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Add item to favourites
  const addFavourite = useCallback(async (itemId: string, itemType: string): Promise<boolean> => {
    if (!user) {
      toast.error("Please sign in to add favourites");
      return false;
    }

    try {
      const response = await fetch("/api/favourites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ itemId, itemType }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add to favourites");
      }

      const data = await response.json();
      console.log("✅ Added to favourites:", data);

      // Refresh favourites list
      await fetchFavourites();
      return true;
    } catch (error) {
      console.error("❌ Error adding favourite:", error);
      toast.error(error instanceof Error ? error.message : "Failed to add to favourites");
      return false;
    }
  }, [user, fetchFavourites]);

  // Remove item from favourites
  const removeFavourite = useCallback(async (itemId: string, itemType: string): Promise<boolean> => {
    if (!user) {
      toast.error("Please sign in to manage favourites");
      return false;
    }

    try {
      const response = await fetch(`/api/favourites?itemId=${itemId}&itemType=${itemType}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to remove from favourites");
      }

      const data = await response.json();
      console.log("✅ Removed from favourites:", data);

      // Refresh favourites list
      await fetchFavourites();
      return true;
    } catch (error) {
      console.error("❌ Error removing favourite:", error);
      toast.error(error instanceof Error ? error.message : "Failed to remove from favourites");
      return false;
    }
  }, [user, fetchFavourites]);

  // Toggle favourite status
  const toggleFavourite = useCallback(async (itemId: string, itemType: string): Promise<boolean> => {
    const currentlyFavourited = isFavourite(itemId, itemType);
    
    if (currentlyFavourited) {
      return await removeFavourite(itemId, itemType);
    } else {
      return await addFavourite(itemId, itemType);
    }
  }, [isFavourite, addFavourite, removeFavourite]);

  // Initialize favourites when user changes
  useEffect(() => {
    if (user && !initialized) {
      fetchFavourites();
      setInitialized(true);
    } else if (!user) {
      setFavourites([]);
      setInitialized(false);
    }
  }, [user, initialized, fetchFavourites]);

  // Refresh favourites when user changes
  useEffect(() => {
    if (user) {
      fetchFavourites();
    }
  }, [user, fetchFavourites]);

  return {
    favourites,
    loading,
    isFavourite,
    addFavourite,
    removeFavourite,
    toggleFavourite,
    refreshFavourites: fetchFavourites,
  };
}

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";

interface Brand {
  id: string;
  name: string;
  image: string;
  category: string;
  location: string;
  is_verified: boolean;
  rating: number;
}

interface Catalogue {
  id: string;
  title: string;
  image: string;
  brand_id: string;
  description?: string;
}

interface Product {
  id: string;
  title: string;
  image: string;
  brand_id: string;
  price: number;
  sale_price?: number;
  category: string;
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
      const response = await fetch(`/api/favourites?userId=${user.id}`);

      if (!response.ok) {
        throw new Error("Failed to fetch favourites");
      }

      const data = await response.json();
      setFavourites(data.favourites || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching favourites:", err);
      setError("Failed to load favourites");
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Add to favourites
  const addFavourite = useCallback(
    async (
      userId: string,
      itemId: string,
      itemType: "brand" | "catalogue" | "product"
    ) => {
      try {
        // Add debugging
        console.log("🔍 addFavourite called with:", {
          userId,
          itemId,
          itemType,
          userIdType: typeof userId,
          userIdLength: userId?.length,
        });

        const res = await fetch("/api/favourites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, itemId, itemType }),
        });

        console.log("🔍 API response status:", res.status);
        const responseData = await res.json();
        console.log("🔍 API response data:", responseData);

        if (!res.ok) throw new Error("Failed to add favourite");
        toast({ title: "Favourite added successfully" });
        fetchFavourites();
      } catch (err: any) {
        console.error("❌ Error in addFavourite:", err);
        toast({
          title: "Error",
          description: err.message || "Failed to add favourite",
          variant: "destructive",
        });
      }
    },
    [fetchFavourites]
  );

  // Remove from favourites
  const removeFavourite = useCallback(
    async (
      userId: string,
      itemId: string,
      itemType: "brand" | "catalogue" | "product"
    ) => {
      try {
        const res = await fetch(
          `/api/favourites?userId=${userId}&itemId=${itemId}&itemType=${itemType}`,
          {
            method: "DELETE",
          }
        );
        if (!res.ok) throw new Error("Failed to remove favourite");
        toast({ title: "Favourite removed successfully" });
        fetchFavourites();
      } catch (err: any) {
        toast({
          title: "Error",
          description: err.message || "Failed to remove favourite",
          variant: "destructive",
        });
      }
    },
    [fetchFavourites]
  );

  // Check if an item is favourited
  const isFavourite = useCallback(
    (itemId: string, itemType: "brand" | "catalogue" | "product"): boolean => {
      return favourites.some((favourite) => favourite.id === itemId);
    },
    [favourites]
  );

  // Toggle favourite
  const toggleFavourite = useCallback(
    async (
      itemId: string,
      itemType: "brand" | "catalogue" | "product"
    ): Promise<void> => {
      if (isFavourite(itemId, itemType)) {
        await removeFavourite(user?.id || "", itemId, itemType);
      } else {
        await addFavourite(user?.id || "", itemId, itemType);
      }
    },
    [isFavourite, removeFavourite, addFavourite, user]
  );

  // Fetch favourites on component mount or user change
  useEffect(() => {
    fetchFavourites();
  }, [fetchFavourites]);

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

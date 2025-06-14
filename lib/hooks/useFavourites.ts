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

export interface FavouriteResult {
  id: string;
  user_id: string;
  item_id: string;
  item_type: "brand" | "catalogue" | "product";
}

const useFavourites = () => {
  const { user } = useAuth();
  const [favourites, setFavourites] = useState<Brand[]>([]);
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
    async (brandId: string): Promise<FavouriteResult> => {
      if (!user) {
        return {
          id: "",
          user_id: "",
          item_id: "",
          item_type: "brand",
        };
      }

      try {
        const response = await fetch("/api/favourites", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: user.id,
            brandId,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to add favourite");
        }

        // Refresh favourites list
        fetchFavourites();
        toast({ title: "Favourite added successfully" });
        return {
          id: "",
          user_id: "",
          item_id: "",
          item_type: "brand",
        };
      } catch (err) {
        console.error("Error adding favourite:", err);
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : "Unknown error",
          variant: "destructive",
        });
        return {
          id: "",
          user_id: "",
          item_id: "",
          item_type: "brand",
        };
      }
    },
    [user, fetchFavourites]
  );

  // Remove from favourites
  const removeFavourite = useCallback(
    async (brandId: string): Promise<FavouriteResult> => {
      if (!user) {
        return {
          id: "",
          user_id: "",
          item_id: "",
          item_type: "brand",
        };
      }

      try {
        const response = await fetch(
          `/api/favourites?userId=${user.id}&brandId=${brandId}`,
          {
            method: "DELETE",
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to remove favourite");
        }

        // Refresh favourites list
        fetchFavourites();
        toast({ title: "Favourite removed successfully" });
        return {
          id: "",
          user_id: "",
          item_id: "",
          item_type: "brand",
        };
      } catch (err) {
        console.error("Error removing favourite:", err);
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : "Unknown error",
          variant: "destructive",
        });
        return {
          id: "",
          user_id: "",
          item_id: "",
          item_type: "brand",
        };
      }
    },
    [user, fetchFavourites]
  );

  // Check if a brand is favourited
  const isFavourite = useCallback(
    (brandId: string): boolean => {
      return favourites.some((favourite) => favourite.id === brandId);
    },
    [favourites]
  );

  // Toggle favourite
  const toggleFavourite = useCallback(
    async (brandId: string): Promise<FavouriteResult> => {
      if (isFavourite(brandId)) {
        return removeFavourite(brandId);
      } else {
        return addFavourite(brandId);
      }
    },
    [isFavourite, removeFavourite, addFavourite]
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

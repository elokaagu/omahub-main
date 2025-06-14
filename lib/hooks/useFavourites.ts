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
    async (userId: string, brandId: string) => {
      try {
        const res = await fetch("/api/favourites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, brandId }),
        });
        if (!res.ok) throw new Error("Failed to add favourite");
        toast({ title: "Favourite added successfully" });
        fetchFavourites();
      } catch (err: any) {
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
    async (userId: string, brandId: string) => {
      try {
        const res = await fetch(
          `/api/favourites?userId=${userId}&brandId=${brandId}`,
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

  // Check if a brand is favourited
  const isFavourite = useCallback(
    (brandId: string): boolean => {
      return favourites.some((favourite) => favourite.id === brandId);
    },
    [favourites]
  );

  // Toggle favourite
  const toggleFavourite = useCallback(
    async (brandId: string): Promise<void> => {
      if (isFavourite(brandId)) {
        await removeFavourite(user?.id || "", brandId);
      } else {
        await addFavourite(user?.id || "", brandId);
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

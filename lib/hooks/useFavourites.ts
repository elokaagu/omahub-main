import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import type { FavouriteItem } from "@/lib/types/favouriteItem";

/**
 * Standalone favourites hook (auth + fetch only). The live app uses
 * `useFavourites` from `@/contexts/FavouritesContext` for a single in-memory source of truth.
 * Both use the same {@link FavouriteItem} model from `@/lib/types/favouriteItem`.
 */
export default function useFavourites() {
  const { user } = useAuth();
  const [favourites, setFavourites] = useState<FavouriteItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const isFavourite = useCallback(
    (itemId: string, itemType: string): boolean => {
      return favourites.some(
        (item) => item.id === itemId && item.item_type === itemType
      );
    },
    [favourites]
  );

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
      const raw = Array.isArray(data.favourites)
        ? data.favourites
        : data.favourites?.items ?? [];
      const list = Array.isArray(raw) ? raw : [];
      setFavourites(list as FavouriteItem[]);
    } catch (error) {
      console.error("Error fetching favourites:", error);
      toast.error("Failed to load favourites", {
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  const addFavourite = useCallback(
    async (
      itemId: string,
      itemType: "brand" | "catalogue" | "product"
    ): Promise<boolean> => {
      if (!user) {
        toast.error("Please sign in to add favourites", {
          duration: 2500,
        });
        return false;
      }

      const optimisticItem: FavouriteItem = {
        id: itemId,
        item_type: itemType,
        favourite_id: `temp-${Date.now()}`,
        name: itemType === "brand" ? "Loading…" : undefined,
        title: itemType !== "brand" ? "Loading…" : undefined,
        created_at: new Date().toISOString(),
      };

      setFavourites((prev) => [...prev, optimisticItem]);

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

        const data = (await response.json()) as {
          favourite?: { id?: string };
        };
        const rowId =
          typeof data.favourite?.id === "string" ? data.favourite.id : undefined;

        setFavourites((prev) =>
          prev.map((item) =>
            item.id === itemId && item.item_type === itemType
              ? {
                  ...item,
                  ...(rowId ? { favourite_id: rowId } : {}),
                }
              : item
          )
        );

        toast.success("Added to favourites", {
          duration: 1500,
        });

        return true;
      } catch (error) {
        console.error("Error adding favourite:", error);

        setFavourites((prev) =>
          prev.filter(
            (item) => !(item.id === itemId && item.item_type === itemType)
          )
        );

        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to add to favourites",
          {
            duration: 3000,
          }
        );
        return false;
      }
    },
    [user]
  );

  const removeFavourite = useCallback(
    async (
      itemId: string,
      itemType: "brand" | "catalogue" | "product"
    ): Promise<boolean> => {
      if (!user) {
        toast.error("Please sign in to manage favourites", {
          duration: 2500,
        });
        return false;
      }

      const itemToRemove = favourites.find(
        (item) => item.id === itemId && item.item_type === itemType
      );

      setFavourites((prev) =>
        prev.filter(
          (item) => !(item.id === itemId && item.item_type === itemType)
        )
      );

      try {
        const response = await fetch(
          `/api/favourites?itemId=${encodeURIComponent(itemId)}&itemType=${encodeURIComponent(itemType)}`,
          {
            method: "DELETE",
            credentials: "include",
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || "Failed to remove from favourites"
          );
        }

        toast.success("Removed from favourites", {
          duration: 1500,
        });

        return true;
      } catch (error) {
        console.error("Error removing favourite:", error);

        if (itemToRemove) {
          setFavourites((prev) => [...prev, itemToRemove]);
        }

        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to remove from favourites",
          {
            duration: 3000,
          }
        );
        return false;
      }
    },
    [user, favourites]
  );

  const toggleFavourite = useCallback(
    async (
      itemId: string,
      itemType: "brand" | "catalogue" | "product"
    ): Promise<boolean> => {
      const currentlyFavourited = isFavourite(itemId, itemType);

      if (currentlyFavourited) {
        return await removeFavourite(itemId, itemType);
      }
      return await addFavourite(itemId, itemType);
    },
    [isFavourite, addFavourite, removeFavourite]
  );

  useEffect(() => {
    if (user && !initialized) {
      fetchFavourites();
      setInitialized(true);
    } else if (!user) {
      setFavourites([]);
      setInitialized(false);
    }
  }, [user, initialized, fetchFavourites]);

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

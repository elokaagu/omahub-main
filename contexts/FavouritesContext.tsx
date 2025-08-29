"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useAuth } from "./AuthContext";
import { toast } from "sonner";

interface FavouriteItem {
  id: string;
  item_type: "brand" | "catalogue" | "product";
  name?: string;
  title?: string;
  image?: string;
  category?: string;
  location?: string;
  price?: string;
  brand_id?: string;
  created_at: string;
}

interface FavouritesContextType {
  favourites: FavouriteItem[];
  loading: boolean;
  isFavourite: (itemId: string, itemType: string) => boolean;
  addFavourite: (
    itemId: string,
    itemType: string,
    itemData?: Partial<FavouriteItem>
  ) => Promise<boolean>;
  removeFavourite: (itemId: string, itemType: string) => Promise<boolean>;
  toggleFavourite: (
    itemId: string,
    itemType: string,
    itemData?: Partial<FavouriteItem>
  ) => Promise<boolean>;
  refreshFavourites: () => Promise<void>;
}

const FavouritesContext = createContext<FavouritesContextType | undefined>(
  undefined
);

export function FavouritesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const [favourites, setFavourites] = useState<FavouriteItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Fetch favourites from API
  const fetchFavourites = useCallback(async () => {
    if (!user) {
      setFavourites([]);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/favourites", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch favourites");
      }

      const data = await response.json();
      console.log("📚 Fetched favourites:", data);
      setFavourites(data.favourites || []);
    } catch (error) {
      console.error("❌ Error fetching favourites:", error);
      toast.error("Failed to load favourites");
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Check if an item is favourited
  const isFavourite = useCallback(
    (itemId: string, itemType: string): boolean => {
      return favourites.some(
        (item) => item.id === itemId && item.item_type === itemType
      );
    },
    [favourites]
  );

  // Add to favourites
  const addFavourite = useCallback(
    async (
      itemId: string,
      itemType: string,
      itemData?: Partial<FavouriteItem>
    ): Promise<boolean> => {
      if (!user) {
        toast.error("Please log in to add favourites");
        return false;
      }

      // Add to UI immediately (optimistic update)
      const optimisticItem: FavouriteItem = {
        id: itemId,
        item_type: itemType as "brand" | "catalogue" | "product",
        name: itemData?.name || itemData?.title || "Unknown",
        title: itemData?.title || itemData?.name || "Unknown",
        image: itemData?.image || "",
        category: itemData?.category || "",
        location: itemData?.location || "",
        price: itemData?.price || "",
        brand_id: itemData?.brand_id || "",
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
          body: JSON.stringify({
            itemId,
            itemType,
            ...itemData,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to add to favourites");
        }

        const data = await response.json();
        console.log("✅ Added to favourites:", data);

        // Show success toast
        toast.success("Added to favourites", {
          duration: 1500,
        });

        return true;
      } catch (error) {
        console.error("❌ Error adding favourite:", error);

        // Remove optimistic item on error
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

  // Remove from favourites
  const removeFavourite = useCallback(
    async (itemId: string, itemType: string): Promise<boolean> => {
      if (!user) {
        toast.error("Please log in to manage favourites");
        return false;
      }

      // Find item to remove
      const itemToRemove = favourites.find(
        (item) => item.id === itemId && item.item_type === itemType
      );

      if (!itemToRemove) {
        console.log("⚠️ Item not found in favourites:", itemId, itemType);
        return false;
      }

      // Remove from UI immediately
      setFavourites((prev) =>
        prev.filter(
          (item) => !(item.id === itemId && item.item_type === itemType)
        )
      );

      try {
        const response = await fetch(
          `/api/favourites?itemId=${itemId}&itemType=${itemType}`,
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

        const data = await response.json();
        console.log("✅ Removed from favourites:", data);

        // Show success toast
        toast.success("Removed from favourites", {
          duration: 1500,
        });

        return true;
      } catch (error) {
        console.error("❌ Error removing favourite:", error);

        // Restore item on error
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

  // Toggle favourite status
  const toggleFavourite = useCallback(
    async (
      itemId: string,
      itemType: string,
      itemData?: Partial<FavouriteItem>
    ): Promise<boolean> => {
      const currentlyFavourited = isFavourite(itemId, itemType);

      if (currentlyFavourited) {
        return await removeFavourite(itemId, itemType);
      } else {
        return await addFavourite(itemId, itemType, itemData);
      }
    },
    [isFavourite, addFavourite, removeFavourite]
  );

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

  const value = {
    favourites,
    loading,
    isFavourite,
    addFavourite,
    removeFavourite,
    toggleFavourite,
    refreshFavourites: fetchFavourites,
  };

  return (
    <FavouritesContext.Provider value={value}>
      {children}
    </FavouritesContext.Provider>
  );
}

export function useFavourites() {
  const context = useContext(FavouritesContext);
  if (context === undefined) {
    throw new Error("useFavourites must be used within a FavouritesProvider");
  }
  return context;
}

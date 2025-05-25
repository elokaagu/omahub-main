import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";

const useFavorites = () => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch favorites
  const fetchFavorites = useCallback(async () => {
    if (!user) {
      setFavorites([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/favorites?userId=${user.id}`);

      if (!response.ok) {
        throw new Error("Failed to fetch favorites");
      }

      const data = await response.json();
      setFavorites(data.favorites || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching favorites:", err);
      setError("Failed to load favorites");
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Add to favorites
  const addFavorite = useCallback(
    async (brandId) => {
      if (!user) {
        return {
          success: false,
          message: "You must be logged in to add favorites",
        };
      }

      try {
        const response = await fetch("/api/favorites", {
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
          throw new Error(errorData.error || "Failed to add favorite");
        }

        // Refresh favorites list
        fetchFavorites();
        return { success: true };
      } catch (err) {
        console.error("Error adding favorite:", err);
        return { success: false, message: err.message };
      }
    },
    [user, fetchFavorites]
  );

  // Remove from favorites
  const removeFavorite = useCallback(
    async (brandId) => {
      if (!user) {
        return {
          success: false,
          message: "You must be logged in to remove favorites",
        };
      }

      try {
        const response = await fetch(
          `/api/favorites?userId=${user.id}&brandId=${brandId}`,
          {
            method: "DELETE",
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to remove favorite");
        }

        // Refresh favorites list
        fetchFavorites();
        return { success: true };
      } catch (err) {
        console.error("Error removing favorite:", err);
        return { success: false, message: err.message };
      }
    },
    [user, fetchFavorites]
  );

  // Check if a brand is favorited
  const isFavorite = useCallback(
    (brandId) => {
      return favorites.some((favorite) => favorite.id === brandId);
    },
    [favorites]
  );

  // Toggle favorite
  const toggleFavorite = useCallback(
    async (brandId) => {
      if (isFavorite(brandId)) {
        return removeFavorite(brandId);
      } else {
        return addFavorite(brandId);
      }
    },
    [isFavorite, removeFavorite, addFavorite]
  );

  // Fetch favorites on component mount or user change
  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  return {
    favorites,
    loading,
    error,
    addFavorite,
    removeFavorite,
    isFavorite,
    toggleFavorite,
    fetchFavorites,
  };
};

export default useFavorites;

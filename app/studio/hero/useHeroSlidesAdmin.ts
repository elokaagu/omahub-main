"use client";

import { useState, useEffect, useCallback } from "react";
import type { User } from "@/lib/services/authService";
import {
  getAllHeroSlides,
  deleteHeroSlide,
  toggleHeroSlideStatus,
  reorderHeroSlides,
  type HeroSlide,
} from "@/lib/services/heroService";
import { toast } from "sonner";

type ListLoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready" };

type ReorderBusy =
  | { fromIndex: number; direction: "up" | "down" }
  | null;

function applyDisplayOrderFromOrder(slides: HeroSlide[]): HeroSlide[] {
  return slides.map((slide, i) => ({
    ...slide,
    display_order: i + 1,
  }));
}

export function useHeroSlidesAdmin(user: User | null) {
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);
  const [listLoad, setListLoad] = useState<ListLoadState>({ status: "loading" });
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isToggling, setIsToggling] = useState<string | null>(null);
  const [reorderBusy, setReorderBusy] = useState<ReorderBusy>(null);

  const fetchSlides = useCallback(async () => {
    setListLoad({ status: "loading" });
    try {
      const slides = await getAllHeroSlides();
      setHeroSlides(slides);
      setListLoad({ status: "ready" });
    } catch (error) {
      console.error("Error fetching hero slides:", error);
      setHeroSlides([]);
      setListLoad({
        status: "error",
        message:
          error instanceof Error ? error.message : "Failed to load hero slides",
      });
    }
  }, []);

  useEffect(() => {
    if (!user || user.role !== "super_admin") return;
    void fetchSlides();
  }, [user, fetchSlides]);

  const handleDelete = async (id: string) => {
    if (!user) return;
    try {
      setIsDeleting(id);
      await deleteHeroSlide(user.id, id);
      setHeroSlides((prev) => prev.filter((slide) => slide.id !== id));
      toast.success("Hero slide deleted successfully");
    } catch (error) {
      console.error("Error deleting hero slide:", error);
      toast.error("Failed to delete hero slide");
    } finally {
      setIsDeleting(null);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    if (!user) return;
    try {
      setIsToggling(id);
      await toggleHeroSlideStatus(user.id, id, !currentStatus);
      setHeroSlides((prev) =>
        prev.map((slide) =>
          slide.id === id ? { ...slide, is_active: !currentStatus } : slide
        )
      );
      toast.success(
        `Hero slide ${!currentStatus ? "activated" : "deactivated"} successfully`
      );
    } catch (error) {
      console.error("Error toggling hero slide status:", error);
      toast.error("Failed to update hero slide status");
    } finally {
      setIsToggling(null);
    }
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0 || !user) return;
    try {
      setReorderBusy({ fromIndex: index, direction: "up" });
      const newSlides = [...heroSlides];
      [newSlides[index - 1], newSlides[index]] = [
        newSlides[index],
        newSlides[index - 1],
      ];
      const slideIds = newSlides.map((slide) => slide.id);
      await reorderHeroSlides(user.id, slideIds);
      setHeroSlides(applyDisplayOrderFromOrder(newSlides));
      toast.success("Hero slides reordered successfully");
    } catch (error) {
      console.error("Error reordering hero slides:", error);
      toast.error("Failed to reorder hero slides");
    } finally {
      setReorderBusy(null);
    }
  };

  const handleMoveDown = async (index: number) => {
    if (index === heroSlides.length - 1 || !user) return;
    try {
      setReorderBusy({ fromIndex: index, direction: "down" });
      const newSlides = [...heroSlides];
      [newSlides[index], newSlides[index + 1]] = [
        newSlides[index + 1],
        newSlides[index],
      ];
      const slideIds = newSlides.map((slide) => slide.id);
      await reorderHeroSlides(user.id, slideIds);
      setHeroSlides(applyDisplayOrderFromOrder(newSlides));
      toast.success("Hero slides reordered successfully");
    } catch (error) {
      console.error("Error reordering hero slides:", error);
      toast.error("Failed to reorder hero slides");
    } finally {
      setReorderBusy(null);
    }
  };

  const reorderInFlight = reorderBusy !== null;

  const reorderUpLoading = (index: number) =>
    reorderBusy?.fromIndex === index && reorderBusy.direction === "up";

  const reorderDownLoading = (index: number) =>
    reorderBusy?.fromIndex === index && reorderBusy.direction === "down";

  return {
    heroSlides,
    listLoad,
    fetchSlides,
    isDeleting,
    isToggling,
    reorderInFlight,
    reorderUpLoading,
    reorderDownLoading,
    handleDelete,
    handleToggleStatus,
    handleMoveUp,
    handleMoveDown,
  };
}

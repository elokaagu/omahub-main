import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getBrand, deleteBrand } from "@/lib/services/brandService";
import type { Brand, Tailor } from "@/lib/supabase";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { formatBrandDescription } from "@/lib/utils/textFormatter";
import { getPrimaryBrandImagePublicUrl } from "@/lib/brands/brandEditMedia";
import { useTailoringEvent } from "@/contexts/NavigationContext";
import {
  STUDIO_CURRENCIES,
  SHORT_DESCRIPTION_LIMIT,
  BRAND_NAME_LIMIT,
} from "./brandEditConstants";
import { brandEditDevLog } from "./brandEditDevLog";

export function useBrandEditor(brandId: string) {
  const router = useRouter();
  const { user } = useAuth();
  const tailoringEvent = useTailoringEvent();

  const [brand, setBrand] = useState<Brand | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [imageUploading, setImageUploading] = useState(false);
  const [imageUploadProgress, setImageUploadProgress] = useState(0);
  const [tailor, setTailor] = useState<Tailor | null>(null);
  const [tailorModalOpen, setTailorModalOpen] = useState(false);
  const [tailorSpecialties, setTailorSpecialties] = useState<string[]>([]);
  const [tailorPriceRange, setTailorPriceRange] = useState("");
  const [tailorConsultationFee, setTailorConsultationFee] = useState("");
  const [tailorLeadTime, setTailorLeadTime] = useState("");
  const [tailorSaving, setTailorSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [disableTailoring, setDisableTailoring] = useState(false);

  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [currency, setCurrency] = useState("NONE");

  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const updateFormStateFromBrand = useCallback((brandData: Brand) => {
    setImageUrl(getPrimaryBrandImagePublicUrl(brandData));

    if (brandData.currency && brandData.currency !== "NONE") {
      setCurrency(brandData.currency);
      brandEditDevLog("Setting currency from brand data:", brandData.currency);
    } else if (
      brandData.price_range &&
      brandData.price_range !== "Contact for pricing" &&
      brandData.price_range !== "Explore brand for prices"
    ) {
      const priceRangeMatch = brandData.price_range.match(
        /^([^\d,]+)(\d+(?:,\d+)*)\s*-\s*([^\d,]+)(\d+(?:,\d+)*)$/
      );
      if (priceRangeMatch) {
        const [, symbol1, min, symbol2, max] = priceRangeMatch;
        const foundCurrency = STUDIO_CURRENCIES.find(
          (c) => c.symbol === symbol1.trim() || c.symbol === symbol2.trim()
        );
        if (foundCurrency) {
          setCurrency(foundCurrency.code);
          setPriceMin(min.replace(/,/g, ""));
          setPriceMax(max.replace(/,/g, ""));
        }
      } else {
        setCurrency("NONE");
        setPriceMin("");
        setPriceMax("");
      }
    } else {
      setCurrency("NONE");
      setPriceMin("");
      setPriceMax("");
    }
  }, []);

  useEffect(() => {
    const fetchBrand = async () => {
      setLoading(true);
      setErrorMsg(null);
      try {
        brandEditDevLog("Fetching brand with ID:", brandId);
        const brandData = await getBrand(brandId);

        if (brandData) {
          brandEditDevLog("Brand data found:", brandData.name);
          setBrand(brandData);
          updateFormStateFromBrand(brandData);
        } else {
          setBrand(null);
          setErrorMsg(
            "Brand not found. Please check the URL or try again later."
          );
        }
      } catch (error) {
        console.error("Error fetching brand:", error);
        toast.error("Error loading brand data");
        setErrorMsg(
          "An error occurred while loading the brand. Please try again later."
        );
        setBrand(null);
      } finally {
        setLoading(false);
      }
    };

    void fetchBrand();
  }, [brandId, updateFormStateFromBrand]);

  useEffect(() => {
    if (brand) {
      updateFormStateFromBrand(brand);
      setSelectedCategory(brand.category || "");
      setSelectedCategories(brand.categories || []);
    }
  }, [brand, updateFormStateFromBrand]);

  useEffect(() => {
    async function fetchTailor() {
      if (!brand) return;
      const { data, error } = await supabase
        .from("tailors")
        .select("*")
        .eq("brand_id", brand.id)
        .maybeSingle();

      if (error) {
        console.error("Tailor fetch error:", error);
        setTailor(null);
        setTailorSpecialties([]);
        setTailorPriceRange("");
        setTailorConsultationFee("");
        setTailorLeadTime("");
        return;
      }

      if (data) {
        const row = data as Tailor;
        setTailor(row);
        setTailorSpecialties(row.specialties || []);
        setTailorPriceRange(row.price_range || "");
        setTailorConsultationFee(
          row.consultation_fee != null ? String(row.consultation_fee) : ""
        );
        setTailorLeadTime(row.lead_time || "");
      } else {
        setTailor(null);
        setTailorSpecialties([]);
        setTailorPriceRange("");
        setTailorConsultationFee("");
        setTailorLeadTime("");
      }
    }
    void fetchTailor();
  }, [brand]);

  const handleTailorSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setTailorSaving(true);
    if (!brand) {
      toast.error("Brand not loaded");
      setTailorSaving(false);
      return;
    }
    const primaryImage = getPrimaryBrandImagePublicUrl(brand);
    const payload = {
      brand_id: brand.id,
      title: brand.name,
      image: imageUrl || primaryImage,
      description: brand.description || brand.long_description || "",
      specialties: tailorSpecialties,
      price_range: tailorPriceRange,
      consultation_fee: tailorConsultationFee
        ? Number(tailorConsultationFee)
        : null,
      lead_time: tailorLeadTime,
    };

    await supabase
      .from("brands")
      .update({
        category: selectedCategory,
        categories: selectedCategories,
      })
      .eq("id", brand.id);

    let result;
    if (tailor) {
      result = await supabase
        .from("tailors")
        .update(payload)
        .eq("id", tailor.id)
        .select()
        .single();
    } else {
      result = await supabase.from("tailors").insert(payload).select().single();
    }

    if (result.error) {
      toast.error("Failed to save tailoring profile");
    } else if (result.data) {
      toast.success("Tailoring profile saved");
      setTailor(result.data as Tailor);
      setTailorModalOpen(false);
      tailoringEvent.notify();
      setBrand((prev) =>
        prev
          ? {
              ...prev,
              category: selectedCategory,
              categories: selectedCategories,
            }
          : null
      );
    }
    setTailorSaving(false);
  };

  const handleDisableTailoring = async () => {
    if (!brand || !tailor) return;

    setDisableTailoring(true);
    try {
      const { error } = await supabase
        .from("tailors")
        .delete()
        .eq("id", tailor.id);

      if (error) {
        toast.error("Failed to disable tailoring");
      } else {
        toast.success("Tailoring disabled successfully");
        setTailor(null);
        setTailorSpecialties([]);
        setTailorPriceRange("");
        setTailorConsultationFee("");
        setTailorLeadTime("");
        tailoringEvent.notify();
      }
    } catch (error) {
      console.error("Error disabling tailoring:", error);
      toast.error("Failed to disable tailoring");
    } finally {
      setDisableTailoring(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    if (name === "name" && value.length > BRAND_NAME_LIMIT) {
      return;
    }
    if (name === "description" && value.length > SHORT_DESCRIPTION_LIMIT) {
      return;
    }

    if (brand) {
      setBrand({ ...brand, [name]: value });
    }
  };

  const handleCategoriesChange = (categories: string[]) => {
    if (brand) {
      setBrand({
        ...brand,
        categories,
        category: categories[0] || brand.category,
      });
    }
  };

  const handleImageUpload = (url: string) => {
    setImageUrl(url);
    setImageUploading(false);
    setImageUploadProgress(0);
    brandEditDevLog("Image URL updated:", url);
  };

  const handleVerifiedToggle = () => {
    if (brand) {
      setBrand({ ...brand, is_verified: !brand.is_verified });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brand || !user) {
      toast.error("You must be logged in to update a brand");
      return;
    }

    let priceRange: string;
    if (priceMin && priceMax && currency && currency !== "NONE") {
      const selectedCurrency = STUDIO_CURRENCIES.find((c) => c.code === currency);
      const symbol = selectedCurrency?.symbol || "$";
      priceRange = `${symbol}${priceMin} - ${symbol}${priceMax}`;
    } else {
      priceRange = "Explore brand for prices";
    }

    setSaving(true);
    try {
      const updateData = {
        name: brand.name,
        description: formatBrandDescription(brand.description || ""),
        long_description: formatBrandDescription(brand.long_description || ""),
        category: brand.category,
        categories: brand.categories,
        location: brand.location,
        price_range: priceRange,
        currency,
        website: brand.website,
        instagram: brand.instagram,
        whatsapp: brand.whatsapp,
        founded_year: brand.founded_year,
        is_verified: brand.is_verified,
        contact_email: brand.contact_email,
        image: imageUrl,
        video_url: brand.video_url,
        video_thumbnail: brand.video_thumbnail,
      };

      brandEditDevLog("Submitting brand update:", updateData);

      const response = await fetch(`/api/studio/brands/${brand.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      const result = await response.json();
      brandEditDevLog("Brand update response status:", response.status);

      if (!response.ok) {
        throw new Error(
          result.error || `Failed to update brand (${response.status})`
        );
      }

      if (result.nameChanged) {
        toast.success(
          "Brand updated successfully! Name changes have been propagated across all connections."
        );
      } else {
        toast.success("Brand updated successfully");
      }

      if (result.brand) {
        setBrand(result.brand as Brand);
      }
    } catch (error) {
      console.error("Error updating brand:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update brand"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!brand || !user) {
      toast.error("You must be logged in to delete a brand");
      return;
    }

    setDeleting(true);
    try {
      await deleteBrand(user.id, brand.id);
      toast.success("Brand deleted successfully");
      router.push("/studio/brands");
    } catch (error) {
      console.error("Error deleting brand:", error);
      toast.error("Failed to delete brand");
      setDeleting(false);
    }
  };

  const displayedCategories = (brand?.categories || []).filter(
    (cat) => cat !== "High End Fashion Brands"
  );

  return {
    router,
    brand,
    loading,
    saving,
    deleting,
    errorMsg,
    imageUrl,
    imageUploading,
    imageUploadProgress,
    setImageUploading,
    setImageUploadProgress,
    tailor,
    tailorModalOpen,
    setTailorModalOpen,
    tailorSpecialties,
    setTailorSpecialties,
    tailorPriceRange,
    setTailorPriceRange,
    tailorConsultationFee,
    setTailorConsultationFee,
    tailorLeadTime,
    setTailorLeadTime,
    tailorSaving,
    handleTailorSave,
    disableTailoring,
    handleDisableTailoring,
    priceMin,
    setPriceMin,
    priceMax,
    setPriceMax,
    currency,
    setCurrency,
    selectedCategory,
    setSelectedCategory,
    selectedCategories,
    setSelectedCategories,
    handleChange,
    handleCategoriesChange,
    handleImageUpload,
    handleImageUploadStart: () => {
      setImageUploading(true);
      setImageUploadProgress(0);
    },
    handleImageUploadProgress: (progress: number) => {
      setImageUploadProgress(progress);
    },
    handleVerifiedToggle,
    handleSubmit,
    handleDelete,
    displayedCategories,
    setBrand,
    STUDIO_CURRENCIES,
    SHORT_DESCRIPTION_LIMIT,
    BRAND_NAME_LIMIT,
  };
}

export type BrandEditorApi = ReturnType<typeof useBrandEditor>;

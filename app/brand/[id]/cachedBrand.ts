import { cache } from "react";
import { getBrandById } from "@/lib/services/brandService";

/** Deduplicates brand fetch when generateMetadata and the page run in the same request. */
export const getCachedBrandById = cache((id: string) => getBrandById(id));

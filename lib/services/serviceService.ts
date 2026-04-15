import { createProduct } from "@/lib/services/productService";
import { Product } from "@/lib/supabase";

export type StudioServiceType =
  | "consultation"
  | "alterations"
  | "custom_design"
  | "fitting";

type CreateServiceInput = Omit<
  Product,
  "id" | "created_at" | "updated_at" | "service_type"
> & {
  /** UI-level service subtype used for studio workflows. */
  service_type: StudioServiceType;
};

function toProductServiceType(
  serviceType: StudioServiceType
): Product["service_type"] {
  if (serviceType === "consultation") return "consultation";
  return "service";
}

/**
 * Service-facing wrapper over product persistence.
 * Keeps service-specific UI code from depending on product naming.
 */
export async function createService(
  serviceData: CreateServiceInput
): Promise<Product | null> {
  return createProduct({
    ...serviceData,
    service_type: toProductServiceType(serviceData.service_type),
  });
}

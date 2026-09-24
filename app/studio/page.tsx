import { redirect } from "next/navigation";
import { getAllEditions } from "@/lib/data/editions";
import { getAdminClient } from "@/lib/supabase-admin";
import { countStudioApplications } from "@/lib/studio/applicationCounts";
import { getStudioSession } from "@/lib/studio/session";
import { StudioHomeOverview } from "@/components/studio/StudioHomeOverview";
import { BlurIn } from "@/components/studio/BlurIn";
import { StudioRecentAccountsCard } from "./StudioRecentAccountsCard";
import { getAllEditionLineupBrands } from "@/lib/services/editionLineupService";
import { getAllBrands } from "@/lib/services/brandService";
import { findMissingLineupImages } from "@/lib/editions/missingLineupImages";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function countBrands(
  supabase: Awaited<ReturnType<typeof getStudioSession>>["supabase"],
): Promise<number | null> {
  const { count, error } = await supabase
    .from("brands")
    .select("id", { count: "exact", head: true });
  if (error) {
    console.error("[studio] brand count:", error.message);
    return null;
  }
  return count ?? 0;
}

async function countApplications() {
  const admin = await getAdminClient();
  return admin ? countStudioApplications(admin) : null;
}

/**
 * Studio home, rendered on the server: the counts arrive with the page
 * instead of loading after it opens. (The layout has already checked that
 * the viewer may use Studio.)
 */
export default async function StudioPage() {
  const { supabase, user, profile } = await getStudioSession();
  if (!user) redirect("/login?redirect_to=%2Fstudio");

  const role = profile?.role ?? null;
  if (role === "brand_admin") redirect("/studio/brands");
  const isSuperAdmin = role === "super_admin";

  const [brands, applications, missingLineupPhotos] = await Promise.all([
    countBrands(supabase),
    // Application counts use the service role, so only super admins get them.
    isSuperAdmin ? countApplications() : Promise.resolve(null),
    isSuperAdmin
      ? Promise.all([
          getAllEditionLineupBrands(supabase),
          getAllBrands(false, true),
        ]).then(([lineupRows, allBrands]) =>
          findMissingLineupImages(lineupRows, allBrands),
        )
      : Promise.resolve([]),
  ]);

  return (
    <div className="mx-auto max-w-7xl space-y-10 px-4 py-8 sm:px-6 sm:py-10">
      <BlurIn>
        <header className="mx-auto max-w-2xl text-center">
          <h1 className="mb-3 font-canela text-3xl tracking-tight text-gray-900 sm:text-4xl">
            Welcome to OmaHub Studio
          </h1>
          <p className="text-base leading-relaxed text-gray-600 sm:text-lg">
            Manage brands, editions, and the live homepage from one place
          </p>
        </header>
      </BlurIn>

      {isSuperAdmin && missingLineupPhotos.length > 0 && (
        <BlurIn>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-950">
            <p className="font-medium">
              {missingLineupPhotos.length} lineup{" "}
              {missingLineupPhotos.length === 1 ? "brand is" : "brands are"}{" "}
              hidden on the public site until a photo is added.
            </p>
            <ul className="mt-2 space-y-1">
              {missingLineupPhotos.map((item) => (
                <li key={`${item.editionSlug}-${item.brandId}`}>
                  <Link
                    href={`/studio/editions/${item.editionSlug}`}
                    className="underline underline-offset-2 hover:text-amber-800"
                  >
                    {item.brandName}
                  </Link>{" "}
                  on {item.editionSlug}
                </li>
              ))}
            </ul>
          </div>
        </BlurIn>
      )}

      <div className="grid grid-cols-1 gap-8">
        <StudioHomeOverview
          counts={{
            brands,
            editions: getAllEditions().length,
            applications: applications?.total ?? null,
            newApplications: applications?.new ?? null,
          }}
        />

        {isSuperAdmin && <StudioRecentAccountsCard />}
      </div>
    </div>
  );
}

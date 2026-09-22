import { redirect } from "next/navigation";
import { getAllEditions } from "@/lib/data/editions";
import { getAdminClient } from "@/lib/supabase-admin";
import { countStudioApplications } from "@/lib/studio/applicationCounts";
import { getStudioSession } from "@/lib/studio/session";
import { StudioHomeOverview } from "@/components/studio/StudioHomeOverview";
import { BlurIn } from "@/components/studio/BlurIn";
import { StudioRecentAccountsCard } from "./StudioRecentAccountsCard";

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

  const [brands, applications] = await Promise.all([
    countBrands(supabase),
    // Application counts use the service role, so only super admins get them.
    isSuperAdmin ? countApplications() : Promise.resolve(null),
  ]);

  return (
    <div className="mx-auto max-w-7xl space-y-10 px-4 py-8 sm:px-6 sm:py-10">
      <BlurIn>
        <header className="mx-auto max-w-2xl text-center">
          <h1 className="mb-3 font-canela text-3xl tracking-tight text-omahub-primary sm:text-4xl">
            Welcome to OmaHub Studio
          </h1>
          <p className="text-base leading-relaxed text-omahub-secondary sm:text-lg">
            Manage brands, editions, and the live homepage from one place
          </p>
        </header>
      </BlurIn>

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

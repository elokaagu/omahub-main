import { redirect } from "next/navigation";
import { getAdminClient } from "@/lib/supabase-admin";
import { getStudioSession } from "@/lib/studio/session";
import { loadStudioApplications } from "@/lib/studio/loadStudioApplications";
import { ApplicationsManager } from "./ApplicationsManager";
import type { DesignerApplication } from "./types";

export const dynamic = "force-dynamic";

/** Designer applications, loaded on the server (super admins only). */
export default async function ApplicationsPage() {
  const { profile } = await getStudioSession();
  if (profile?.role !== "super_admin") redirect("/studio");

  let applications: DesignerApplication[] = [];
  let error: string | null = null;
  try {
    const admin = await getAdminClient();
    if (!admin) throw new Error("Admin client unavailable");
    applications = (await loadStudioApplications(
      admin,
    )) as DesignerApplication[];
  } catch (err) {
    console.error("[studio/applications]", err);
    error = "Failed to fetch applications";
  }

  return (
    <ApplicationsManager
      initialApplications={applications}
      initialError={error}
    />
  );
}

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-unified";
import { requireSuperAdmin } from "@/lib/auth/requireSuperAdmin";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

type RepairResult = {
  brands: number;
  collections: number;
  products: number;
  profiles: number;
  total: number;
  dryRun: boolean;
};

let repairInProgress = false;

function makeStorageUrl(folder: string, fileName: string) {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/brand-assets/${folder}/${fileName}`;
}

async function repairTableField(
  admin: ReturnType<typeof createAdminClient>,
  table: "brands" | "collections" | "products",
  field: "image",
  folder: string,
  dryRun: boolean
) {
  const { data, error } = await admin.from(table).select(`id, ${field}`);
  if (error || !data) return 0;

  let fixed = 0;
  for (const row of data as Array<{ id: string; image: string | null }>) {
    if (!row.image || !row.image.includes("/lovable-uploads/")) continue;
    const fileName = row.image.split("/").pop();
    if (!fileName) continue;

    fixed++;
    if (dryRun) continue;

    const newUrl = makeStorageUrl(folder, fileName);
    await admin.from(table).update({ [field]: newUrl }).eq("id", row.id);
  }
  return fixed;
}

async function repairProfileAvatars(
  admin: ReturnType<typeof createAdminClient>,
  dryRun: boolean
) {
  const { data, error } = await admin.from("profiles").select("id, avatar_url");
  if (error || !data) return 0;

  let fixed = 0;
  for (const row of data as Array<{ id: string; avatar_url: string | null }>) {
    if (!row.avatar_url || !row.avatar_url.includes("/lovable-uploads/")) continue;
    const fileName = row.avatar_url.split("/").pop();
    if (!fileName) continue;

    fixed++;
    if (dryRun) continue;

    const newUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${fileName}`;
    await admin.from("profiles").update({ avatar_url: newUrl }).eq("id", row.id);
  }
  return fixed;
}

function maintenanceEnabled() {
  return process.env.NODE_ENV !== "production" || process.env.ENABLE_REPAIR_IMAGES_ENDPOINT === "true";
}

export async function OPTIONS() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function POST(request: NextRequest) {
  if (!maintenanceEnabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const auth = await requireSuperAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  if (repairInProgress) {
    return NextResponse.json(
      { error: "Image repair already in progress" },
      { status: 409 }
    );
  }

  let dryRun = false;
  try {
    const body = await request.json().catch(() => ({}));
    dryRun = Boolean((body as { dryRun?: boolean }).dryRun);
  } catch {
    dryRun = false;
  }

  repairInProgress = true;
  try {
    const admin = createAdminClient();

    const result: RepairResult = {
      brands: await repairTableField(admin, "brands", "image", "brands", dryRun),
      collections: await repairTableField(
        admin,
        "collections",
        "image",
        "collections",
        dryRun
      ),
      products: await repairTableField(admin, "products", "image", "products", dryRun),
      profiles: await repairProfileAvatars(admin, dryRun),
      total: 0,
      dryRun,
    };
    result.total =
      result.brands + result.collections + result.products + result.profiles;

    return NextResponse.json({
      success: true,
      message: dryRun ? "Dry run completed" : "Image repair completed",
      result,
    });
  } catch (error) {
    console.error(
      "repair_images_failed",
      error instanceof Error ? error.message : String(error)
    );
    return NextResponse.json(
      { success: false, error: "Image repair failed" },
      { status: 500 }
    );
  } finally {
    repairInProgress = false;
  }
}

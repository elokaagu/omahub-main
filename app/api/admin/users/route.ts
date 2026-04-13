import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth/requireSuperAdmin";
import { findAuthUserIdByEmail } from "@/lib/services/adminAuthLookup";
import { createAdminClient } from "@/lib/supabase-unified";
import {
  adminUserUpsertBodySchema,
  parseAdminUserDeleteQuery,
  parseAdminUsersListQuery,
  sanitizeIlikeSearch,
} from "@/lib/validation/adminUsers";

export const dynamic = "force-dynamic";

function jsonValidationError(error: { flatten: () => unknown }) {
  return NextResponse.json(
    { error: "Invalid request", details: error.flatten() },
    { status: 400 }
  );
}

async function tryBroadcastProfileUpdate(
  adminDb: ReturnType<typeof createAdminClient>,
  updatedUser: {
    id: string;
    email: string | null;
    role: string | null;
    owned_brands: string[] | null;
    updated_at: string | null;
  },
  currentAdminId: string
) {
  if (updatedUser.id === currentAdminId) return;
  try {
    await adminDb
      .channel(`profile_updates_${updatedUser.id}`)
      .send({
        type: "broadcast",
        event: "profile_updated",
        payload: {
          user_id: updatedUser.id,
          email: updatedUser.email,
          role: updatedUser.role,
          owned_brands: updatedUser.owned_brands,
          updated_at: updatedUser.updated_at,
          trigger: "admin_update",
        },
      });
  } catch (e) {
    console.warn("admin/users: profile broadcast failed:", e);
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireSuperAdmin();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const parsed = parseAdminUsersListQuery(
      new URL(request.url).searchParams
    );
    if (!parsed.success) {
      return jsonValidationError(parsed.error);
    }

    const { page, limit, search, role: roleFilter } = parsed.data;
    const offset = (page - 1) * limit;

    let adminDb;
    try {
      adminDb = createAdminClient();
    } catch {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 503 }
      );
    }

    let query = adminDb
      .from("profiles")
      .select("id, email, role, owned_brands, created_at, updated_at", {
        count: "exact",
      });

    if (search && search.length > 0) {
      const safe = sanitizeIlikeSearch(search);
      query = query.ilike("email", `%${safe}%`);
    }
    if (roleFilter) {
      query = query.eq("role", roleFilter);
    }

    query = query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: users, error: usersError, count } = await query;

    if (usersError) {
      console.error(
        "admin/users GET:",
        usersError.code,
        usersError.message
      );
      return NextResponse.json(
        { error: "Failed to fetch users" },
        { status: 500 }
      );
    }

    const totalCount = count ?? 0;
    const totalPages = Math.ceil(totalCount / limit) || 1;

    return NextResponse.json({
      users: users ?? [],
      totalCount,
      totalPages,
      currentPage: page,
      limit,
    });
  } catch (error) {
    console.error("GET /api/admin/users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireSuperAdmin();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = adminUserUpsertBodySchema.safeParse(body);
    if (!parsed.success) {
      return jsonValidationError(parsed.error);
    }

    const { email, role, owned_brands } = parsed.data;

    let adminDb;
    try {
      adminDb = createAdminClient();
    } catch {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 503 }
      );
    }

    let finalOwnedBrands: string[] = [];

    if (role === "super_admin") {
      const { data: allBrands, error: brandsError } = await adminDb
        .from("brands")
        .select("id");

      if (brandsError) {
        console.error(
          "admin/users POST: brands fetch failed:",
          brandsError.code,
          brandsError.message
        );
        return NextResponse.json(
          { error: "Failed to fetch brands for super admin assignment" },
          { status: 500 }
        );
      }
      finalOwnedBrands = (allBrands ?? []).map((b: { id: string }) => b.id);
    } else {
      finalOwnedBrands = owned_brands ?? [];
    }

    const { data: existingRows, error: checkError } = await adminDb
      .from("profiles")
      .select("id, email")
      .ilike("email", email)
      .limit(2);

    if (checkError) {
      console.error(
        "admin/users POST: existing check failed:",
        checkError.code,
        checkError.message
      );
      return NextResponse.json(
        { error: "Error checking if user exists" },
        { status: 500 }
      );
    }

    if (existingRows && existingRows.length > 1) {
      return NextResponse.json(
        { error: "Multiple profiles match this email" },
        { status: 409 }
      );
    }

    const existingUser = existingRows?.[0];

    const { count: brandCount } = await adminDb
      .from("brands")
      .select("id", { count: "exact", head: true });

    const validateSuperAdminBrands = () => {
      if (role !== "super_admin") return true;
      if (brandCount == null) return true;
      return finalOwnedBrands.length === brandCount;
    };

    if (existingUser) {
      const { data: updatedUser, error: updateError } = await adminDb
        .from("profiles")
        .update({
          role,
          owned_brands: finalOwnedBrands,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingUser.id)
        .select()
        .single();

      if (updateError) {
        console.error(
          "admin/users POST: update failed:",
          updateError.code,
          updateError.message
        );
        return NextResponse.json(
          { error: "Failed to update user" },
          { status: 500 }
        );
      }

      if (!validateSuperAdminBrands()) {
        console.error(
          "admin/users POST: super_admin brand count mismatch",
          finalOwnedBrands.length,
          brandCount
        );
        return NextResponse.json(
          { error: "Super admin brand assignment validation failed" },
          { status: 500 }
        );
      }

      await tryBroadcastProfileUpdate(adminDb, updatedUser, auth.userId);

      return NextResponse.json({
        user: updatedUser,
        action: "updated" as const,
        autoAssignedBrands:
          role === "super_admin" ? finalOwnedBrands.length : 0,
        profileRefreshTriggered: updatedUser.id !== auth.userId,
        validation: role === "super_admin" ? "passed" : "not_applicable",
      });
    }

    const authUserId = await findAuthUserIdByEmail(adminDb, email);
    if (!authUserId) {
      return NextResponse.json(
        {
          error:
            "No authentication account exists for this email. The user must sign up before a profile can be created.",
          code: "AUTH_USER_REQUIRED",
        },
        { status: 400 }
      );
    }

    const { data: profileByAuthId } = await adminDb
      .from("profiles")
      .select("id")
      .eq("id", authUserId)
      .maybeSingle();

    if (profileByAuthId) {
      const { data: updatedUser, error: updateError } = await adminDb
        .from("profiles")
        .update({
          email,
          role,
          owned_brands: finalOwnedBrands,
          updated_at: new Date().toISOString(),
        })
        .eq("id", authUserId)
        .select()
        .single();

      if (updateError) {
        console.error(
          "admin/users POST: update by auth id failed:",
          updateError.code,
          updateError.message
        );
        return NextResponse.json(
          { error: "Failed to update user" },
          { status: 500 }
        );
      }

      if (!validateSuperAdminBrands()) {
        return NextResponse.json(
          { error: "Super admin brand assignment validation failed" },
          { status: 500 }
        );
      }

      await tryBroadcastProfileUpdate(adminDb, updatedUser, auth.userId);

      return NextResponse.json({
        user: updatedUser,
        action: "updated" as const,
        autoAssignedBrands:
          role === "super_admin" ? finalOwnedBrands.length : 0,
        profileRefreshTriggered: updatedUser.id !== auth.userId,
        validation: role === "super_admin" ? "passed" : "not_applicable",
      });
    }

    const { data: newUser, error: createError } = await adminDb
      .from("profiles")
      .insert({
        id: authUserId,
        email,
        role,
        owned_brands: finalOwnedBrands,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (createError) {
      console.error(
        "admin/users POST: insert failed:",
        createError.code,
        createError.message
      );
      return NextResponse.json(
        { error: "Failed to create user profile" },
        { status: 500 }
      );
    }

    if (!validateSuperAdminBrands()) {
      return NextResponse.json(
        { error: "Super admin brand assignment validation failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      user: newUser,
      action: "created" as const,
      autoAssignedBrands:
        role === "super_admin" ? finalOwnedBrands.length : 0,
      validation: role === "super_admin" ? "passed" : "not_applicable",
    });
  } catch (error) {
    console.error("POST /api/admin/users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireSuperAdmin();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const parsed = parseAdminUserDeleteQuery(
      new URL(request.url).searchParams
    );
    if (!parsed.success) {
      return jsonValidationError(parsed.error);
    }
    const userId = parsed.data.id;

    if (userId === auth.userId) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 400 }
      );
    }

    let adminDb;
    try {
      adminDb = createAdminClient();
    } catch {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 503 }
      );
    }

    const { data: userToDelete, error: getUserError } = await adminDb
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (getUserError || !userToDelete) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { error: authDeleteError } =
      await adminDb.auth.admin.deleteUser(userId);

    if (authDeleteError) {
      console.error(
        "admin/users DELETE: auth delete failed:",
        authDeleteError.message
      );
      return NextResponse.json(
        { error: "Failed to delete user from authentication system" },
        { status: 500 }
      );
    }

    const { error: profileDeleteError } = await adminDb
      .from("profiles")
      .delete()
      .eq("id", userId);

    if (profileDeleteError) {
      console.warn(
        "admin/users DELETE: profile cleanup:",
        profileDeleteError.code,
        profileDeleteError.message
      );
    }

    return NextResponse.json({
      success: true,
      message: "User has been removed from authentication and profile data.",
      deletedUserId: userId,
    });
  } catch (error) {
    console.error("DELETE /api/admin/users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

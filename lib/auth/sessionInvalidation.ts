import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

const SESSION_INVALID_BODY = {
  error: "Session invalid. Please sign in again.",
} as const;

/** Detect likely broken JWT / access token from `getUser()` errors. */
export function isJwtLikeAuthError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("jwt") ||
    m.includes("token") ||
    m.includes("malformed") ||
    m.includes("expired") ||
    m.includes("invalid claim")
  );
}

/** Best-effort server sign-out so SSR cookie adapter clears Supabase cookies. */
export async function signOutServerSafe(
  supabase: Pick<SupabaseClient, "auth">
): Promise<void> {
  try {
    await supabase.auth.signOut();
  } catch {
    // ignore — response still tells client to re-authenticate
  }
}

/**
 * 401 after corrupted session: clears auth cookies via signOut when possible,
 * then asks the browser to drop site cookies. Avoids hard-coded `sb-*` names
 * that do not match `@supabase/ssr` project-scoped cookies.
 */
export async function corruptedSessionResponse(
  supabase: Pick<SupabaseClient, "auth">
): Promise<NextResponse> {
  await signOutServerSafe(supabase);
  return NextResponse.json(SESSION_INVALID_BODY, {
    status: 401,
    headers: {
      "Clear-Site-Data": '"cookies"',
    },
  });
}

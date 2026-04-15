import type { ReactNode } from "react";
import { createServerSupabaseClient } from "@/lib/supabase-unified";
import StudioLayoutClient from "./StudioLayoutClient";
import type { Database } from "@/lib/types/supabase";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type StudioInitialUser = {
  id: string;
  email: string | null;
  role?: Profile["role"] | null;
  owned_brands?: string[] | null;
};

export default async function StudioLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError) {
    console.error("[studio/layout] auth.getUser failed:", authError.message);
  }

  let initialProfile: Profile | null = null;
  let initialUser: StudioInitialUser | null = null;

  if (user) {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    if (profileError) {
      console.error(
        "[studio/layout] profiles lookup failed:",
        profileError.message
      );
    }

    initialProfile = profile ?? null;
    initialUser = {
      id: user.id,
      email: user.email ?? null,
      role: initialProfile?.role ?? null,
      owned_brands: initialProfile?.owned_brands ?? null,
    };
  }

  return (
    <StudioLayoutClient
      initialProfile={initialProfile}
      initialUser={initialUser}
    >
      {children}
    </StudioLayoutClient>
  );
}


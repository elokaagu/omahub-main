import type { ReactNode } from "react";
import { createServerSupabaseClient } from "@/lib/supabase-unified";
import StudioLayoutClient from "./StudioLayoutClient";
import type { Database } from "@/lib/types/supabase";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export default async function StudioLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let initialProfile: Profile | null = null;
  let initialUser:
    | {
        id: string;
        email: string | null;
        role?: Profile["role"] | null;
        owned_brands?: string[] | null;
      }
    | null = null;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, email, role, owned_brands, first_name, last_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle();

    initialProfile = (profile as Profile) ?? null;
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


import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import InboxClient from "./InboxClient";

export default async function InboxPage() {
  const supabase = createServerComponentClient({ cookies });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user profile to check permissions
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, owned_brands")
    .eq("id", user.id)
    .single();

  if (!profile || !["super_admin", "brand_admin"].includes(profile.role)) {
    redirect("/studio");
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Studio Inbox</h1>
        <p className="mt-2 text-gray-600">
          Manage customer inquiries and messages
        </p>
      </div>

      <InboxClient userProfile={profile} />
    </div>
  );
}

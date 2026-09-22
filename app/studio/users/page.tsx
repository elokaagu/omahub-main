import { redirect } from "next/navigation";
import { getStudioSession } from "@/lib/studio/session";
import { loadStudioUsers } from "@/lib/studio/loadStudioUsers";
import { StudioLoadError } from "@/components/studio/StudioLoadError";
import { UsersManager } from "./UsersManager";

export const dynamic = "force-dynamic";

/** Studio user management. Users and brand options load on the server. */
export default async function UsersPage() {
  const { profile } = await getStudioSession();
  if (profile?.role !== "super_admin") redirect("/studio");

  let data: Awaited<ReturnType<typeof loadStudioUsers>>;
  try {
    data = await loadStudioUsers();
  } catch (error) {
    console.error("[studio/users]", error);
    return (
      <StudioLoadError message="We couldn’t load users. Please try again." />
    );
  }

  return <UsersManager users={data.users} brandOptions={data.brandOptions} />;
}

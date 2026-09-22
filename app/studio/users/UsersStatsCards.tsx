import type { LucideIcon } from "lucide-react";
import { Shield, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { UserWithBrands } from "./types";

function StatCard({
  title,
  value,
  icon: Icon,
  accent,
  note,
}: {
  title: string;
  value: number;
  icon: LucideIcon;
  accent: string;
  note?: string;
}) {
  return (
    <Card className={`border-l-4 ${accent} border-oma-beige`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-black">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-oma-cocoa" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-canela text-oma-plum">{value}</div>
        {note && <p className="text-xs text-oma-cocoa/60 mt-1">{note}</p>}
      </CardContent>
    </Card>
  );
}

/** Four summary cards; counts reflect the current search/role filter. */
export function UsersStatsCards({
  filteredUsers,
  totalCount,
  roleFilter,
}: {
  filteredUsers: UserWithBrands[];
  totalCount: number;
  roleFilter: string;
}) {
  const countRole = (role: string) =>
    filteredUsers.filter((u) => u.role === role).length;

  return (
    <>
      <StatCard
        title={roleFilter === "all" ? "Total Users" : "Filtered Users"}
        value={filteredUsers.length}
        icon={Users}
        accent="border-l-oma-plum"
        note={roleFilter !== "all" ? `of ${totalCount} total` : undefined}
      />
      <StatCard
        title="Brand Admins"
        value={countRole("brand_admin")}
        icon={Shield}
        accent="border-l-blue-500"
      />
      <StatCard
        title="Regular Users"
        value={countRole("user")}
        icon={Users}
        accent="border-l-green-500"
      />
      <StatCard
        title="Super Admins"
        value={countRole("super_admin")}
        icon={Shield}
        accent="border-l-red-500"
      />
    </>
  );
}

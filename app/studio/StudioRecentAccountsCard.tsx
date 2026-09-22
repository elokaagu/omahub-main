"use client";

import dynamic from "next/dynamic";
import { Card, CardContent } from "@/components/ui/card";
import { BlurIn } from "@/components/studio/BlurIn";

const RecentAccountsWidget = dynamic(
  () => import("@/app/studio/dashboard/RecentAccountsWidget"),
  {
    loading: () => <div className="h-32 animate-pulse rounded-lg bg-gray-100" />,
    ssr: false,
  },
);

/** Super-admin "recent accounts" card on Studio home (loads client-side). */
export function StudioRecentAccountsCard() {
  return (
    <BlurIn delay={0.16}>
      <Card className="overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
        <CardContent className="bg-white px-5 py-6 sm:px-8 sm:py-8">
          <RecentAccountsWidget />
        </CardContent>
      </Card>
    </BlurIn>
  );
}

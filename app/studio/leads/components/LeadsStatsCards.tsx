"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import type { LeadStats } from "../types";

type LeadsStatsCardsProps = {
  leadStats: LeadStats;
  statsError: string | null;
  onRetryStats: () => void;
  statsRefreshing?: boolean;
};

export function LeadsStatsCards({
  leadStats,
  statsError,
  onRetryStats,
  statsRefreshing,
}: LeadsStatsCardsProps) {
  return (
    <div className="mb-8 space-y-4">
      {statsError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <span>{statsError}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-current shrink-0 w-fit"
              onClick={() => onRetryStats()}
              disabled={statsRefreshing}
            >
              Retry analytics
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border border-oma-gold/10 bg-white">
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-oma-plum">
                {leadStats.total_leads}
              </h3>
              <p className="text-sm text-oma-cocoa">Total Leads</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-oma-gold/10 bg-white">
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-oma-plum">
                {leadStats.qualified_leads}
              </h3>
              <p className="text-sm text-oma-cocoa">Qualified Leads</p>
              <p className="text-xs text-oma-cocoa/70">Ready for follow-up</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-oma-gold/10 bg-white">
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-oma-plum">
                {leadStats.conversion_rate}%
              </h3>
              <p className="text-sm text-oma-cocoa">Conversion Rate</p>
              <p className="text-xs text-oma-cocoa/70">
                Converted: {leadStats.converted_leads}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-oma-gold/10 bg-white">
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-oma-plum">
                {leadStats.total_bookings}
              </h3>
              <p className="text-sm text-oma-cocoa">Total Bookings</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

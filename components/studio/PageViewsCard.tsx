import { useEffect, useState, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

function estimatePageViews({
  totalBrands = 0,
  totalReviews = 0,
  totalProducts = 0,
} = {}) {
  // Simple estimation formula
  return Math.max(
    totalBrands * 150 + totalReviews * 25 + totalProducts * 10,
    1000
  );
}

export default function PageViewsCard({
  totalBrands = 0,
  totalReviews = 0,
  totalProducts = 0,
}) {
  const [pageViews, setPageViews] = useState<number | null>(null);
  const [isReal, setIsReal] = useState(false);
  const [loading, setLoading] = useState(true);

  const estimated = estimatePageViews({
    totalBrands,
    totalReviews,
    totalProducts,
  });

  const fetchPageViews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/analytics/pageviews");
      const data = await res.json();
      if (res.ok && typeof data.pageViews === "number" && data.pageViews > 0) {
        setPageViews(data.pageViews);
        setIsReal(true);
      } else {
        setPageViews(null);
        setIsReal(false);
      }
    } catch {
      setPageViews(null);
      setIsReal(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPageViews();
    // Only run on mount
  }, [fetchPageViews]);

  return (
    <Card className="border border-oma-gold/10 bg-white">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-oma-cocoa">
          Page Views
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={fetchPageViews}
          disabled={loading}
          aria-label="Refresh Page Views"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-8 bg-oma-beige rounded w-1/2 animate-pulse mb-2" />
        ) : (
          <div className="text-2xl font-canela text-oma-plum">
            {isReal && pageViews !== null
              ? pageViews.toLocaleString()
              : estimated.toLocaleString() + "*"}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

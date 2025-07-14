import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Eye, RefreshCw, AlertTriangle } from "lucide-react";
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
  const [source, setSource] = useState<string>("estimated");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const estimated = estimatePageViews({
    totalBrands,
    totalReviews,
    totalProducts,
  });

  const fetchPageViews = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/analytics/pageviews");
      const data = await res.json();
      if (res.ok && typeof data.pageViews === "number" && data.pageViews > 0) {
        setPageViews(data.pageViews);
        setSource(data.source || "vercel");
      } else {
        setPageViews(null);
        setSource("estimated");
        setError("Real analytics unavailable, showing estimate.");
      }
    } catch (err) {
      setPageViews(null);
      setSource("estimated");
      setError("Failed to fetch analytics, showing estimate.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPageViews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Card className="border border-oma-gold/10 bg-white">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-oma-cocoa flex items-center gap-2">
          <Eye className="h-4 w-4 text-oma-plum" />
          Page Views
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={fetchPageViews}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-8 bg-oma-beige rounded w-1/2 animate-pulse mb-2" />
        ) : (
          <>
            <div className="text-2xl font-canela text-oma-plum">
              {pageViews !== null
                ? pageViews.toLocaleString()
                : estimated.toLocaleString() + "*"}
            </div>
            <p className="text-xs text-oma-cocoa mt-2">
              {source === "vercel" ? "Real analytics from Vercel" : ""}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

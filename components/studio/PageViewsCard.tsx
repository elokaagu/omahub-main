import { useEffect, useState, useCallback } from "react";

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
      const res = await fetch("/api/analytics/pageviews", {
        credentials: "include",
      });
      const data = await res.json();
      if (
        res.ok &&
        typeof data.pageViews === "number" &&
        data.source === "vercel"
      ) {
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
    <div className="flex min-h-[7.25rem] flex-col justify-center text-left">
      <h3 className="text-sm font-medium text-oma-cocoa">Page Views</h3>
      {loading ? (
        <div className="mt-2 h-8 w-1/2 min-w-[5rem] animate-pulse rounded bg-oma-beige/80" />
      ) : (
        <p className="mt-1 text-2xl font-canela tabular-nums text-oma-plum">
          {isReal && pageViews !== null
            ? pageViews.toLocaleString()
            : `${estimated.toLocaleString()}*`}
        </p>
      )}
      <p className="mt-1 text-sm leading-snug text-oma-cocoa">
        {isReal && pageViews !== null
          ? "Last 30 days (Vercel)"
          : "Estimated from catalogue size"}
      </p>
    </div>
  );
}

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export type CollectionEditUnavailableVariant = "missing" | "error";

type CollectionEditUnavailableProps = {
  variant: CollectionEditUnavailableVariant;
  /** Used when variant is "error". */
  detail?: string | null;
  onRetry?: () => void;
};

export function CollectionEditUnavailable({
  variant,
  detail,
  onRetry,
}: CollectionEditUnavailableProps) {
  const title =
    variant === "missing" ? "Collection Not Found" : "Couldn’t load collection";
  const body =
    variant === "missing"
      ? "The collection you are trying to edit could not be found. It may have been deleted or you might not have permission to access it."
      : detail?.trim() ||
        "Something went wrong while loading this collection. You can try again or return to the list.";

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 py-20">
      <h1 className="text-3xl font-canela text-gray-900 mb-4">{title}</h1>
      <p className="text-gray-500 mb-8 text-center max-w-md">{body}</p>
      <div className="flex flex-col sm:flex-row gap-3 items-center">
        {variant === "error" && onRetry ? (
          <Button type="button" variant="outline" onClick={onRetry}>
            Try again
          </Button>
        ) : null}
        <Button asChild className="bg-oma-plum hover:bg-oma-plum/90">
          <Link
            href="/studio/collections"
            className="inline-flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Collections
          </Link>
        </Button>
      </div>
    </div>
  );
}

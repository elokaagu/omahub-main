import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function BrandNotFound() {
  return (
    <div className="pt-16 pb-16 px-6 text-center">
      <h1 className="text-3xl font-canela text-gray-900 mb-4">
        Brand Not Found
      </h1>
      <p className="text-gray-600 mb-8">
        The brand you are looking for could not be found. It may have been
        removed or you might have followed an incorrect link.
      </p>
      <Button asChild className="bg-oma-plum hover:bg-oma-plum/90">
        <Link href="/studio/brands">Return to Brands</Link>
      </Button>
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ImageIcon } from "lucide-react";
import { useBrandEditor } from "./useBrandEditor";
import { BrandEditDetailsForm } from "./BrandEditDetailsForm";
import { BrandEditMediaPreviewColumn } from "./BrandEditMediaPreviewColumn";
import { BrandEditTailoringSection } from "./BrandEditTailoringSection";
import { useAuth } from "@/contexts/AuthContext";
import { brandIsListedInPublicDirectory } from "@/lib/brands/directoryListingImage";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { User } from "@/lib/services/authService";

function canSeeDirectoryListingStudioNotice(
  user: User | null,
  brandId: string
): boolean {
  const role = user?.role;
  if (!role) return false;
  if (role === "super_admin" || role === "admin") return true;
  if (role === "brand_admin") {
    return (user?.owned_brands ?? []).includes(brandId);
  }
  return false;
}

export default function BrandEditPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user } = useAuth();
  const editor = useBrandEditor(params.id);

  const { loading, errorMsg, brand } = editor;

  const showDirectoryImageNotice =
    !!brand &&
    !brandIsListedInPublicDirectory(brand) &&
    canSeeDirectoryListingStudioNotice(user, params.id);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="h-8 w-8 border-4 border-oma-plum border-t-transparent rounded-full" />
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">{errorMsg}</p>
        <Button asChild className="mt-4">
          <Link href="/studio/brands">Back to Brands</Link>
        </Button>
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Brand not found. Please try again.</p>
        <Button asChild className="mt-4">
          <Link href="/studio/brands">Back to Brands</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center mb-8">
        <Button variant="ghost" onClick={() => router.back()} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-canela text-gray-900">Edit Brand</h1>
      </div>

      {showDirectoryImageNotice ? (
        <Alert className="mb-6 sm:mb-8 border-oma-gold/35 bg-oma-beige/60 text-oma-cocoa shadow-sm">
          <ImageIcon className="h-4 w-4 text-oma-plum" aria-hidden />
          <AlertTitle className="text-oma-plum font-canela text-base">
            Not listed in the Brand Directory yet
          </AlertTitle>
          <AlertDescription className="text-oma-cocoa/90 text-sm mt-1">
            This profile is still visible at{" "}
            <Link
              href={`/brand/${params.id}`}
              className="font-medium text-oma-plum underline underline-offset-2 hover:text-oma-plum/90"
              target="_blank"
              rel="noopener noreferrer"
            >
              its public page
            </Link>
            , but it will not appear on the directory until a cover image is
            published here (upload brand images for this brand). Add at least
            one image so visitors see your work in the directory grid.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <BrandEditDetailsForm editor={editor} />
        </div>
        <div>
          <BrandEditMediaPreviewColumn editor={editor} />
          <BrandEditTailoringSection editor={editor} />
        </div>
      </div>
    </div>
  );
}

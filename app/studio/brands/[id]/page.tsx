"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useBrandEditor } from "./useBrandEditor";
import { BrandEditDetailsForm } from "./BrandEditDetailsForm";
import { BrandEditMediaPreviewColumn } from "./BrandEditMediaPreviewColumn";
import { BrandEditTailoringSection } from "./BrandEditTailoringSection";

export default function BrandEditPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const editor = useBrandEditor(params.id);

  const { loading, errorMsg, brand } = editor;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-oma-plum border-t-transparent rounded-full" />
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

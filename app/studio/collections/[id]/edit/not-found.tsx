"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function CatalogueNotFound() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center py-20">
      <h1 className="text-3xl font-canela text-gray-900 mb-4">
        Catalogue Not Found
      </h1>
      <p className="text-gray-500 mb-8 text-center max-w-md">
        The catalogue you are trying to edit could not be found. It may have
        been deleted or you might not have permission to access it.
      </p>
      <Button
        className="bg-oma-plum hover:bg-oma-plum/90 flex items-center gap-2"
        onClick={() => router.push("/studio/catalogues")}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Catalogues
      </Button>
    </div>
  );
}

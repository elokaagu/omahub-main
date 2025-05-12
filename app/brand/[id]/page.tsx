import { Button } from "@/components/ui/button";
import Link from "next/link";
import ClientBrandProfile from "@/app/brand/[id]/ClientBrandProfile";
import { brandsData } from "@/lib/data/brands";
import type { BrandData } from "@/lib/data/brands";

interface PageProps {
  params: {
    id: string;
  };
}

export async function generateStaticParams() {
  const brandIds = Object.keys(brandsData);
  return brandIds.map((id) => ({
    id: id,
  }));
}

export default function BrandProfile({ params }: PageProps) {
  const brandData = brandsData[params.id as keyof typeof brandsData];

  if (!brandData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-4">Brand Not Found</h1>
          <Button asChild>
            <Link href="/directory">Return to Directory</Link>
          </Button>
        </div>
      </div>
    );
  }

  return <ClientBrandProfile brandData={brandData} />;
}

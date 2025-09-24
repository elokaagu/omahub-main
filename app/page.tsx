import dynamic from "next/dynamic";
import { Loading } from "@/components/ui/loading";
import { StructuredData } from "@/components/seo/StructuredData";

// Dynamic import for client component
const HomeContent = dynamic(() => import("./HomeContent.tsx"), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center items-center min-h-screen">
      <Loading size="lg" />
    </div>
  ),
});

// This is a Server Component
export default function Home() {
  return (
    <>
      <StructuredData
        type="organization"
        data={{
          name: "OmaHub",
          description:
            "Premium fashion and tailoring platform connecting Africa's finest designers with a global audience",
          url: "https://www.oma-hub.com",
          logo: "https://www.oma-hub.com/logo.png",
        }}
      />
      <StructuredData
        type="website"
        data={{
          name: "OmaHub",
          url: "https://www.oma-hub.com",
          description: "Premium fashion and tailoring platform",
        }}
      />
      <main className="min-h-screen bg-gradient-to-b from-oma-beige/50 to-white">
        <HomeContent />
      </main>
    </>
  );
}

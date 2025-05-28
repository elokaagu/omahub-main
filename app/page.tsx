import { Suspense } from "react";
import HomeContent from "./HomeContent";
import { SectionHeader } from "@/components/ui/section-header";

// This is a Server Component
export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-oma-beige/50 to-white">
      <Suspense fallback={<div>Loading...</div>}>
        <HomeContent />
      </Suspense>
    </main>
  );
}

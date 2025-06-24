import dynamic from "next/dynamic";
import { Loading } from "@/components/ui/loading";

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
    <main className="min-h-screen bg-gradient-to-b from-oma-beige/50 to-white">
      <HomeContent />
    </main>
  );
}

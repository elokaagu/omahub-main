import TailoredClient from "./TailoredClient";
import Footer from "@/components/layout/Footer";

export default function TailoredPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        <TailoredClient />
      </main>
      <Footer />
    </div>
  );
}

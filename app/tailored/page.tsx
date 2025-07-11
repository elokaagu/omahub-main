import TailoredClient from "./TailoredClient";

export default function TailoredPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        <TailoredClient />
      </main>
    </div>
  );
}

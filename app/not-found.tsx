import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="pt-32 pb-16 px-6 text-center">
      <h1 className="heading-lg mb-4">Designer Not Found</h1>
      <p className="text-oma-cocoa mb-8">
        It seems you&apos;re looking for a designer that isn&apos;t in our
        directory.
      </p>
      <Button asChild className="bg-oma-plum hover:bg-oma-plum/90">
        <Link href="/directory">Browse All Designers</Link>
      </Button>
    </div>
  );
}

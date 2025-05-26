import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="pt-32 pb-16 px-6 text-center">
      <h1 className="heading-lg mb-4">Page Not Found</h1>
      <p className="text-oma-cocoa mb-8">
        Sorry, the page you are looking for does not exist or has been moved.
      </p>
      <Button asChild className="bg-oma-plum hover:bg-oma-plum/90">
        <Link href="/">Return to Home</Link>
      </Button>
    </div>
  );
}

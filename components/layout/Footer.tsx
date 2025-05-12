import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="bg-white">
      <div className="mx-auto max-w-7xl px-6 py-12 md:flex md:items-center md:justify-between lg:px-8">
        <div className="flex justify-center space-x-6 md:order-2">
          <Link href="/">
            <div className="flex items-center">
              <Image
                src="/brand/omahub-logo-black.png"
                alt="OmaHub Logo"
                width={90}
                height={25}
                className="h-6"
              />
            </div>
          </Link>
          <p className="text-center text-xs leading-5 text-gray-500">
            &copy; 2024 OmaHub. We&apos;re building Africa&apos;s fashion
            future.
          </p>
        </div>
      </div>
    </footer>
  );
}

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function StudioNav() {
  const pathname = usePathname();

  const navItems = [
    {
      href: "/studio/inbox",
      label: "Inbox",
      description: "Customer messages",
    },
    {
      href: "/studio/leads",
      label: "Leads",
      description: "Lead management",
    },
  ];

  return (
    <nav className="mb-8">
      <div className="flex space-x-1 bg-oma-beige/30 p-1 rounded-lg">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors text-center",
              pathname === item.href
                ? "bg-white text-oma-plum shadow-sm"
                : "text-oma-cocoa hover:text-oma-plum hover:bg-white/50"
            )}
          >
            <div>
              <div className="font-semibold">{item.label}</div>
              <div className="text-xs opacity-75">{item.description}</div>
            </div>
          </Link>
        ))}
      </div>
    </nav>
  );
}

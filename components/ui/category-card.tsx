import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { ArrowRight } from "lucide-react";

interface CategoryCardProps {
  title: string;
  image: string;
  href: string;
  customCta?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function CategoryCard({
  title,
  image,
  href,
  customCta,
  className,
  style,
}: CategoryCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative overflow-hidden rounded-2xl transition-all duration-500",
        className
      )}
      style={style}
    >
      <div className="aspect-square w-full">
        <img
          src={image}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 rounded-2xl"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent transition-opacity duration-500" />
        <div className="absolute bottom-0 left-0 p-6 w-full">
          <h3 className="font-suisse font-semibold text-xl text-white mb-2 tracking-wide">
            {title}
          </h3>
          <span className="block text-white/90 text-sm font-suisse mb-4 tracking-wider opacity-0 transform translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500">
            {customCta || "Discover More"}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="border-white/90 text-white bg-black/30 hover:bg-white hover:text-black opacity-0 transform translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500"
          >
            Explore <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </div>
      </div>
    </Link>
  );
}

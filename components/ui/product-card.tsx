import { NavigationLink } from "./navigation-link";
import { Badge } from "./badge";
import { AuthImage } from "./auth-image";
import { formatProductPrice } from "@/lib/utils/priceFormatter";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  id: string;
  title: string;
  image: string;
  price: number;
  sale_price?: number;
  category: string;
  brand?: {
    name: string;
    location?: string;
    price_range?: string;
    currency?: string;
  };
  className?: string;
}

export function ProductCard({
  id,
  title,
  image,
  price,
  sale_price,
  category,
  brand,
  className,
}: ProductCardProps) {
  const formattedPrice = formatProductPrice(
    { price, sale_price },
    brand
  );

  return (
    <NavigationLink
      href={`/product/${id}`}
      className={cn(
        "group block bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow h-full",
        className
      )}
    >
      <div className="aspect-square relative overflow-hidden">
        <AuthImage
          src={image}
          alt={title}
          width={400}
          height={400}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {sale_price && (
          <div className="absolute top-2 left-2">
            <Badge
              variant="secondary"
              className="bg-oma-plum text-white text-xs px-2 py-1"
            >
              Sale
            </Badge>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-medium text-black mb-2 group-hover:text-oma-plum transition-colors line-clamp-2">
          {title}
        </h3>
        <p className="text-oma-cocoa/70 text-sm mb-2 line-clamp-1">
          {category}
        </p>
        {brand?.name && (
          <p className="text-oma-cocoa/70 text-sm mb-3 line-clamp-1">
            {brand.name}
            {brand.location && ` • ${brand.location}`}
          </p>
        )}
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold text-oma-plum">
            {formattedPrice.displayPrice}
          </span>
          {formattedPrice.originalPrice && (
            <span className="text-sm text-oma-cocoa/60 line-through">
              {formattedPrice.originalPrice}
            </span>
          )}
        </div>
      </div>
    </NavigationLink>
  );
}

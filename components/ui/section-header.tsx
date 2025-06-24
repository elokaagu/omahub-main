import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  centered?: boolean;
  className?: string;
  titleClassName?: string;
  subtitleClassName?: string;
  italic?: boolean;
}

export function SectionHeader({
  title,
  subtitle,
  centered = false,
  className,
  titleClassName,
  subtitleClassName,
  italic = false,
}: SectionHeaderProps) {
  return (
    <div className={cn(centered ? "text-center" : "", "mb-6", className)}>
      <h2
        className={cn(
          "text-xl font-medium text-oma-black/90",
          italic ? "italic" : "",
          titleClassName
        )}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className={cn(
            "mt-2 text-sm text-oma-cocoa/70",
            centered ? "mx-auto" : "",
            subtitleClassName
          )}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}

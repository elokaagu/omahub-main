import { LazyImage } from "@/components/ui/lazy-image";

type EditionInlinePhotoProps = {
  src: string;
  alt: string;
};

export function EditionInlinePhoto({ src, alt }: EditionInlinePhotoProps) {
  return (
    <figure className="my-8 overflow-hidden rounded-2xl sm:my-10">
      <LazyImage
        src={src}
        alt={alt}
        aspectRatio="landscape"
        sizes="(max-width: 1024px) 100vw, 720px"
        quality={85}
      />
    </figure>
  );
}

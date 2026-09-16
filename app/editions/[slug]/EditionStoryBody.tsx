import { EditionInlinePhoto } from "./EditionInlinePhoto";
import { parseStoryHtml, type StoryBlock } from "@/lib/editions/storyBlocks";
import { cn } from "@/lib/utils";

type EditionStoryBodyProps = {
  storyHtml: string;
};

function StoryImages({ items }: { items: { src: string; alt: string }[] }) {
  if (items.length === 1) {
    return <EditionInlinePhoto src={items[0].src} alt={items[0].alt} />;
  }

  return (
    <div
      className={cn(
        "my-10 grid gap-3 sm:my-12 sm:gap-4",
        items.length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3",
      )}
    >
      {items.map((item) => (
        <EditionInlinePhoto
          key={item.src}
          src={item.src}
          alt={item.alt}
          compact
        />
      ))}
    </div>
  );
}

function StoryBlockView({
  block,
  isDek,
}: {
  block: StoryBlock;
  isDek: boolean;
}) {
  switch (block.type) {
    case "title":
      return (
        <h2 className="mt-4 font-canela text-3xl leading-[1.15] text-oma-black sm:mt-5 sm:text-4xl lg:text-[2.75rem]">
          {block.text}
        </h2>
      );
    case "heading":
      return (
        <h3 className="mt-12 border-t border-oma-cocoa/15 pt-8 font-canela text-2xl text-oma-black sm:mt-14 sm:pt-10 sm:text-3xl">
          {block.text}
        </h3>
      );
    case "paragraph":
      return (
        <p
          className={cn(
            "mt-5 font-suisse leading-relaxed sm:mt-6",
            isDek
              ? "text-lg text-oma-cocoa sm:text-xl"
              : "text-base text-oma-black sm:text-lg",
          )}
          dangerouslySetInnerHTML={{ __html: block.html }}
        />
      );
    case "list":
      return (
        <div
          className="edition-story-list mt-6 font-suisse text-base leading-relaxed text-oma-black sm:mt-7 sm:text-lg [&_li]:mt-2.5 [&_li]:pl-1 [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:list-none [&_ul>li]:relative [&_ul>li]:pl-5 [&_ul>li]:before:absolute [&_ul>li]:before:left-0 [&_ul>li]:before:top-[0.7em] [&_ul>li]:before:h-1.5 [&_ul>li]:before:w-1.5 [&_ul>li]:before:rounded-full [&_ul>li]:before:bg-oma-plum"
          dangerouslySetInnerHTML={{ __html: block.html }}
        />
      );
    case "quote":
      return (
        <blockquote
          className="my-10 border-l-2 border-oma-gold pl-5 font-suisse text-lg italic leading-relaxed text-oma-cocoa sm:my-12 sm:pl-6 sm:text-xl"
          dangerouslySetInnerHTML={{ __html: block.html }}
        />
      );
    case "images":
      return <StoryImages items={block.items} />;
    case "hr":
      return <hr className="my-12 border-oma-cocoa/15 sm:my-14" />;
  }
}

export function EditionStoryBody({ storyHtml }: EditionStoryBodyProps) {
  const blocks = parseStoryHtml(storyHtml);
  const dekIndex = blocks.findIndex((block) => block.type === "paragraph");

  if (blocks.length === 0) return null;

  return (
    <div className="edition-story">
      {blocks.map((block, index) => (
        <StoryBlockView
          key={`${block.type}-${index}`}
          block={block}
          isDek={index === dekIndex}
        />
      ))}
    </div>
  );
}

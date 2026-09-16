export type StoryImage = {
  src: string;
  alt: string;
};

export type StoryBlock =
  | { type: "title"; text: string }
  | { type: "heading"; text: string }
  | { type: "paragraph"; html: string }
  | { type: "list"; html: string }
  | { type: "quote"; html: string }
  | { type: "images"; items: StoryImage[] }
  | { type: "hr" };

type RawBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; html: string; text: string }
  | { type: "list"; html: string }
  | { type: "quote"; html: string }
  | { type: "image"; src: string; alt: string }
  | { type: "hr" };

function decodeEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function stripTags(html: string): string {
  return decodeEntities(html.replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function attr(tag: string, name: string): string {
  const match = tag.match(new RegExp(`${name}=["']([^"']*)["']`, "i"));
  return match ? decodeEntities(match[1]) : "";
}

function innerOf(html: string): string {
  const match = html.match(/^<[^>]+>([\s\S]*)<\/[^>]+>$/);
  return match ? match[1].trim() : html;
}

function extractImage(html: string): StoryImage | null {
  const tag = html.match(/<img\b[^>]*>/i)?.[0];
  if (!tag) return null;
  const src = attr(tag, "src");
  if (!src) return null;
  return { src, alt: attr(tag, "alt") };
}

function looksLikeHeading(text: string): boolean {
  if (text.length === 0 || text.length > 80) return false;
  if (/[:.!?]$/.test(text)) return false;
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0 || words.length > 12) return false;
  const titleCased = words.filter(
    (word) =>
      /^[A-Z0-9]/.test(word) ||
      /^(and|of|the|for|to|a|an|in|on)$/i.test(word),
  );
  return titleCased.length >= Math.ceil(words.length * 0.7);
}

function isEmptyParagraph(html: string): boolean {
  const text = stripTags(html.replace(/<br\s*\/?>/gi, " "));
  return text.length === 0;
}

function tokenize(html: string): RawBlock[] {
  const blocks: RawBlock[] = [];
  const pattern =
    /<h[1-4]\b[^>]*>[\s\S]*?<\/h[1-4]>|<p\b[^>]*>[\s\S]*?<\/p>|<ul\b[^>]*>[\s\S]*?<\/ul>|<ol\b[^>]*>[\s\S]*?<\/ol>|<blockquote\b[^>]*>[\s\S]*?<\/blockquote>|<figure\b[^>]*>[\s\S]*?<\/figure>|<img\b[^>]*\/?>|<hr\b[^>]*\/?>/gi;

  for (const match of html.match(pattern) ?? []) {
    if (/^<h[1-4]\b/i.test(match)) {
      const text = stripTags(match);
      if (text) blocks.push({ type: "heading", text });
      continue;
    }

    if (/^<p\b/i.test(match)) {
      if (isEmptyParagraph(match)) continue;
      const inner = innerOf(match);
      const onlyImage = extractImage(inner);
      const innerText = stripTags(inner);
      if (onlyImage && innerText.length === 0) {
        blocks.push({ type: "image", ...onlyImage });
        continue;
      }
      blocks.push({
        type: "paragraph",
        html: inner,
        text: stripTags(match),
      });
      continue;
    }

    if (/^<ul\b/i.test(match) || /^<ol\b/i.test(match)) {
      blocks.push({ type: "list", html: match });
      continue;
    }

    if (/^<blockquote\b/i.test(match)) {
      blocks.push({ type: "quote", html: innerOf(match) });
      continue;
    }

    if (/^<figure\b/i.test(match) || /^<img\b/i.test(match)) {
      const image = extractImage(match);
      if (image) blocks.push({ type: "image", ...image });
      continue;
    }

    if (/^<hr\b/i.test(match)) {
      blocks.push({ type: "hr" });
    }
  }

  return blocks;
}

function promoteHeadings(blocks: RawBlock[]): RawBlock[] {
  return blocks.map((block, index) => {
    if (block.type !== "paragraph") return block;
    const next = blocks[index + 1];
    if (!next) return block;
    if (!looksLikeHeading(block.text)) return block;
    if (next.type === "paragraph" || next.type === "list" || next.type === "quote") {
      return { type: "heading", text: block.text };
    }
    return block;
  });
}

function toStoryBlocks(blocks: RawBlock[]): StoryBlock[] {
  const result: StoryBlock[] = [];
  let usedTitle = false;

  for (const block of blocks) {
    if (block.type === "heading") {
      if (!usedTitle) {
        result.push({ type: "title", text: block.text });
        usedTitle = true;
      } else {
        result.push({ type: "heading", text: block.text });
      }
      continue;
    }

    if (block.type === "paragraph") {
      result.push({ type: "paragraph", html: block.html });
      continue;
    }

    if (block.type === "list") {
      result.push({ type: "list", html: block.html });
      continue;
    }

    if (block.type === "quote") {
      result.push({ type: "quote", html: block.html });
      continue;
    }

    if (block.type === "image") {
      const previous = result[result.length - 1];
      if (previous?.type === "images") {
        previous.items.push({ src: block.src, alt: block.alt });
      } else {
        result.push({
          type: "images",
          items: [{ src: block.src, alt: block.alt }],
        });
      }
      continue;
    }

    result.push({ type: "hr" });
  }

  return result;
}

export function parseStoryHtml(html: string): StoryBlock[] {
  if (!html?.trim()) return [];
  return toStoryBlocks(promoteHeadings(tokenize(html)));
}

import { createEditionStoryProseClassName } from "@/lib/editions/storyHtml";

type EditionStoryBodyProps = {
  storyHtml: string;
};

export function EditionStoryBody({ storyHtml }: EditionStoryBodyProps) {
  return (
    <div
      className={createEditionStoryProseClassName()}
      dangerouslySetInnerHTML={{ __html: storyHtml }}
    />
  );
}

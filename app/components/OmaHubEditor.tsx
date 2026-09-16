"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import "./omahub-editor.css";
import React, { useRef } from "react";
import { Image as ImageIcon } from "lucide-react";

type ImagePlacement = "after-block" | "after-section" | "at-cursor";

function insertImageAt(
  editor: Editor,
  url: string,
  placement: ImagePlacement,
  alt = "",
) {
  const imageNode = { type: "image", attrs: { src: url, alt } };

  if (placement === "at-cursor") {
    editor.chain().focus().insertContent(imageNode).run();
    return;
  }

  const { $from } = editor.state.selection;
  const afterBlock = $from.after($from.depth);
  let insertPos = afterBlock;

  if (placement === "after-section") {
    let nextHeading: number | null = null;
    editor.state.doc.nodesBetween(
      afterBlock,
      editor.state.doc.content.size,
      (node: { type: { name: string } }, pos: number) => {
        if (nextHeading !== null) return false;
        if (node.type.name === "heading") {
          nextHeading = pos;
          return false;
        }
        return true;
      },
    );
    insertPos = nextHeading ?? editor.state.doc.content.size;
  }

  editor.chain().focus().insertContentAt(insertPos, imageNode).run();
}

const Toolbar = ({
  editor,
  onUploadImage,
  isUploadingImage,
}: {
  editor: Editor | null;
  onUploadImage?: (file: File) => Promise<string | null>;
  isUploadingImage?: boolean;
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const placementRef = useRef<ImagePlacement>("after-block");

  if (!editor) return null;

  const handleImagePick = async (file: File | undefined) => {
    if (!file || !onUploadImage) return;
    const url = await onUploadImage(file);
    if (url) {
      insertImageAt(editor, url, placementRef.current, file.name);
    }
  };

  const pickImage = (placement: ImagePlacement) => {
    placementRef.current = placement;
    fileInputRef.current?.click();
  };

  return (
    <div className="omahub-toolbar">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={editor.isActive("bold") ? "active" : ""}
      >
        bold
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={editor.isActive("italic") ? "active" : ""}
      >
        italic
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={editor.isActive("strike") ? "active" : ""}
      >
        strike
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().setParagraph().run()}
        className={editor.isActive("paragraph") ? "active" : ""}
      >
        paragraph
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={editor.isActive("heading", { level: 2 }) ? "active" : ""}
      >
        h2
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={editor.isActive("heading", { level: 3 }) ? "active" : ""}
      >
        h3
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
        className={editor.isActive("heading", { level: 4 }) ? "active" : ""}
      >
        h4
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={editor.isActive("bulletList") ? "active" : ""}
      >
        bullet list
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={editor.isActive("orderedList") ? "active" : ""}
      >
        ordered list
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={editor.isActive("blockquote") ? "active" : ""}
      >
        quote
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      >
        divider
      </button>
      <button type="button" onClick={() => editor.chain().focus().undo().run()}>
        undo
      </button>
      <button type="button" onClick={() => editor.chain().focus().redo().run()}>
        redo
      </button>
      {onUploadImage && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => {
              void handleImagePick(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            disabled={isUploadingImage}
            onClick={() => pickImage("after-block")}
            className="inline-flex items-center gap-1"
            title="Insert a photo after this paragraph or heading"
          >
            <ImageIcon className="h-4 w-4" />
            {isUploadingImage ? "uploading…" : "add photo"}
          </button>
          <button
            type="button"
            disabled={isUploadingImage}
            onClick={() => pickImage("after-section")}
            className="inline-flex items-center gap-1"
            title="Insert a photo before the next heading"
          >
            <ImageIcon className="h-4 w-4" />
            photo between sections
          </button>
        </>
      )}
    </div>
  );
};

interface OmaHubEditorProps {
  content: string;
  onChange: (content: string) => void;
  onUploadImage?: (file: File) => Promise<string | null>;
  isUploadingImage?: boolean;
  className?: string;
}

export default function OmaHubEditor({
  content,
  onChange,
  onUploadImage,
  isUploadingImage,
  className,
}: OmaHubEditorProps) {
  const uploadRef = useRef(onUploadImage);
  uploadRef.current = onUploadImage;
  const editorRef = useRef<Editor | null>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Image.configure({
        inline: false,
        allowBase64: false,
        HTMLAttributes: {
          class: "edition-inline-image",
        },
      }),
    ],
    content,
    onUpdate: ({ editor: activeEditor }) => {
      onChange(activeEditor.getHTML());
    },
    editorProps: {
      handlePaste(_view, event) {
        const file = event.clipboardData?.files?.[0];
        const upload = uploadRef.current;
        if (!file || !file.type.startsWith("image/") || !upload) return false;
        event.preventDefault();
        void upload(file).then((url) => {
          const activeEditor = editorRef.current;
          if (url && activeEditor) {
            insertImageAt(activeEditor, url, "after-block", file.name);
          }
        });
        return true;
      },
      handleDrop(view, event, _slice, moved) {
        const file = event.dataTransfer?.files?.[0];
        const upload = uploadRef.current;
        if (moved || !file || !file.type.startsWith("image/") || !upload) {
          return false;
        }
        event.preventDefault();
        const coords = view.posAtCoords({
          left: event.clientX,
          top: event.clientY,
        });
        void upload(file).then((url) => {
          const activeEditor = editorRef.current;
          if (!url || !activeEditor) return;
          if (coords) {
            activeEditor
              .chain()
              .focus()
              .insertContentAt(coords.pos, {
                type: "image",
                attrs: { src: url, alt: file.name },
              })
              .run();
            return;
          }
          insertImageAt(activeEditor, url, "after-block", file.name);
        });
        return true;
      },
    },
  });

  editorRef.current = editor;

  React.useEffect(() => {
    if (!editor) return;
    if (editor.getHTML() !== content) {
      editor.commands.setContent(content, false);
    }
  }, [content, editor]);

  return (
    <div className={`omahub-editor-container ${className ?? ""}`.trim()}>
      <Toolbar
        editor={editor}
        onUploadImage={onUploadImage}
        isUploadingImage={isUploadingImage}
      />
      <EditorContent editor={editor} />
    </div>
  );
}

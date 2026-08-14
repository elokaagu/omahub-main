"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import "./omahub-editor.css";
import React, { useRef } from "react";
import { ImageIcon } from "lucide-react";

const Toolbar = ({
  editor,
  onUploadImage,
  isUploadingImage,
}: {
  editor: ReturnType<typeof useEditor>;
  onUploadImage?: (file: File) => Promise<string | null>;
  isUploadingImage?: boolean;
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!editor) return null;

  const handleImagePick = async (file: File | undefined) => {
    if (!file || !onUploadImage) return;
    const url = await onUploadImage(file);
    if (url) {
      editor.chain().focus().setImage({ src: url, alt: "" }).run();
    }
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
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1"
          >
            <ImageIcon className="h-4 w-4" />
            {isUploadingImage ? "uploading…" : "add photo"}
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
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        HTMLAttributes: {
          class: "edition-inline-image",
        },
      }),
    ],
    content,
    onUpdate: ({ editor: activeEditor }) => {
      onChange(activeEditor.getHTML());
    },
  });

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

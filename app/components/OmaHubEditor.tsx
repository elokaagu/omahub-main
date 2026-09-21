"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import "./omahub-editor.css";
import React, { useRef } from "react";
import {
  Bold,
  Italic,
  Strikethrough,
  Type,
  Heading2,
  Heading3,
  Heading4,
  List,
  ListOrdered,
  Quote,
  Minus,
  Undo2,
  Redo2,
  Image as ImageIcon,
  ImagePlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { isSupportedStudioImageFile } from "@/lib/uploads/acceptedMedia";

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

function ToolbarButton({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex h-8 items-center justify-center gap-1.5 rounded px-2 text-sm text-neutral-700 hover:bg-neutral-100 disabled:opacity-40",
        active && "bg-neutral-200 text-neutral-900",
      )}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <span className="mx-1 hidden h-5 w-px bg-neutral-200 sm:block" />;
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
      <ToolbarButton
        label="Bold"
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Italic"
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Strikethrough"
        active={editor.isActive("strike")}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton
        label="Paragraph"
        active={editor.isActive("paragraph")}
        onClick={() => editor.chain().focus().setParagraph().run()}
      >
        <Type className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Heading 2"
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Heading 3"
        active={editor.isActive("heading", { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        <Heading3 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Heading 4"
        active={editor.isActive("heading", { level: 4 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
      >
        <Heading4 className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton
        label="Bullet list"
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Numbered list"
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Quote"
        active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Divider"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      >
        <Minus className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton
        label="Undo"
        onClick={() => editor.chain().focus().undo().run()}
      >
        <Undo2 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Redo"
        onClick={() => editor.chain().focus().redo().run()}
      >
        <Redo2 className="h-4 w-4" />
      </ToolbarButton>

      {onUploadImage && (
        <>
          <ToolbarDivider />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp,.jpg,.jpeg,.png,.webp"
            className="hidden"
            onChange={(e) => {
              void handleImagePick(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <ToolbarButton
            label="Insert image after this block"
            disabled={isUploadingImage}
            onClick={() => pickImage("after-block")}
          >
            <ImageIcon className="h-4 w-4" />
            <span className="hidden sm:inline">
              {isUploadingImage ? "Uploading…" : "Image"}
            </span>
          </ToolbarButton>
          <ToolbarButton
            label="Insert image before the next heading"
            disabled={isUploadingImage}
            onClick={() => pickImage("after-section")}
          >
            <ImagePlus className="h-4 w-4" />
            <span className="hidden sm:inline">Between sections</span>
          </ToolbarButton>
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
        if (!file || !isSupportedStudioImageFile(file) || !upload) return false;
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
        if (moved || !file || !isSupportedStudioImageFile(file) || !upload) {
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
    <div className={cn("omahub-editor-container", className)}>
      <Toolbar
        editor={editor}
        onUploadImage={onUploadImage}
        isUploadingImage={isUploadingImage}
      />
      <EditorContent editor={editor} />
    </div>
  );
}

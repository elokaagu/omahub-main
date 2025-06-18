"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "./button";
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Type,
  Quote,
  Link,
  Undo,
  Redo,
} from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Start typing...",
  className = "",
  minHeight = "300px",
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isEditorFocused, setIsEditorFocused] = useState(false);

  // Initialize editor content
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const handleCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleContentChange();
  };

  const handleContentChange = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      onChange(content);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle common keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case "b":
          e.preventDefault();
          handleCommand("bold");
          break;
        case "i":
          e.preventDefault();
          handleCommand("italic");
          break;
        case "u":
          e.preventDefault();
          handleCommand("underline");
          break;
        case "z":
          e.preventDefault();
          if (e.shiftKey) {
            handleCommand("redo");
          } else {
            handleCommand("undo");
          }
          break;
      }
    }
  };

  const addHeading = (level: number) => {
    handleCommand("formatBlock", `h${level}`);
  };

  const addLink = () => {
    const url = prompt("Enter URL:");
    if (url) {
      handleCommand("createLink", url);
    }
  };

  const formatButtons = [
    {
      icon: <Undo className="h-4 w-4" />,
      label: "Undo",
      command: "undo",
    },
    {
      icon: <Redo className="h-4 w-4" />,
      label: "Redo",
      command: "redo",
    },
    {
      icon: <Bold className="h-4 w-4" />,
      label: "Bold",
      command: "bold",
    },
    {
      icon: <Italic className="h-4 w-4" />,
      label: "Italic",
      command: "italic",
    },
    {
      icon: <Underline className="h-4 w-4" />,
      label: "Underline",
      command: "underline",
    },
    {
      icon: <List className="h-4 w-4" />,
      label: "Bullet List",
      command: "insertUnorderedList",
    },
    {
      icon: <ListOrdered className="h-4 w-4" />,
      label: "Numbered List",
      command: "insertOrderedList",
    },
    {
      icon: <AlignLeft className="h-4 w-4" />,
      label: "Align Left",
      command: "justifyLeft",
    },
    {
      icon: <AlignCenter className="h-4 w-4" />,
      label: "Align Center",
      command: "justifyCenter",
    },
    {
      icon: <AlignRight className="h-4 w-4" />,
      label: "Align Right",
      command: "justifyRight",
    },
    {
      icon: <Quote className="h-4 w-4" />,
      label: "Quote",
      command: "formatBlock",
      value: "blockquote",
    },
  ];

  return (
    <div className={`border rounded-lg overflow-hidden ${className}`}>
      {/* Toolbar */}
      <div className="border-b bg-gray-50 p-2 flex flex-wrap gap-1">
        {/* Heading Buttons */}
        <div className="flex items-center gap-1 mr-2 border-r pr-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => addHeading(1)}
            className="h-8 px-2"
            title="Heading 1"
          >
            <Type className="h-4 w-4" />
            <span className="ml-1 text-xs">H1</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => addHeading(2)}
            className="h-8 px-2"
            title="Heading 2"
          >
            <Type className="h-4 w-4" />
            <span className="ml-1 text-xs">H2</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => addHeading(3)}
            className="h-8 px-2"
            title="Heading 3"
          >
            <Type className="h-4 w-4" />
            <span className="ml-1 text-xs">H3</span>
          </Button>
        </div>

        {/* Format Buttons */}
        {formatButtons.map((button, index) => (
          <Button
            key={index}
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleCommand(button.command, button.value)}
            className="h-8 px-2"
            title={button.label}
          >
            {button.icon}
          </Button>
        ))}

        {/* Link Button */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={addLink}
          className="h-8 px-2"
          title="Add Link"
        >
          <Link className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleContentChange}
        onFocus={() => setIsEditorFocused(true)}
        onBlur={() => setIsEditorFocused(false)}
        onKeyDown={handleKeyDown}
        className={`
          p-4 outline-none min-h-[${minHeight}] max-h-[600px] overflow-y-auto
          prose prose-sm max-w-none
          focus:bg-gray-50/50
          ${!value && !isEditorFocused ? "text-gray-400" : ""}
        `}
        style={{ minHeight }}
        suppressContentEditableWarning={true}
        data-placeholder={placeholder}
      />

      {/* Show placeholder when empty */}
      {!value && !isEditorFocused && (
        <div
          className="absolute top-[60px] left-4 text-gray-400 pointer-events-none"
          style={{ top: "60px" }}
        >
          {placeholder}
        </div>
      )}

      <style jsx>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
          position: absolute;
        }

        [contenteditable]:focus:before {
          display: none;
        }

        /* Style the editor content */
        [contenteditable] h1 {
          font-size: 1.875rem;
          font-weight: 700;
          margin: 1rem 0 0.5rem 0;
          color: #1f2937;
        }

        [contenteditable] h2 {
          font-size: 1.5rem;
          font-weight: 600;
          margin: 1.5rem 0 0.5rem 0;
          color: #374151;
        }

        [contenteditable] h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin: 1.25rem 0 0.5rem 0;
          color: #4b5563;
        }

        [contenteditable] p {
          margin: 0.75rem 0;
          line-height: 1.6;
          color: #6b7280;
        }

        [contenteditable] ul,
        [contenteditable] ol {
          margin: 1rem 0;
          padding-left: 1.5rem;
        }

        [contenteditable] li {
          margin: 0.25rem 0;
          color: #6b7280;
        }

        [contenteditable] blockquote {
          border-left: 4px solid #d1d5db;
          padding-left: 1rem;
          margin: 1rem 0;
          font-style: italic;
          color: #6b7280;
        }

        [contenteditable] a {
          color: #7c3aed;
          text-decoration: underline;
        }

        [contenteditable] strong {
          font-weight: 600;
        }

        [contenteditable] em {
          font-style: italic;
        }
      `}</style>
    </div>
  );
}

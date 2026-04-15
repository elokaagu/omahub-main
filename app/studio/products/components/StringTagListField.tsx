"use client";

import { useRef, type KeyboardEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2 } from "lucide-react";

type StringTagListFieldProps = {
  label: string;
  placeholder: string;
  items: string[];
  onAdd: (value: string) => void;
  onRemove: (index: number) => void;
  inputId?: string;
};

export function StringTagListField({
  label,
  placeholder,
  items,
  onAdd,
  onRemove,
  inputId,
}: StringTagListFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const commit = () => {
    const el = inputRef.current;
    if (!el) return;
    const v = el.value.trim();
    if (v) onAdd(v);
    el.value = "";
  };

  return (
    <div className="space-y-2">
      <Label className="text-black">{label}</Label>
      <div className="flex gap-2 mb-2">
        <Input
          ref={inputRef}
          id={inputId}
          placeholder={placeholder}
          className="border-oma-cocoa/20 focus:border-oma-plum"
          onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          className="border-oma-plum text-oma-plum hover:bg-oma-plum hover:text-white"
          onClick={commit}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((item, index) => (
          <Badge
            key={`${item}-${index}`}
            variant="secondary"
            className="flex items-center gap-1 bg-oma-beige text-oma-plum"
          >
            {item}
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="ml-1 hover:text-red-600"
              aria-label={`Remove ${item}`}
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
    </div>
  );
}

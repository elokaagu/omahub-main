"use client";

import { useEffect, useState } from "react";
import { ChevronsUpDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type FreeTextSizeFieldProps = {
  id: string;
  labelId?: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  errId?: string;
};

/** Same combobox shell as catalogue sizes when there are no preset rows: type, then Use or Enter. */
export function FreeTextSizeComboField({
  id,
  labelId,
  value,
  onChange,
  error,
  errId,
}: FreeTextSizeFieldProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setDraft(value);
      }}
    >
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-labelledby={labelId}
          aria-invalid={!!error}
          aria-describedby={error && errId ? errId : undefined}
          className={cn(
            "h-auto min-h-10 w-full justify-between border-oma-gold/30 bg-white py-2 text-left font-normal hover:bg-white focus-visible:ring-oma-plum",
            !value.trim() && "text-oma-cocoa/70",
          )}
        >
          <span className="line-clamp-2 pr-2">
            {value.trim() ? value : "Open to enter your size (UK / EU / cm)…"}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0 w-[min(calc(100vw-2rem),22rem)]"
        align="start"
        sideOffset={4}
      >
        <div className="border-b border-oma-gold/15 p-2">
          <Input
            name={`${id}-draft`}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="UK / EU / cm - be specific"
            className="border-oma-gold/30 bg-white focus-visible:ring-oma-plum"
            onKeyDown={(e) => {
              if (e.key === "Enter" && draft.trim()) {
                onChange(draft.trim());
                setOpen(false);
              }
            }}
            aria-label="Your size"
          />
          <p className="mt-1.5 text-xs text-oma-cocoa/75">
            Type your size, then choose &quot;Use …&quot; below or press Enter.
          </p>
        </div>
        <Command shouldFilter={false}>
          <CommandList className="max-h-40">
            <CommandGroup>
              {draft.trim() ? (
                <CommandItem
                  value={`__manual_size__${draft}`}
                  onSelect={() => {
                    onChange(draft.trim());
                    setOpen(false);
                  }}
                >
                  Use &quot;{draft.trim()}&quot;
                </CommandItem>
              ) : (
                <div className="px-3 py-3 text-xs text-oma-cocoa/80">
                  No preset sizes for this path. Enter yours above.
                </div>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

type FreeTextColourFieldProps = {
  id: string;
  labelId?: string;
  value: string;
  onChange: (v: string) => void;
};

export function FreeTextColourComboField({
  id,
  labelId,
  value,
  onChange,
}: FreeTextColourFieldProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setDraft(value);
      }}
    >
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-labelledby={labelId}
          className={cn(
            "h-auto min-h-10 w-full justify-between border-oma-gold/30 bg-white py-2 text-left font-normal hover:bg-white focus-visible:ring-oma-plum",
            !value.trim() && "text-oma-cocoa/70",
          )}
        >
          <span className="line-clamp-2 pr-2">
            {value.trim() ? value : "Open to enter colour or no preference…"}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0 w-[min(calc(100vw-2rem),22rem)]"
        align="start"
        sideOffset={4}
      >
        <div className="border-b border-oma-gold/15 p-2">
          <Input
            name={`${id}-draft`}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Colour or variant if needed"
            className="border-oma-gold/30 bg-white focus-visible:ring-oma-plum"
            onKeyDown={(e) => {
              if (e.key === "Enter" && draft.trim()) {
                onChange(draft.trim());
                setOpen(false);
              }
            }}
            aria-label="Colour or variant"
          />
          <p className="mt-1.5 text-xs text-oma-cocoa/75">
            Optional. Choose &quot;Use …&quot; or press Enter, or pick No
            preference.
          </p>
        </div>
        <Command shouldFilter={false}>
          <CommandList className="max-h-44">
            <CommandGroup>
              <CommandItem
                value="__manual_colour_none__"
                onSelect={() => {
                  onChange("");
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4 shrink-0",
                    !value.trim() ? "opacity-100" : "opacity-0",
                  )}
                  aria-hidden
                />
                No preference
              </CommandItem>
              {draft.trim() ? (
                <CommandItem
                  value={`__manual_colour__${draft}`}
                  onSelect={() => {
                    onChange(draft.trim());
                    setOpen(false);
                  }}
                >
                  Use &quot;{draft.trim()}&quot;
                </CommandItem>
              ) : null}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

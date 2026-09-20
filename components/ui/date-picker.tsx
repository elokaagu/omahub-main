"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type DatePickerProps = {
  id?: string;
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

function parseISODate(value: string | undefined): Date | undefined {
  if (!value) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day);
}

function formatISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function DatePicker({
  id,
  value,
  onChange,
  placeholder = "Pick a date",
  className,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const selected = parseISODate(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          className={cn(
            "h-10 w-full justify-between rounded-md border-input bg-background px-3 font-normal text-oma-black hover:bg-oma-beige/40 hover:text-oma-black",
            !selected && "text-oma-cocoa/70",
            className
          )}
        >
          <span>
            {selected ? format(selected, "d MMMM yyyy") : placeholder}
          </span>
          <CalendarIcon className="h-4 w-4 text-oma-plum" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-auto rounded-xl border-oma-gold/40 bg-white p-0 shadow-lg"
      >
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(date) => {
            onChange(date ? formatISODate(date) : "");
            if (date) setOpen(false);
          }}
          initialFocus
        />
        <div className="flex items-center justify-between border-t border-oma-gold/20 px-3 py-2">
          <button
            type="button"
            className="text-sm text-oma-plum hover:underline"
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
          >
            Clear
          </button>
          <button
            type="button"
            className="text-sm text-oma-plum hover:underline"
            onClick={() => {
              onChange(formatISODate(new Date()));
              setOpen(false);
            }}
          >
            Today
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

import * as React from "react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium text-oma-black",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 text-oma-plum border-oma-gold/40 opacity-80 hover:opacity-100 hover:bg-oma-beige/50"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-oma-cocoa rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-oma-beige/50 [&:has([aria-selected])]:bg-oma-beige first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal text-oma-black hover:bg-oma-beige/70 hover:text-oma-plum aria-selected:opacity-100"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-oma-plum text-white hover:bg-oma-plum hover:text-white focus:bg-oma-plum focus:text-white",
        day_today: "bg-oma-beige text-oma-plum",
        day_outside:
          "day-outside text-oma-cocoa/50 aria-selected:bg-oma-beige/50 aria-selected:text-oma-cocoa aria-selected:opacity-30",
        day_disabled: "text-oma-cocoa/40 opacity-50",
        day_range_middle:
          "aria-selected:bg-oma-beige aria-selected:text-oma-plum",
        day_hidden: "invisible",
        ...classNames,
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };

import * as React from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface MultiSelectProps {
  options: string[];
  value: string[];
  onValueChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function MultiSelect({
  options,
  value,
  onValueChange,
  placeholder = "Select options...",
  className,
  disabled = false,
}: MultiSelectProps) {
  const handleSelect = (option: string) => {
    const newValue = value.includes(option)
      ? value.filter((item) => item !== option)
      : [...value, option];
    onValueChange(newValue);
  };

  const handleRemove = (option: string) => {
    onValueChange(value.filter((item) => item !== option));
  };

  return (
    <div className={cn("w-full", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            className={cn(
              "w-full justify-between h-auto min-h-10 px-3 py-2",
              !value.length && "text-muted-foreground"
            )}
            disabled={disabled}
          >
            <div className="flex flex-wrap gap-1 flex-1">
              {value.length > 0 ? (
                value.map((item) => (
                  <Badge
                    key={item}
                    variant="secondary"
                    className="mr-1 mb-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(item);
                    }}
                  >
                    {item}
                    <X className="ml-1 h-3 w-3 cursor-pointer" />
                  </Badge>
                ))
              ) : (
                <span>{placeholder}</span>
              )}
            </div>
            <ChevronDown className="h-4 w-4 opacity-50 flex-shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-full min-w-[var(--radix-dropdown-menu-trigger-width)]">
          {options.map((option) => (
            <DropdownMenuCheckboxItem
              key={option}
              checked={value.includes(option)}
              onCheckedChange={() => handleSelect(option)}
            >
              {option}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

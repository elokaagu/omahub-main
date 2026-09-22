"use client";

import { useState, type ReactNode } from "react";
import { Film } from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { savePlatformSetting } from "./savePlatformSetting";

type VimeoVideoIdCardProps = {
  title: string;
  description: ReactNode;
  help: ReactNode;
  /** platform-settings API key, e.g. "heroVideoId". */
  settingKey: string;
  initialValue: string;
  successMessage: string;
  errorMessage: string;
};

/** A card that stores one numeric Vimeo video id in platform settings. */
export function VimeoVideoIdCard({
  title,
  description,
  help,
  settingKey,
  initialValue,
  successMessage,
  errorMessage,
}: VimeoVideoIdCardProps) {
  const [value, setValue] = useState(initialValue);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const trimmed = value.trim();
    if (!/^\d+$/.test(trimmed)) {
      toast.error("Enter just the numeric Vimeo video ID");
      return;
    }
    setSaving(true);
    const error = await savePlatformSetting(
      { [settingKey]: trimmed },
      errorMessage,
    );
    setSaving(false);
    if (error) toast.error(error);
    else toast.success(successMessage);
  };

  return (
    <Card className="border-oma-beige">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-oma-plum font-canela">
          <Film className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription className="text-oma-cocoa">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-oma-cocoa/80 mb-4">{help}</p>
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="1206857643"
          inputMode="numeric"
          aria-label={`${title} Vimeo ID`}
        />
      </CardContent>
      <CardFooter>
        <Button
          onClick={() => void save()}
          disabled={saving}
          className="w-full bg-oma-plum hover:bg-oma-plum/90 text-white"
        >
          {saving ? "Saving…" : "Save Video"}
        </Button>
      </CardFooter>
    </Card>
  );
}

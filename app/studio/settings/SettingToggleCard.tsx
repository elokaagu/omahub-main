"use client";

import { useState, type ReactNode } from "react";
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
import { savePlatformSetting } from "./savePlatformSetting";

type StateCopy = {
  /** Status pill, e.g. "Signup is open". */
  badge: string;
  /** Paragraph explaining what this state means. */
  explanation: string;
  /** Button that switches to this state. */
  action: string;
  /** Toast after switching to this state. */
  toast: string;
};

type SettingToggleCardProps = {
  /** Rendered icon element (a server page can't pass a component). */
  icon: ReactNode;
  title: string;
  description: string;
  /** platform-settings API key; stored as "true" / "false". */
  settingKey: string;
  initialEnabled: boolean;
  on: StateCopy;
  off: StateCopy;
};

/** An on/off platform setting with a status pill and two buttons. */
export function SettingToggleCard({
  icon,
  title,
  description,
  settingKey,
  initialEnabled,
  on,
  off,
}: SettingToggleCardProps) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [saving, setSaving] = useState(false);
  const current = enabled ? on : off;

  const setTo = async (next: boolean) => {
    setSaving(true);
    const error = await savePlatformSetting(
      { [settingKey]: next ? "true" : "false" },
      "Failed to update this setting",
    );
    setSaving(false);
    if (error) {
      toast.error(error);
      return;
    }
    setEnabled(next);
    toast.success(next ? on.toast : off.toast);
  };

  return (
    <Card className="border-gray-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-900 font-canela">
          {icon}
          {title}
        </CardTitle>
        <CardDescription className="text-gray-600">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
              enabled
                ? "bg-green-100 text-green-800 border border-green-200"
                : "bg-amber-100 text-amber-800 border border-amber-200"
            }`}
          >
            {current.badge}
          </div>
        </div>
        <p className="text-sm text-gray-600">{current.explanation}</p>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button
          onClick={() => void setTo(true)}
          disabled={saving || enabled}
          variant={enabled ? "secondary" : "default"}
          className={`flex-1 ${!enabled ? "bg-oma-plum hover:bg-oma-plum/90 text-white" : ""}`}
        >
          {on.action}
        </Button>
        <Button
          onClick={() => void setTo(false)}
          disabled={saving || !enabled}
          variant={!enabled ? "secondary" : "outline"}
          className="flex-1"
        >
          {off.action}
        </Button>
      </CardFooter>
    </Card>
  );
}

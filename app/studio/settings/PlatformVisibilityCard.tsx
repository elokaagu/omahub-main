"use client";

import { useState } from "react";
import { Eye, EyeOff, Globe, Lock, Shield } from "lucide-react";
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
import type { PlatformVisibility } from "@/lib/studio/platformSettings";

type Visibility = Pick<PlatformVisibility, "isPublic" | "fallback">;

type PlatformVisibilityCardProps = {
  /** null when the server couldn't read the setting (see `loadError`). */
  initialVisibility: Visibility | null;
  loadError: string | null;
};

/** Turn the site-wide password gate on or off. */
export function PlatformVisibilityCard({
  initialVisibility,
  loadError,
}: PlatformVisibilityCardProps) {
  const [visibility, setVisibility] = useState<Visibility | null>(
    initialVisibility,
  );
  const [changing, setChanging] = useState(false);
  const isPublic = visibility?.isPublic ?? false;

  const change = async (makePublic: boolean) => {
    setChanging(true);
    try {
      const response = await fetch(
        makePublic
          ? "/api/auth/remove-password-gate"
          : "/api/auth/enable-password-gate",
        { method: "POST", headers: { "Content-Type": "application/json" } },
      );
      const data = await response.json();
      if (response.ok && data.success) {
        toast.success(
          makePublic
            ? "Platform is now public! Password gate has been removed."
            : "Platform is now private! Password gate has been enabled.",
        );
        setVisibility({ isPublic: makePublic });
      } else {
        toast.error(
          data.error ||
            (makePublic
              ? "Failed to make platform public"
              : "Failed to make platform private"),
        );
      }
    } catch (error) {
      console.error("Error changing platform visibility:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setChanging(false);
    }
  };

  const updating = (
    <>
      <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
      <span>Updating...</span>
    </>
  );

  return (
    <Card className="border-oma-beige">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-oma-plum font-canela">
          {isPublic ? (
            <Globe className="h-5 w-5" />
          ) : (
            <Lock className="h-5 w-5" />
          )}
          Platform Visibility
        </CardTitle>
        <CardDescription className="text-oma-cocoa">
          Control public access to the platform
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loadError && (
          <p className="text-xs text-red-800 mb-3 rounded-md border border-red-200 bg-red-50 px-2.5 py-2">
            {loadError}
          </p>
        )}
        <div className="mb-4">
          <div
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
              isPublic
                ? "bg-green-100 text-green-800 border border-green-200"
                : "bg-amber-100 text-amber-800 border border-amber-200"
            }`}
          >
            {isPublic ? (
              <Eye className="h-3 w-3" />
            ) : (
              <EyeOff className="h-3 w-3" />
            )}
            <span>
              {isPublic ? "Platform is Public" : "Platform is Private"}
            </span>
          </div>
        </div>

        <p className="text-sm text-oma-cocoa/80 mb-4">
          {isPublic
            ? "The platform is currently accessible to all visitors without a password. Anyone can browse and explore your content."
            : "The platform is currently password-protected for internal testing. Visitors need the access password to view content."}
        </p>

        {visibility?.fallback === "missing_row_defaults_to_private" && (
          <p className="text-xs text-oma-cocoa/75 mb-3 rounded-md bg-oma-beige/50 px-2.5 py-2">
            No database row for platform visibility yet - effective status is
            private until you use Make Public or Make Private.
          </p>
        )}
        {visibility?.fallback ===
          "unrecognised_stored_value_treated_as_private" && (
          <p className="text-xs text-amber-900/90 mb-3 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-2">
            Stored value is not recognised; treated as private. Use the buttons
            below to set public or private explicitly.
          </p>
        )}

        <div className="space-y-2 text-xs text-oma-cocoa/70">
          <div className="flex items-center gap-2">
            <Shield className="h-3 w-3 text-oma-plum" />
            <span>
              {isPublic
                ? "Open access for all visitors"
                : "Password-protected access"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="h-3 w-3 text-oma-plum" />
            <span>
              {isPublic
                ? "SEO friendly and discoverable"
                : "Hidden from search engines"}
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button
          onClick={() => void change(true)}
          disabled={changing || isPublic || Boolean(loadError)}
          variant={isPublic ? "secondary" : "default"}
          className={`flex items-center gap-2 flex-1 ${
            !isPublic ? "bg-oma-plum hover:bg-oma-plum/90 text-white" : ""
          }`}
        >
          {changing ? (
            updating
          ) : (
            <>
              <Globe className="h-4 w-4" />
              <span>Make Public</span>
            </>
          )}
        </Button>
        <Button
          onClick={() => void change(false)}
          disabled={changing || !isPublic || Boolean(loadError)}
          variant={!isPublic ? "secondary" : "outline"}
          className="flex items-center gap-2 flex-1"
        >
          {changing ? (
            updating
          ) : (
            <>
              <Lock className="h-4 w-4" />
              <span>Make Private</span>
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

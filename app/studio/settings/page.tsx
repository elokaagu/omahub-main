import {
  FileText,
  HelpCircle,
  MessageSquare,
  Shield,
  ShoppingBag,
  UserPlus,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BlurIn } from "@/components/studio/BlurIn";
import { StudioLoadError } from "@/components/studio/StudioLoadError";
import { permissionsForProfileRole } from "@/lib/services/permissionsService";
import { getStudioSession } from "@/lib/studio/session";
import {
  readPlatformSettings,
  readPlatformVisibility,
  type PlatformSettings,
  type PlatformVisibility,
} from "@/lib/studio/platformSettings";
import { PlatformVisibilityCard } from "./PlatformVisibilityCard";
import { SettingToggleCard } from "./SettingToggleCard";
import { SettingsToolLinkCard } from "./SettingsInfoCards";

export const dynamic = "force-dynamic";

/**
 * Studio settings. Current values are read on the server, so every card
 * opens filled in; each card saves its own setting.
 */
export default async function SettingsPage() {
  const { supabase, profile } = await getStudioSession();

  if (
    !permissionsForProfileRole(profile?.role).includes("studio.settings.manage")
  ) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12">
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900 font-canela">
              Super Admin Access Required
            </CardTitle>
            <CardDescription className="text-gray-600">
              Studio settings tools are limited to super admin accounts.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-gray-600">
            Contact a super admin if you need updates to legal documents, FAQs,
            or platform visibility.
          </CardContent>
        </Card>
      </div>
    );
  }

  const [settingsResult, visibilityResult] = await Promise.allSettled([
    readPlatformSettings(supabase),
    readPlatformVisibility(supabase),
  ]);

  if (settingsResult.status === "rejected") {
    console.error("[studio/settings]", settingsResult.reason);
    return (
      <StudioLoadError message="We couldn’t load the current settings. Please try again." />
    );
  }
  const settings: PlatformSettings = settingsResult.value;
  const visibility: PlatformVisibility | null =
    visibilityResult.status === "fulfilled" ? visibilityResult.value : null;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="space-y-8">
        <BlurIn>
          <div>
            <h1 className="text-3xl font-canela text-gray-900">
              Studio Settings
            </h1>
            <p className="text-gray-600 mt-2">
              Manage your studio configuration and content
            </p>
          </div>
        </BlurIn>

        <BlurIn delay={0.08} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PlatformVisibilityCard
            initialVisibility={visibility}
            loadError={visibility ? null : "Failed to read platform status"}
          />

          <SettingToggleCard
            icon={<UserPlus className="h-5 w-5" />}
            title="Customer Accounts"
            description="Control whether new customers can sign up"
            settingKey="customerSignupEnabled"
            initialEnabled={settings.customerSignupEnabled === "true"}
            on={{
              badge: "Signup is open",
              explanation:
                "Visitors can create a customer account from the header and /signup.",
              action: "Open Signup",
              toast: "Customer signup is now open",
            }}
            off={{
              badge: "Signup is hidden",
              explanation:
                'OmaHub isn\'t selling directly through the site yet, so "Sign up" is hidden everywhere for regular visitors. "Sign in" still works normally, since designers and admins need it. Turn this on when preorders launch with the next edition.',
              action: "Hide Signup",
              toast: "Customer signup is now hidden",
            }}
          />

          <SettingToggleCard
            icon={<ShoppingBag className="h-5 w-5" />}
            title="Catalogues & Products"
            description="Control whether shoppers can browse collections and products"
            settingKey="cataloguesPubliclyVisible"
            initialEnabled={settings.cataloguesPubliclyVisible === "true"}
            on={{
              badge: "Catalogues are live",
              explanation:
                "Brand profiles, collections, and products are visible on the public site.",
              action: "Show Catalogues",
              toast:
                "Catalogues and products are now visible on the public site",
            }}
            off={{
              badge: "Catalogues are hidden",
              explanation:
                "Brand profiles stay visible in the directory, but collections and products are hidden until you turn this on — e.g. when the next pop-up or edition launches.",
              action: "Hide Catalogues",
              toast:
                "Catalogues and products are now hidden — brand profiles stay live",
            }}
          />

          <SettingsToolLinkCard
            icon={FileText}
            bulletIcon={Shield}
            title="Legal Documents"
            description="Manage Terms of Service and Privacy Policy"
            summary="Create and manage your legal documents including Terms of Service and Privacy Policy. These documents are displayed on your public pages and can be versioned for compliance tracking."
            bullets={[
              "Version control and history",
              "Rich text editing",
              "Public page integration",
            ]}
            href="/studio/settings/legal-documents"
            cta="Manage Legal Documents"
          />

          <SettingsToolLinkCard
            icon={HelpCircle}
            bulletIcon={MessageSquare}
            title="FAQ Management"
            description="Manage frequently asked questions"
            summary="Create and organise frequently asked questions that appear throughout your site. Organise by category and control where they display to provide better user support."
            bullets={[
              "Categorised organisation",
              "Page-specific display",
              "Rich text answers",
            ]}
            href="/studio/settings/faqs"
            cta="Manage FAQs"
          />

        </BlurIn>
      </div>
    </div>
  );
}

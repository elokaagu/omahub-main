import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Lock,
  MessageSquare,
  Settings,
  Shield,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/** Card linking to a dedicated settings tool (legal documents, FAQs). */
export function SettingsToolLinkCard({
  icon: Icon,
  bulletIcon: BulletIcon,
  title,
  description,
  summary,
  bullets,
  href,
  cta,
}: {
  icon: LucideIcon;
  bulletIcon: LucideIcon;
  title: string;
  description: string;
  summary: string;
  bullets: string[];
  href: string;
  cta: string;
}) {
  return (
    <Card className="border-oma-beige">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-oma-plum font-canela">
          <Icon className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription className="text-oma-cocoa">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-oma-cocoa/80 mb-4">{summary}</p>
        <div className="space-y-2 text-xs text-oma-cocoa/70">
          {bullets.map((bullet) => (
            <div key={bullet} className="flex items-center gap-2">
              <BulletIcon className="h-3 w-3 text-oma-plum" />
              <span>{bullet}</span>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Button
          asChild
          className="w-full bg-oma-plum hover:bg-oma-plum/90 text-white"
        >
          <Link href={href}>
            {cta}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

const OVERVIEW: {
  icon: LucideIcon;
  iconClass?: string;
  label: string;
  text: string;
}[] = [
  {
    icon: Lock,
    label: "Platform Access",
    text: "Control whether the platform requires a password for access. Remove the password gate when you're ready to launch publicly.",
  },
  {
    icon: Shield,
    label: "Legal + FAQ Controls",
    text: "Use dedicated tools for legal documents and FAQs to manage versions, page visibility, and published content quality.",
  },
  {
    icon: Shield,
    label: "Legal Documents",
    text: "Keep your Terms of Service and Privacy Policy up to date with version control and effective date tracking.",
  },
  {
    icon: MessageSquare,
    label: "FAQ Management",
    text: "Organise helpful information for your users with categorised questions and rich text answers.",
  },
  {
    icon: Settings,
    iconClass: "text-amber-600",
    label: "Access Control",
    text: "These management tools require super admin privileges to ensure content security and compliance.",
  },
];

/** Static explainer at the end of the settings grid. */
export function ContentOverviewCard() {
  return (
    <Card className="border-oma-beige bg-oma-cream/30">
      <CardHeader>
        <CardTitle className="text-oma-plum font-canela">
          Content Management
        </CardTitle>
        <CardDescription className="text-oma-cocoa">
          Overview of access and publishing controls
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 text-sm text-oma-cocoa">
          {OVERVIEW.map(({ icon: Icon, iconClass, label, text }) => (
            <div key={label} className="flex items-start gap-2">
              <Icon
                className={`h-4 w-4 mt-0.5 flex-shrink-0 ${iconClass ?? "text-oma-plum"}`}
              />
              <p>
                <strong>{label}:</strong> {text}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";
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
    <Card className="border-gray-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-900 font-canela">
          <Icon className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription className="text-gray-600">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-4">{summary}</p>
        <div className="space-y-2 text-xs text-gray-500">
          {bullets.map((bullet) => (
            <div key={bullet} className="flex items-center gap-2">
              <BulletIcon className="h-3 w-3 text-gray-900" />
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

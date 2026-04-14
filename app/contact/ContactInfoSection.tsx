import { Instagram, Mail } from "lucide-react";
import { CONTACT_INFO_ITEMS } from "./contactInfoData";

function ContactInfoIcon({ type }: { type: "mail" | "instagram" }) {
  const className = "h-5 w-5 text-oma-plum";
  if (type === "instagram") return <Instagram className={className} />;
  return <Mail className={className} />;
}

export function ContactInfoSection() {
  return (
    <div>
      <h3 className="heading-sm mb-6">Contact Information</h3>
      <div className="space-y-6">
        {CONTACT_INFO_ITEMS.map((item) => (
          <div key={item.id} className="flex items-start gap-4">
            <div className="bg-oma-beige p-3 rounded-full">
              <ContactInfoIcon type={item.icon} />
            </div>
            <div>
              <p className="font-medium text-oma-black">{item.label}</p>
              <a
                href={item.href}
                className="text-oma-cocoa hover:text-oma-plum expand-underline"
                {...(item.external
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
              >
                {item.linkText}
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

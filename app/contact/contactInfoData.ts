export type ContactInfoIcon = "mail" | "instagram";

export type ContactInfoItem = {
  id: string;
  icon: ContactInfoIcon;
  label: string;
  href: string;
  linkText: string;
  external?: boolean;
};

export const CONTACT_INFO_ITEMS: ContactInfoItem[] = [
  {
    id: "email",
    icon: "mail",
    label: "Email",
    href: "mailto:info@oma-hub.com",
    linkText: "info@oma-hub.com",
  },
  {
    id: "instagram",
    icon: "instagram",
    label: "Instagram",
    href: "https://www.instagram.com/_omahub/",
    linkText: "@omahub",
    external: true,
  },
  {
    id: "collaboration",
    icon: "mail",
    label: "Collaboration",
    href: "mailto:info@oma-hub.com",
    linkText: "info@oma-hub.com",
  },
];

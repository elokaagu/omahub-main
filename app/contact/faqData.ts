export type FaqItem = {
  id: string;
  title: string;
  body: string;
  bodyClassName?: string;
};

export const CONTACT_FAQ_ITEMS: FaqItem[] = [
  {
    id: "designers-join",
    title: "How can designers join OmaHub?",
    body: "Designers can apply to join our platform through the 'Join the Hub' page. Our curation team reviews each application to ensure the highest quality standards.",
  },
  {
    id: "regions",
    title: "What regions do you currently cover?",
    body: "We currently showcase designers from around the world, with a focus on emerging talent and unique perspectives.",
    bodyClassName: "text-lg mb-8",
  },
  {
    id: "connect-designer",
    title: "How do I connect with a designer?",
    body: "Each designer's profile includes a 'Contact Designer' button where you can reach out directly. Our team can also help facilitate introductions for special projects.",
  },
  {
    id: "shipping",
    title: "Do you offer shipping for products?",
    body: "OmaHub is primarily a discovery and connection platform. Shipping arrangements are made directly between clients and designers after initial introduction.",
  },
];

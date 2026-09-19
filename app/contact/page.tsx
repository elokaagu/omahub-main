import { ContactPageContent } from "./ContactPageContent";
import { CONTACT_FAQ_ITEMS } from "./faqData";
import { getPublicFaqs } from "@/lib/services/publicFaqService";
import { faqAnswerPlainText } from "@/lib/faqAnswerRendering";

export { metadata } from "./metadata";
export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const { faqs } = await getPublicFaqs({ pageLocation: "contact" });
  const faqItems =
    faqs.length > 0
      ? faqs.map((faq) => ({
          id: faq.id,
          title: faq.question,
          body: faqAnswerPlainText(faq.answer),
        }))
      : CONTACT_FAQ_ITEMS;

  return <ContactPageContent faqItems={faqItems} />;
}

import { JoinPageContent } from "./JoinPageContent";
import { joinFaqItems } from "./joinFaqData";
import { getPublicFaqs } from "@/lib/services/publicFaqService";
import { faqAnswerPlainText } from "@/lib/faqAnswerRendering";

export { metadata } from "./metadata";
export const dynamic = "force-dynamic";

export default async function JoinPage() {
  const { faqs } = await getPublicFaqs({ pageLocation: "join" });
  const faqItems =
    faqs.length > 0
      ? faqs.map((faq) => ({
          question: faq.question,
          answer: faqAnswerPlainText(faq.answer),
        }))
      : [...joinFaqItems];

  return <JoinPageContent faqItems={faqItems} />;
}

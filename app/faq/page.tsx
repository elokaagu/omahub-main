import { FAQStructuredData } from "@/components/seo/StructuredData";
import { getPublicFaqs } from "@/lib/services/publicFaqService";
import { faqAnswerPlainText } from "@/lib/faqAnswerRendering";
import { FaqPageContent } from "./FaqPageContent";

export { metadata } from "./metadata";
export const dynamic = "force-dynamic";

export default async function FAQPage() {
  const { faqs, error } = await getPublicFaqs();

  const structuredFaqs = faqs.map((f) => ({
    question: f.question,
    answer: faqAnswerPlainText(f.answer),
  }));

  return (
    <>
      {structuredFaqs.length > 0 ? (
        <FAQStructuredData faqs={structuredFaqs} />
      ) : null}

      <FaqPageContent faqs={faqs} error={error} />
    </>
  );
}

import { useState, useEffect } from "react";
import type { FAQItem } from "@/components/ui/faq";

interface DatabaseFAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  display_order: number;
  is_active: boolean;
  page_location: string;
  created_at: string;
  updated_at: string;
}

interface UseFAQsOptions {
  page_location?: string;
  category?: string;
  /** Ignored: `/api/faqs` only returns active rows. Use `/api/admin/faqs` in studio. */
  include_inactive?: boolean;
}

interface UseFAQsReturn {
  faqs: FAQItem[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useFAQs(options: UseFAQsOptions = {}): UseFAQsReturn {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFAQs = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();

      if (options.page_location) {
        params.append("page_location", options.page_location);
      }

      if (options.category) {
        params.append("category", options.category);
      }

      const response = await fetch(`/api/faqs?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch FAQs");
      }

      // Transform database FAQs to FAQ component format
      const transformedFAQs: FAQItem[] = data.faqs.map((faq: DatabaseFAQ) => ({
        id: faq.id,
        question: faq.question,
        answer: faq.answer,
      }));

      setFaqs(transformedFAQs);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      console.error("Error fetching FAQs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFAQs();
  }, [options.page_location, options.category]);

  return {
    faqs,
    loading,
    error,
    refetch: fetchFAQs,
  };
}

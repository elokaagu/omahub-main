import { FAQ, commonFAQs, type FAQItem } from "@/components/ui/faq";
import { useFAQs } from "@/hooks/useFAQs";

// Example 1: Basic FAQ with custom items
const customFAQItems: FAQItem[] = [
  {
    id: "shipping",
    question: "What are your shipping options?",
    answer:
      "We offer standard shipping (5-7 business days) and express shipping (2-3 business days). Free shipping is available on orders over $50.",
  },
  {
    id: "returns",
    question: "What is your return policy?",
    answer:
      "We accept returns within 30 days of purchase. Items must be in original condition with tags attached. Return shipping is free for defective items.",
  },
  {
    id: "sizing",
    question: "How do I find the right size?",
    answer:
      "Check our detailed size guide available on each product page. If you're between sizes, we recommend sizing up. Our customer service team is also happy to help with sizing questions.",
  },
];

// Example 2: FAQ with React components as answers
const advancedFAQItems: FAQItem[] = [
  {
    id: "contact",
    question: "How can I contact customer support?",
    answer: (
      <div className="space-y-2">
        <p>You can reach us through multiple channels:</p>
        <ul className="list-disc list-inside space-y-1 ml-4">
          <li>Email: info@oma-hub.com</li>
          <li>Phone: +1 (555) 123-4567</li>
          <li>Live chat: Available 9 AM - 6 PM EST</li>
        </ul>
        <p className="text-sm text-muted-foreground mt-3">
          Average response time is under 2 hours during business hours.
        </p>
      </div>
    ),
  },
  {
    id: "payment",
    question: "What payment methods do you accept?",
    answer: (
      <div className="space-y-2">
        <p>We accept all major payment methods:</p>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <div className="flex items-center space-x-2">
            <span className="text-sm">💳</span>
            <span className="text-sm">Credit Cards</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm">🏦</span>
            <span className="text-sm">Bank Transfer</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm">📱</span>
            <span className="text-sm">Mobile Payments</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm">🔒</span>
            <span className="text-sm">Secure Checkout</span>
          </div>
        </div>
      </div>
    ),
  },
];

// Example component showing dynamic FAQ usage
function DynamicFAQExample({ pageLocation }: { pageLocation?: string }) {
  const { faqs, loading, error } = useFAQs({
    page_location: pageLocation,
    include_inactive: false,
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-24 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-lg">
        <p>Error loading FAQs: {error}</p>
      </div>
    );
  }

  if (faqs.length === 0) {
    return (
      <div className="p-4 bg-gray-50 text-gray-600 rounded-lg text-center">
        <p>No FAQs available for this section.</p>
      </div>
    );
  }

  return (
    <FAQ
      items={faqs}
      title="Frequently Asked Questions"
      subtitle="Find answers from our database"
      variant="bordered"
    />
  );
}

export function FAQExamples() {
  return (
    <div className="container mx-auto py-12 space-y-16">
      {/* Example 1: Default Style */}
      <section>
        <h2 className="text-2xl font-bold mb-6">Default FAQ Style</h2>
        <FAQ
          items={customFAQItems}
          title="Frequently Asked Questions"
          subtitle="Find answers to common questions about our products and services"
        />
      </section>

      {/* Example 2: Bordered Style */}
      <section>
        <h2 className="text-2xl font-bold mb-6">Bordered FAQ Style</h2>
        <FAQ
          items={commonFAQs.general}
          variant="bordered"
          title="About OmaHub"
        />
      </section>

      {/* Example 3: Minimal Style */}
      <section>
        <h2 className="text-2xl font-bold mb-6">Minimal FAQ Style</h2>
        <FAQ
          items={commonFAQs.brandOwners}
          variant="minimal"
          title="For Brand Owners"
        />
      </section>

      {/* Example 4: Multiple Open Items */}
      <section>
        <h2 className="text-2xl font-bold mb-6">Multiple Items Open</h2>
        <FAQ
          items={commonFAQs.technical}
          type="multiple"
          title="Technical Support"
          defaultValue={["supported-browsers", "mobile-app"]}
        />
      </section>

      {/* Example 5: Advanced with React Components */}
      <section>
        <h2 className="text-2xl font-bold mb-6">
          Advanced FAQ with Components
        </h2>
        <FAQ
          items={advancedFAQItems}
          variant="bordered"
          title="Customer Support"
          subtitle="Get in touch with our team"
        />
      </section>

      {/* Example 6: Compact Without Title */}
      <section>
        <h2 className="text-2xl font-bold mb-6">Compact FAQ</h2>
        <div className="max-w-2xl">
          <FAQ
            items={customFAQItems.slice(0, 2)}
            variant="minimal"
            className="bg-muted/30 p-6 rounded-lg"
          />
        </div>
      </section>

      {/* Example 7: Dynamic FAQ from Database */}
      <section>
        <h2 className="text-2xl font-bold mb-6">Dynamic FAQ from Database</h2>
        <div className="space-y-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">General FAQs</h3>
            <DynamicFAQExample pageLocation="general" />
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">How It Works FAQs</h3>
            <DynamicFAQExample pageLocation="how-it-works" />
          </div>
        </div>
      </section>
    </div>
  );
}

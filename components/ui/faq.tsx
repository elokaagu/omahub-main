import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export interface FAQItem {
  id: string;
  question: string;
  answer: string | React.ReactNode;
}

export interface FAQProps {
  items: FAQItem[];
  className?: string;
  title?: string;
  subtitle?: string;
  type?: "single" | "multiple";
  collapsible?: boolean;
  defaultValue?: string | string[];
  variant?: "default" | "bordered" | "minimal";
}

const FAQ = React.forwardRef<React.ElementRef<typeof Accordion>, FAQProps>(
  (
    {
      items,
      className,
      title,
      subtitle,
      type = "single",
      collapsible = true,
      defaultValue,
      variant = "default",
      ...props
    },
    ref
  ) => {
    const getVariantStyles = () => {
      switch (variant) {
        case "bordered":
          return "border rounded-lg p-4 bg-card";
        case "minimal":
          return "space-y-2";
        default:
          return "space-y-1";
      }
    };

    const getItemStyles = () => {
      switch (variant) {
        case "bordered":
          return "border-0 border-b last:border-b-0 px-0";
        case "minimal":
          return "border-0 bg-muted/50 rounded-lg px-4 py-2";
        default:
          return "";
      }
    };

    const getTriggerStyles = () => {
      switch (variant) {
        case "minimal":
          return "hover:no-underline py-3";
        default:
          return "";
      }
    };

    const getContentStyles = () => {
      switch (variant) {
        case "minimal":
          return "px-0 pb-3";
        default:
          return "";
      }
    };

    return (
      <div className={cn("w-full", className)}>
        {(title || subtitle) && (
          <div className="mb-8 text-center">
            {title && (
              <h2 className="text-3xl font-bold tracking-tight mb-4">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                {subtitle}
              </p>
            )}
          </div>
        )}

        {type === "single" ? (
          <Accordion
            ref={ref}
            type="single"
            collapsible={collapsible}
            defaultValue={
              typeof defaultValue === "string" ? defaultValue : undefined
            }
            className={cn(getVariantStyles())}
            {...props}
          >
            {items.map((item) => (
              <AccordionItem
                key={item.id}
                value={item.id}
                className={cn(getItemStyles())}
              >
                <AccordionTrigger
                  className={cn("text-left font-medium", getTriggerStyles())}
                >
                  {item.question}
                </AccordionTrigger>
                <AccordionContent
                  className={cn("text-muted-foreground", getContentStyles())}
                >
                  {typeof item.answer === "string" ? (
                    <div className="prose prose-sm max-w-none">
                      {item.answer.split("\n").map((line, index) => (
                        <p key={index} className={index > 0 ? "mt-2" : ""}>
                          {line}
                        </p>
                      ))}
                    </div>
                  ) : (
                    item.answer
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <Accordion
            ref={ref}
            type="multiple"
            defaultValue={
              Array.isArray(defaultValue) ? defaultValue : undefined
            }
            className={cn(getVariantStyles())}
            {...props}
          >
            {items.map((item) => (
              <AccordionItem
                key={item.id}
                value={item.id}
                className={cn(getItemStyles())}
              >
                <AccordionTrigger
                  className={cn("text-left font-medium", getTriggerStyles())}
                >
                  {item.question}
                </AccordionTrigger>
                <AccordionContent
                  className={cn("text-muted-foreground", getContentStyles())}
                >
                  {typeof item.answer === "string" ? (
                    <div className="prose prose-sm max-w-none">
                      {item.answer.split("\n").map((line, index) => (
                        <p key={index} className={index > 0 ? "mt-2" : ""}>
                          {line}
                        </p>
                      ))}
                    </div>
                  ) : (
                    item.answer
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>
    );
  }
);

FAQ.displayName = "FAQ";

// Predefined FAQ sections for common use cases
export const commonFAQs = {
  general: [
    {
      id: "what-is-omahub",
      question: "What is OmaHub?",
      answer:
        "OmaHub is a comprehensive platform that connects you with talented designers, brands, and creative professionals. We help you discover unique products and services while supporting local and international creators.",
    },
    {
      id: "how-to-get-started",
      question: "How do I get started?",
      answer:
        "Getting started is easy! Simply create an account, browse our categories, and start exploring amazing brands and designers. You can save your favorites, contact designers directly, and even showcase your own work if you're a creator.",
    },
    {
      id: "is-it-free",
      question: "Is OmaHub free to use?",
      answer:
        "Yes, browsing and discovering brands on OmaHub is completely free. Some premium features for brand owners and advanced tools may require a subscription, but basic usage is always free.",
    },
  ],

  brandOwners: [
    {
      id: "how-to-list-brand",
      question: "How can I list my brand on OmaHub?",
      answer:
        "To list your brand, create an account and navigate to the 'Add Brand' section. Fill out your brand information, upload high-quality images, and provide detailed descriptions of your products or services.",
    },
    {
      id: "brand-approval-process",
      question: "What is the brand approval process?",
      answer:
        "Once you submit your brand, our team reviews it to ensure it meets our quality standards. This process typically takes 1-2 business days. You'll receive an email notification once your brand is approved and live on the platform.",
    },
    {
      id: "brand-fees",
      question: "Are there any fees for listing my brand?",
      answer:
        "Basic brand listings are free. We offer premium features and enhanced visibility options for a small monthly fee. Check our pricing page for detailed information about premium features.",
    },
  ],

  technical: [
    {
      id: "supported-browsers",
      question: "Which browsers are supported?",
      answer:
        "OmaHub works best on modern browsers including Chrome, Firefox, Safari, and Edge. We recommend keeping your browser updated for the best experience.",
    },
    {
      id: "mobile-app",
      question: "Is there a mobile app?",
      answer:
        "Currently, OmaHub is available as a responsive web application that works great on mobile devices. A dedicated mobile app is in development and will be available soon.",
    },
    {
      id: "report-issue",
      question: "How do I report a technical issue?",
      answer:
        "If you encounter any technical issues, please contact our support team through the help section or email us directly. Include details about your browser, device, and the specific issue you're experiencing.",
    },
  ],
};

export { FAQ };

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { SectionHeader } from "@/components/ui/section-header";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useToast } from "@/components/ui/use-toast";
import { fadeIn, staggerChildren, slideIn } from "@/app/utils/animations";

export default function Join() {
  const [formData, setFormData] = useState({
    brandName: "",
    designerName: "",
    email: "",
    phone: "",
    website: "",
    instagram: "",
    location: "",
    category: "",
    description: "",
    yearFounded: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    setTimeout(() => {
      toast({
        title: "Application Submitted!",
        description:
          "Thank you for your interest in joining Oma Hub. We&apos;ll review your application and get back to you soon.",
      });
      setIsSubmitting(false);
      setFormData({
        brandName: "",
        designerName: "",
        email: "",
        phone: "",
        website: "",
        instagram: "",
        location: "",
        category: "",
        description: "",
        yearFounded: "",
      });
    }, 1500);
  };

  return (
    <>
      {/* Hero Section */}
      <motion.section
        initial="hidden"
        animate="visible"
        variants={staggerChildren}
        className="pt-24 pb-16 px-6 bg-gradient-to-r from-oma-gold/20 to-oma-cocoa/20"
      >
        <motion.div variants={fadeIn} className="max-w-3xl mx-auto text-center">
          <SectionHeader
            title="Join Our Designer Community"
            subtitle="Apply to become part of our curated directory of innovative fashion designers"
            centered={true}
            titleClassName="font-canela text-3xl md:text-4xl"
            subtitleClassName="text-oma-cocoa/80"
          />
          <p className="text-lg text-oma-cocoa mb-8">
            We look for exceptional design, quality craftsmanship, and a
            commitment to representing global fashion perspectives.
          </p>
        </motion.div>
      </motion.section>

      {/* Application Form Section */}
      <motion.section
        initial="hidden"
        animate="visible"
        variants={staggerChildren}
        className="py-16 px-6"
      >
        <motion.div variants={slideIn} className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
            <div className="lg:col-span-3">
              <h2 className="heading-sm mb-6">Designer Application</h2>

              <motion.form
                variants={fadeIn}
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="brandName">Brand Name *</Label>
                    <Input
                      id="brandName"
                      name="brandName"
                      value={formData.brandName}
                      onChange={handleChange}
                      required
                      className="border-oma-gold/20"
                    />
                  </div>

                  <div>
                    <Label htmlFor="designerName">Designer Name *</Label>
                    <Input
                      id="designerName"
                      name="designerName"
                      value={formData.designerName}
                      onChange={handleChange}
                      required
                      className="border-oma-gold/20"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="border-oma-gold/20"
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="border-oma-gold/20"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="website">Website (if available)</Label>
                      <Input
                        id="website"
                        name="website"
                        value={formData.website}
                        onChange={handleChange}
                        className="border-oma-gold/20"
                      />
                    </div>

                    <div>
                      <Label htmlFor="instagram">Instagram Handle</Label>
                      <Input
                        id="instagram"
                        name="instagram"
                        value={formData.instagram}
                        onChange={handleChange}
                        className="border-oma-gold/20"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="location">Location *</Label>
                      <Input
                        id="location"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        required
                        className="border-oma-gold/20"
                        placeholder="City, Country"
                      />
                    </div>

                    <div>
                      <Label htmlFor="category">Primary Category *</Label>
                      <select
                        id="category"
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        required
                        className="w-full rounded-md border border-oma-gold/20 bg-white px-3 py-2 h-10"
                      >
                        <option value="">Select a category</option>
                        <option value="Bridal">Bridal</option>
                        <option value="Ready to Wear">Ready to Wear</option>
                        <option value="Tailoring">Tailoring</option>
                        <option value="Accessories">Accessories</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">
                      Tell us about your brand *
                    </Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      required
                      className="border-oma-gold/20 min-h-[120px]"
                      placeholder="Share your brand's story, vision, and what makes it unique..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="yearFounded">Year Founded</Label>
                    <Input
                      id="yearFounded"
                      name="yearFounded"
                      type="number"
                      value={formData.yearFounded}
                      onChange={handleChange}
                      className="border-oma-gold/20"
                      placeholder="e.g. 2020"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-oma-plum hover:bg-oma-plum/90"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Submit Application"}
                </Button>
              </motion.form>
            </div>

            <div className="lg:col-span-2">
              <div className="sticky top-24">
                <h2 className="heading-sm mb-6">Frequently Asked Questions</h2>

                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="item-1">
                    <AccordionTrigger>
                      What are the requirements to join?
                    </AccordionTrigger>
                    <AccordionContent>
                      We look for designers with a distinct aesthetic, quality
                      craftsmanship, and a commitment to representing African
                      fashion authentically. You should have an established
                      brand with at least one collection or product line.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-2">
                    <AccordionTrigger>
                      How does the verification process work?
                    </AccordionTrigger>
                    <AccordionContent>
                      After submission, our team reviews your application and
                      may request additional information or samples. The
                      verification process typically takes 2-3 weeks and
                      includes checks on your brand identity, product quality,
                      and customer service.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-3">
                    <AccordionTrigger>Is there a fee to join?</AccordionTrigger>
                    <AccordionContent>
                      Currently, joining Oma Hub is free for approved designers.
                      In the future, we may introduce premium listing options
                      with additional features and exposure.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-4">
                    <AccordionTrigger>
                      What happens after I&apos;m approved?
                    </AccordionTrigger>
                    <AccordionContent>
                      Once approved, we&apos;ll help you create your brand
                      profile, including professional photography of your
                      collections if needed. You&apos;ll be featured in our
                      directory and may be included in editorial content and
                      newsletters.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-5">
                    <AccordionTrigger>
                      How will customers contact me?
                    </AccordionTrigger>
                    <AccordionContent>
                      Interested customers can reach out through a contact form
                      on your brand profile, which will send inquiries directly
                      to your email. We do not handle transactions or
                      communications between you and potential clients.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                <div className="mt-8 bg-oma-beige p-6 rounded-lg">
                  <h3 className="font-canela text-xl mb-4">
                    Need More Information?
                  </h3>
                  <p className="text-oma-cocoa mb-4">
                    If you have additional questions about joining Oma Hub or
                    need assistance with your application, our team is here to
                    help.
                  </p>
                  <a
                    href="mailto:designers@omahub.com"
                    className="text-oma-plum font-medium hover:text-oma-plum/80 expand-underline"
                  >
                    Contact Our Designer Relations Team
                  </a>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.section>
    </>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { SectionHeader } from "@/components/ui/section-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Search,
  ShoppingBag,
  MessageCircle,
  CheckCircle,
  ChevronDown,
} from "lucide-react";

export default function HowItWorks() {
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  const toggleFaq = (id: string) => {
    setOpenFaq(openFaq === id ? null : id);
  };

  return (
    <div className="w-full bg-gradient-to-b from-oma-beige/50 to-white pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeader
          title="How OmaHub Works"
          subtitle="Your guide to discovering and connecting with Africa's most innovative fashion designers"
          centered={true}
          titleClassName="text-4xl md:text-5xl font-canela"
          subtitleClassName="text-base text-oma-cocoa/80 mt-2"
        />

        {/* Three-step process */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: <Search className="h-10 w-10 mb-4 text-oma-plum" />,
              title: "Discover",
              description:
                "Browse our curated directory of Africa's top fashion designers and filter by style, location, and specialty.",
            },
            {
              icon: <MessageCircle className="h-10 w-10 mb-4 text-oma-plum" />,
              title: "Connect",
              description:
                "Directly message designers to discuss your needs, schedule consultations, and bring your vision to life.",
            },
            {
              icon: <ShoppingBag className="h-10 w-10 mb-4 text-oma-plum" />,
              title: "Create",
              description:
                "From concept to creation, work with designers to create custom pieces or shop their existing collections.",
            },
          ].map((step, index) => (
            <div
              key={index}
              className="flex flex-col items-center text-center p-8 bg-white rounded-lg shadow-sm animate-fade-in"
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              {step.icon}
              <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
              <p className="text-oma-cocoa">{step.description}</p>
            </div>
          ))}
        </div>

        {/* For clients and designers tabs */}
        <div className="mt-24">
          <Tabs defaultValue="clients" className="w-full">
            <div className="flex justify-center mb-8">
              <TabsList className="bg-oma-cream/50">
                <TabsTrigger value="clients" className="px-8 py-3">
                  For Clients
                </TabsTrigger>
                <TabsTrigger value="designers" className="px-8 py-3">
                  For Designers
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="clients" className="animate-fade-in">
              <div className="max-w-4xl mx-auto">
                <h3 className="font-canela text-3xl mb-6 text-center">
                  Find Your Perfect Designer
                </h3>
                <p className="text-center text-lg mb-12">
                  From custom wedding gowns to ready to wear collections,
                  connect with talented African designers who bring your vision
                  to life.
                </p>

                <div className="space-y-6">
                  {[
                    {
                      title: "Create Your Account",
                      description:
                        "Sign up for free and complete your style profile to help designers understand your preferences.",
                      icon: (
                        <CheckCircle className="h-6 w-6 text-oma-gold flex-shrink-0" />
                      ),
                    },
                    {
                      title: "Browse the Directory",
                      description:
                        "Explore our curated selection of designers filtered by specialty, location, and style.",
                      icon: (
                        <CheckCircle className="h-6 w-6 text-oma-gold flex-shrink-0" />
                      ),
                    },
                    {
                      title: "Connect Directly",
                      description:
                        "Message designers, share your inspiration, and discuss your project needs.",
                      icon: (
                        <CheckCircle className="h-6 w-6 text-oma-gold flex-shrink-0" />
                      ),
                    },
                    {
                      title: "Schedule Consultations",
                      description:
                        "Book virtual or in-person consultations to discuss details, measurements, and timelines.",
                      icon: (
                        <CheckCircle className="h-6 w-6 text-oma-gold flex-shrink-0" />
                      ),
                    },
                    {
                      title: "Bring Your Vision to Life",
                      description:
                        "Work directly with the designer to create your custom piece or purchase from their collections.",
                      icon: (
                        <CheckCircle className="h-6 w-6 text-oma-gold flex-shrink-0" />
                      ),
                    },
                  ].map((step, index) => (
                    <div key={index} className="flex gap-4 items-start">
                      {step.icon}
                      <div>
                        <h4 className="font-semibold text-lg">{step.title}</h4>
                        <p className="text-oma-cocoa">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-12 flex justify-center">
                  <Button
                    asChild
                    className="bg-oma-plum hover:bg-oma-plum/90 px-8"
                  >
                    <Link href="/directory">Browse Designers</Link>
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="designers" className="animate-fade-in">
              <div className="max-w-4xl mx-auto">
                <h3 className="font-canela text-3xl mb-6 text-center">
                  Showcase Your Collection
                </h3>
                <p className="text-center text-lg mb-12">
                  Join a community of Africa&rsquo;s top fashion talent and
                  connect with clients looking for your unique design
                  perspective.
                </p>

                <div className="space-y-6">
                  {[
                    {
                      title: "Apply to Join",
                      description:
                        "Tell us about your brand and submit your portfolio for a quick review process.",
                      icon: (
                        <CheckCircle className="h-6 w-6 text-oma-gold flex-shrink-0" />
                      ),
                    },
                    {
                      title: "Create Your Profile",
                      description:
                        "Build your brand profile with photos, designer bio, specialties, and collection highlights.",
                      icon: (
                        <CheckCircle className="h-6 w-6 text-oma-gold flex-shrink-0" />
                      ),
                    },
                    {
                      title: "Showcase Your Work",
                      description:
                        "Upload photos of your designs, past collections, and create lookbooks for potential clients.",
                      icon: (
                        <CheckCircle className="h-6 w-6 text-oma-gold flex-shrink-0" />
                      ),
                    },
                    {
                      title: "Connect with Clients",
                      description:
                        "Receive inquiries directly from interested clients and manage conversations through our platform.",
                      icon: (
                        <CheckCircle className="h-6 w-6 text-oma-gold flex-shrink-0" />
                      ),
                    },
                    {
                      title: "Grow Your Business",
                      description:
                        "Schedule consultations, negotiate terms, and build your client base across Africa and beyond.",
                      icon: (
                        <CheckCircle className="h-6 w-6 text-oma-gold flex-shrink-0" />
                      ),
                    },
                  ].map((step, index) => (
                    <div key={index} className="flex gap-4 items-start">
                      {step.icon}
                      <div>
                        <h4 className="font-semibold text-lg">{step.title}</h4>
                        <p className="text-oma-cocoa">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-12 flex justify-center">
                  <Button
                    asChild
                    className="bg-oma-plum hover:bg-oma-plum/90 px-8"
                  >
                    <Link href="/join">Join as a Designer</Link>
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Featured categories */}
        <div className="mt-24">
          <SectionHeader
            title="Discover By Category"
            subtitle="Explore a wide range of fashion specialties from our talented designer community"
            centered={true}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
            {[
              {
                title: "Bridal",
                image:
                  "/lovable-uploads/53ab4ec9-fd54-4aa8-a292-70669af33185.png",
                description: "Custom wedding gowns and bridal accessories",
                link: "/directory?category=bridal",
              },
              {
                title: "Ready to Wear",
                image:
                  "/lovable-uploads/6f7a1022-2d82-4fb9-9365-6455df679707.png",
                description: "Everyday fashion with an African twist",
                link: "/directory?category=rtw",
              },
              {
                title: "Occasion Wear",
                image:
                  "/lovable-uploads/4f01c882-4b82-47ba-abfc-ce5e9b778ad1.png",
                description: "Statement pieces for special events",
                link: "/directory?category=occasion",
              },
              {
                title: "Accessories",
                image:
                  "/lovable-uploads/882a0fa9-6672-4dec-97a7-b2caaddb0fa0.png",
                description: "Handcrafted jewelry, bags, and more",
                link: "/directory?category=accessories",
              },
            ].map((category, index) => (
              <Link
                key={index}
                href={category.link}
                className="block group relative bg-white rounded-lg overflow-hidden shadow-sm hover-scale"
              >
                <div className="aspect-square">
                  <Image
                    src={category.image}
                    alt={category.title}
                    width={400}
                    height={400}
                    className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-300"></div>
                  <div className="absolute inset-0 flex flex-col justify-end p-6">
                    <h3 className="text-xl font-bold text-white">
                      {category.title}
                    </h3>
                    <p className="text-white/90 text-sm mt-1">
                      {category.description}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Frequently Asked Questions */}
        <div className="mt-24">
          <SectionHeader
            title="Frequently Asked Questions"
            subtitle="Get answers to common questions about using Oma Hub"
            centered={true}
          />

          <div className="max-w-3xl mx-auto mt-8">
            {[
              {
                id: "faq-1",
                question: "How do I find a designer for my specific needs?",
                answer:
                  "You can browse our directory and filter designers by specialty, location, style, and more. Each designer profile includes a portfolio of their work, specialties, and contact information. You can also message designers directly through our platform to discuss your project needs.",
              },
              {
                id: "faq-2",
                question: "Are consultations with designers free?",
                answer:
                  "Initial consultations vary by designer. Some offer free initial consultations, while others may charge a fee that can be applied to your final purchase. Consultation details and pricing are listed on each designer&rsquo;s profile page.",
              },
              {
                id: "faq-3",
                question: "How does payment work?",
                answer:
                  "Payment terms are arranged directly between you and the designer. Most designers require a deposit to begin work, with the balance due upon completion. Oma Hub does not process payments but provides a secure environment for you to communicate and arrange terms.",
              },
              {
                id: "faq-4",
                question:
                  "Can I order custom designs if I'm not in the same country as the designer?",
                answer:
                  "Yes! Many of our designers work with international clients. Virtual consultations, digital sketches, and international shipping make the process seamless. Designers will typically guide you through the measurement process and may recommend local tailors for final adjustments if needed.",
              },
              {
                id: "faq-5",
                question: "How are designers selected for Oma Hub?",
                answer:
                  "We have a careful vetting process that evaluates designers based on their portfolio, craftsmanship, experience, and client reviews. Our goal is to showcase Africa's top fashion talent across a range of specialties and price points.",
              },
            ].map((faq) => (
              <Collapsible
                key={faq.id}
                open={openFaq === faq.id}
                onOpenChange={() => toggleFaq(faq.id)}
                className="border-b border-gray-200 py-4"
              >
                <div className="flex justify-between items-center">
                  <CollapsibleTrigger className="flex justify-between items-center w-full text-left font-semibold text-lg hover:text-oma-plum transition-colors">
                    {faq.question}
                    <ChevronDown
                      className={`ml-2 h-5 w-5 flex-shrink-0 transition-transform ${
                        openFaq === faq.id ? "rotate-180" : ""
                      }`}
                    />
                  </CollapsibleTrigger>
                </div>
                <CollapsibleContent className="pt-2 pb-4 text-oma-cocoa">
                  <p>{faq.answer}</p>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-24">
          <div className="bg-gradient-to-r from-oma-plum/10 to-oma-gold/10 rounded-xl p-8 md:p-12 text-center">
            <h2 className="font-canela text-3xl md:text-4xl mb-4">
              Ready to Find Your Designer?
            </h2>
            <p className="text-lg max-w-2xl mx-auto mb-8">
              Explore our directory of talented African designers and start
              bringing your fashion vision to life today.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild className="bg-oma-plum hover:bg-oma-plum/90 px-8">
                <Link href="/directory">Browse Designers</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-oma-plum text-oma-plum hover:bg-oma-plum hover:text-white px-8"
              >
                <Link href="/join">Join as a Designer</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

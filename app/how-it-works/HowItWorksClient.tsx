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

export default function HowItWorksClient() {
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
                name: "Bridal",
                image:
                  "/lovable-uploads/57cc6a40-0f0d-4a7d-8786-41f15832ebfb.png",
                description: "Custom wedding gowns and bridal party attire",
                link: "/directory?category=Bridal",
              },
              {
                name: "Ready to Wear",
                image:
                  "/lovable-uploads/4a7c7e86-6cde-4d07-a246-a5aa4cb6fa51.png",
                description: "Contemporary everyday fashion with African flair",
                link: "/directory?category=Ready%20to%20Wear",
              },
              {
                name: "Accessories",
                image:
                  "/lovable-uploads/25c3fe26-3fc4-43ef-83ac-6931a74468c0.png",
                description: "Handcrafted jewelry, bags, and statement pieces",
                link: "/directory?category=Accessories",
              },
              {
                name: "Tailoring",
                image:
                  "/lovable-uploads/99ca757a-bed8-422e-b155-0b9d365b58e0.png",
                description: "Bespoke suits, formal wear, and custom fitting",
                link: "/directory?category=Tailoring",
              },
            ].map((category, index) => (
              <Link
                key={index}
                href={category.link}
                className="group overflow-hidden rounded-lg bg-white shadow-sm hover:shadow-md transition-all"
              >
                <div className="aspect-[4/3] relative">
                  <Image
                    src={category.image}
                    alt={category.name}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="p-6">
                  <h3 className="font-semibold text-lg group-hover:text-oma-plum transition-colors">
                    {category.name}
                  </h3>
                  <p className="text-oma-cocoa/80 text-sm mt-2">
                    {category.description}
                  </p>
                  <p className="text-oma-plum text-sm mt-4">View Designers →</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* FAQ section */}
        <div className="mt-24">
          <SectionHeader
            title="Frequently Asked Questions"
            subtitle="Everything you need to know about OmaHub"
            centered={true}
          />

          <div className="max-w-3xl mx-auto mt-8 space-y-4">
            {[
              {
                id: "faq1",
                question: "How do I find a designer for my specific needs?",
                answer:
                  "You can browse our directory and filter by location, specialty, and style. Each designer profile includes their portfolio, reviews, and areas of expertise to help you find the perfect match.",
              },
              {
                id: "faq2",
                question: "What happens after I contact a designer?",
                answer:
                  "Once you reach out, you'll discuss your project directly with the designer. They'll guide you through their process, which typically includes consultation, design concept, measurements, creation, and delivery.",
              },
              {
                id: "faq3",
                question: "How are payments handled on OmaHub?",
                answer:
                  "Payments are arranged directly between you and the designer. Most designers require a deposit to begin work, with the remaining balance due at different stages or upon completion.",
              },
              {
                id: "faq4",
                question: "Do designers offer international shipping?",
                answer:
                  "Many designers on our platform offer international shipping. Shipping policies, costs, and timeframes vary by designer and should be discussed during your initial consultation.",
              },
              {
                id: "faq5",
                question: "How can I become a featured designer on OmaHub?",
                answer:
                  "We're always looking for talented African designers to join our platform. Click on 'Join as a Designer' to apply, and our team will review your portfolio and brand information.",
              },
            ].map((faq) => (
              <Collapsible
                key={faq.id}
                open={openFaq === faq.id}
                onOpenChange={() => toggleFaq(faq.id)}
                className="border border-oma-gold/20 rounded-lg overflow-hidden"
              >
                <CollapsibleTrigger className="flex justify-between items-center w-full p-6 text-left bg-white hover:bg-oma-cream/30 transition-colors">
                  <h4 className="font-medium text-lg">{faq.question}</h4>
                  <ChevronDown
                    className={`h-5 w-5 text-oma-plum transition-transform ${
                      openFaq === faq.id ? "rotate-180" : ""
                    }`}
                  />
                </CollapsibleTrigger>
                <CollapsibleContent className="p-6 pt-0 bg-white">
                  <p className="text-oma-cocoa">{faq.answer}</p>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </div>

        {/* CTA section */}
        <div className="mt-24 bg-gradient-to-r from-oma-plum/10 to-oma-gold/10 rounded-xl p-8 md:p-12 text-center">
          <h2 className="font-canela text-3xl md:text-4xl mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-lg max-w-2xl mx-auto mb-8">
            Discover talented African designers or showcase your own brand on
            OmaHub today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild className="bg-oma-plum hover:bg-oma-plum/90">
              <Link href="/directory">Find a Designer</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-oma-plum text-oma-plum hover:bg-oma-plum hover:text-white"
            >
              <Link href="/join">Join as a Designer</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

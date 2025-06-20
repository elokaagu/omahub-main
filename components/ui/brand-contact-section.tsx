"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Instagram,
  Globe,
  MessageCircle,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";
import WhatsAppContact from "./whatsapp-contact";
import {
  isValidWhatsAppNumber,
  formatPhoneForDisplay,
} from "@/lib/utils/phoneUtils";
import type { BrandData } from "@/lib/data/brands";

interface BrandContactSectionProps {
  brandData: BrandData;
  onContactModalOpen: () => void;
  showTitle?: boolean;
  className?: string;
}

export function BrandContactSection({
  brandData,
  onContactModalOpen,
  showTitle = true,
  className = "",
}: BrandContactSectionProps) {
  const hasContactMethods =
    brandData.whatsapp || brandData.instagram || brandData.website;

  return (
    <div className={`bg-oma-beige p-4 sm:p-6 rounded-lg h-fit ${className}`}>
      {showTitle && (
        <h3 className="font-canela text-xl mb-4">Designer Information</h3>
      )}

      <div className="mb-4">
        <h4 className="text-sm font-semibold mb-1">Price Range</h4>
        <p>{brandData.priceRange}</p>
      </div>

      <div className="mb-4">
        <h4 className="text-sm font-semibold mb-1">Location</h4>
        <p>{brandData.location}</p>
      </div>

      <div className="mb-6">
        <h4 className="text-sm font-semibold mb-1">Category</h4>
        <p>{brandData.category}</p>
      </div>

      {/* Contact Options */}
      {hasContactMethods && (
        <>
          <div className="space-y-3 mb-6">
            <h4 className="text-sm font-semibold">Connect with Designer</h4>

            {/* WhatsApp Contact */}
            {brandData.whatsapp &&
              isValidWhatsAppNumber(brandData.whatsapp) && (
                <WhatsAppContact
                  phoneNumber={brandData.whatsapp}
                  brandName={brandData.name}
                  variant="outline"
                  className="w-full bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:border-green-300 hover:text-green-800 transition-all duration-200"
                  size="sm"
                  showIcon={true}
                  showText={true}
                />
              )}

            {/* Instagram Link */}
            {brandData.instagram && (
              <Button
                variant="outline"
                size="sm"
                className="w-full bg-pink-50 border-pink-200 text-pink-700 hover:bg-pink-100 hover:border-pink-300 hover:text-pink-800 transition-all duration-200"
                onClick={() => {
                  const instagramUrl = brandData.instagram?.startsWith("http")
                    ? brandData.instagram
                    : `https://instagram.com/${brandData.instagram?.replace("@", "")}`;
                  window.open(instagramUrl, "_blank", "noopener,noreferrer");
                }}
              >
                <Instagram className="h-4 w-4 mr-2" />
                Instagram
              </Button>
            )}

            {/* Website Link */}
            {brandData.website && (
              <Button
                variant="outline"
                size="sm"
                className="w-full bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300 hover:text-blue-800 transition-all duration-200"
                onClick={() => {
                  const websiteUrl = brandData.website?.startsWith("http")
                    ? brandData.website
                    : `https://${brandData.website}`;
                  window.open(websiteUrl, "_blank", "noopener,noreferrer");
                }}
              >
                <Globe className="h-4 w-4 mr-2" />
                Website
              </Button>
            )}
          </div>

          <Separator className="my-6 bg-oma-gold/20" />
        </>
      )}

      {/* Email Contact Form */}
      <Button
        onClick={onContactModalOpen}
        className="w-full bg-oma-plum hover:bg-oma-plum/90 min-h-[44px] text-sm sm:text-base transition-all duration-200"
      >
        <Mail className="h-4 w-4 mr-2" />
        Contact Designer
      </Button>
    </div>
  );
}

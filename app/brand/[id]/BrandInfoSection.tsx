"use client";

import { Button } from "@/components/ui/button";
import { FavouriteButton } from "@/components/ui/favourite-button";
import { formatPriceRangeWithCommas } from "@/lib/utils/priceFormatter";
import { isValidWhatsAppNumber } from "@/lib/utils/phoneUtils";
import { Globe, Instagram, Mail, MessageCircle } from "lucide-react";
import type { BrandProfileData } from "./types";

interface BrandInfoSectionProps {
  brandData: BrandProfileData;
  onOpenContactModal: () => void;
}

function openInNewTab(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

function instagramProfileUrl(handleOrUrl: string) {
  return handleOrUrl.startsWith("http")
    ? handleOrUrl
    : `https://instagram.com/${handleOrUrl}`;
}

function websiteUrl(raw: string) {
  return raw.startsWith("http") ? raw : `https://${raw}`;
}

function whatsAppUrl(phone: string) {
  return `https://wa.me/${phone.replace(/\D/g, "")}`;
}

export function BrandInfoSection({
  brandData,
  onOpenContactModal,
}: BrandInfoSectionProps) {
  return (
    <div
      className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 my-8 sm:my-12 slide-up"
      style={{ animationDelay: "200ms" }}
    >
      <div className="lg:col-span-2">
        <h2 className="text-2xl sm:text-3xl font-canela font-normal mb-3 sm:mb-4">
          About {brandData.name}
        </h2>
        <div className="prose text-oma-black max-w-none">
          {brandData.longDescription ? (
            brandData.longDescription.split("\n\n").map((paragraph, i) => (
              <p key={i} className="mb-3 sm:mb-4 text-sm sm:text-base leading-relaxed">
                {paragraph}
              </p>
            ))
          ) : (
            <p className="mb-3 sm:mb-4 text-sm sm:text-base leading-relaxed">
              {brandData.description}
            </p>
          )}
        </div>
      </div>

      <div className="bg-oma-beige p-4 sm:p-6 rounded-lg h-fit order-first lg:order-last">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-canela text-xl">Designer Information</h3>
          <div className="flex items-center gap-2">
            {brandData.contact_email && (
              <button
                onClick={() => openInNewTab(`mailto:${brandData.contact_email}`)}
                className="p-2 rounded-full bg-oma-beige border border-oma-gold/30 text-oma-plum hover:bg-oma-gold hover:border-oma-gold hover:text-oma-plum transition-colors"
                title="Email Designer"
              >
                <Mail className="h-4 w-4" />
              </button>
            )}
            {brandData.whatsapp && isValidWhatsAppNumber(brandData.whatsapp) && (
              <button
                onClick={() => openInNewTab(whatsAppUrl(brandData.whatsapp || ""))}
                className="p-2 rounded-full bg-oma-beige border border-oma-gold/30 text-oma-plum hover:bg-oma-gold hover:border-oma-gold hover:text-oma-plum transition-colors"
                title="WhatsApp"
              >
                <MessageCircle className="h-4 w-4" />
              </button>
            )}
            {brandData.instagram && (
              <button
                onClick={() =>
                  openInNewTab(instagramProfileUrl(brandData.instagram || ""))
                }
                className="p-2 rounded-full bg-oma-beige border border-oma-gold/30 text-oma-plum hover:bg-oma-gold hover:border-oma-gold hover:text-oma-plum transition-colors"
                title="Instagram"
              >
                <Instagram className="h-4 w-4" />
              </button>
            )}
            {brandData.website && (
              <button
                onClick={() => openInNewTab(websiteUrl(brandData.website || ""))}
                className="p-2 rounded-full bg-oma-beige border border-oma-gold/30 text-oma-plum hover:bg-oma-gold hover:border-oma-gold hover:text-oma-plum transition-colors"
                title="Website"
              >
                <Globe className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {brandData.priceRange && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold mb-1">Price Range</h4>
            <p>{formatPriceRangeWithCommas(brandData.priceRange)}</p>
          </div>
        )}
        {brandData.location && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold mb-1">Location</h4>
            <p>{brandData.location}</p>
          </div>
        )}
        {brandData.category && (
          <div className="mb-6">
            <h4 className="text-sm font-semibold mb-1">Category</h4>
            <p>{brandData.category}</p>
          </div>
        )}

        <div className="mb-4">
          <FavouriteButton
            itemId={brandData.id}
            itemType="brand"
            itemData={{
              name: brandData.name,
              image: brandData.image,
              category: brandData.category,
              location: brandData.location,
            }}
            className="w-full bg-oma-plum hover:bg-oma-plum/90 text-white min-h-[44px] text-sm sm:text-base transition-all duration-200"
          />
        </div>

        <Button
          onClick={onOpenContactModal}
          className="w-full bg-oma-plum hover:bg-oma-plum/90 min-h-[44px] text-sm sm:text-base"
        >
          Contact Designer
        </Button>
      </div>
    </div>
  );
}

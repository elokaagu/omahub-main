"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, MapPin, Star } from "@/components/ui/icons";
import WhatsAppContact from "@/components/ui/whatsapp-contact";
import { isValidWhatsAppNumber } from "@/lib/utils/phoneUtils";
import { MessageCircle, ShoppingBag } from "lucide-react";
import type { BrandProfileData } from "./types";

interface BrandHeaderSectionProps {
  brandData: BrandProfileData;
  reviewsCount: number;
  showAllProducts: boolean;
  onScrollToCollections: () => void;
  onToggleProducts: () => void;
  onOpenContactModal: () => void;
}

export function BrandHeaderSection({
  brandData,
  reviewsCount,
  showAllProducts,
  onScrollToCollections,
  onToggleProducts,
  onOpenContactModal,
}: BrandHeaderSectionProps) {
  return (
    <div className="mb-6 sm:mb-8 slide-up">
      <div className="flex flex-wrap items-center gap-2 mb-3 sm:mb-2">
        {brandData.category && (
          <Badge className="bg-oma-beige text-oma-cocoa border-oma-gold/20 text-xs sm:text-sm">
            {brandData.category}
          </Badge>
        )}
        {brandData.isVerified && (
          <div className="flex items-center text-oma-gold text-xs sm:text-sm">
            <CheckCircle size={14} className="mr-1 sm:mr-1" />
            <span>Verified Designer</span>
          </div>
        )}
      </div>

      <h1 className="text-3xl sm:text-4xl md:text-6xl font-canela font-normal tracking-tight mb-3 sm:mb-2 leading-tight">
        {brandData.name}
      </h1>

      <div className="flex flex-col sm:flex-row sm:items-center text-oma-cocoa mb-4 sm:mb-6 gap-2 sm:gap-0">
        {brandData.location && (
          <div className="flex items-center">
            <MapPin size={14} className="mr-1 flex-shrink-0" />
            <span className="text-sm sm:text-base">{brandData.location}</span>
          </div>
        )}
        {brandData.rating && (
          <div className="flex items-center sm:ml-6">
            <Star size={14} className="mr-1 text-oma-gold flex-shrink-0" />
            <span className="text-sm sm:text-base">
              {brandData.rating} ({reviewsCount} reviews)
            </span>
          </div>
        )}
      </div>

      <div className="prose text-oma-black max-w-none mb-6">
        {brandData.description.split("\n\n").map((paragraph, i) => (
          <p key={i} className="mb-3 sm:mb-4 text-sm sm:text-base leading-relaxed">
            {paragraph}
          </p>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        {brandData.collections.length > 0 && (
          <Button
            onClick={onScrollToCollections}
            className="bg-oma-plum hover:bg-oma-plum/90 w-full sm:w-auto min-h-[44px] text-sm sm:text-base"
          >
            View Collections
          </Button>
        )}
        <Button
          onClick={onToggleProducts}
          variant="outline"
          className="border-oma-plum text-oma-plum hover:bg-oma-plum hover:text-white w-full sm:w-auto min-h-[44px] text-sm sm:text-base"
        >
          <ShoppingBag size={16} className="mr-2 flex-shrink-0" />
          {showAllProducts ? "Hide Products" : "View All Products"}
        </Button>
        {brandData.whatsapp && isValidWhatsAppNumber(brandData.whatsapp) && (
          <WhatsAppContact
            phoneNumber={brandData.whatsapp}
            brandName={brandData.name}
            className="w-full sm:w-auto min-h-[44px] text-sm sm:text-base"
          />
        )}
        <Button
          onClick={onOpenContactModal}
          variant="outline"
          className="border-oma-plum text-oma-plum hover:bg-oma-plum hover:text-white w-full sm:w-auto min-h-[44px] text-sm sm:text-base"
        >
          <MessageCircle size={16} className="mr-2 flex-shrink-0" />
          Contact Designer
        </Button>
      </div>
    </div>
  );
}

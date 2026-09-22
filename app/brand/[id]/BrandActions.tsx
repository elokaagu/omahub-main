"use client";

import { MessageCircle, Phone } from "lucide-react";
import ContactDesignerModal from "@/components/ContactDesignerModal";
import { Button } from "@/components/ui/button";
import { FavouriteButton } from "@/components/ui/favourite-button";
import { isValidWhatsAppNumber } from "@/lib/utils/phoneUtils";
import { useState } from "react";

type BrandActionsProps = {
  brandId: string;
  brandName: string;
  whatsapp?: string;
  image?: string;
  category?: string;
  location?: string;
  /** White-on-photo styling for the hero; dark text elsewhere. */
  tone?: "onPhoto" | "onLight";
};

/** Contact, WhatsApp and favourite - the actions on a brand page. */
export function BrandActions({
  brandId,
  brandName,
  whatsapp,
  image,
  category,
  location,
  tone = "onLight",
}: BrandActionsProps) {
  const [contactOpen, setContactOpen] = useState(false);
  const hasWhatsApp = whatsapp && isValidWhatsAppNumber(whatsapp);
  const onPhoto = tone === "onPhoto";

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <Button
          onClick={() => setContactOpen(true)}
          className="min-h-[44px] rounded-full bg-oma-plum px-6 text-white hover:bg-oma-plum/90"
        >
          <MessageCircle className="mr-2 size-4" aria-hidden />
          Contact designer
        </Button>

        {hasWhatsApp && (
          <Button
            asChild
            variant="outline"
            className={
              onPhoto
                ? "min-h-[44px] rounded-full border-white/40 bg-white/10 px-6 text-white backdrop-blur-sm hover:bg-white/20 hover:text-white"
                : "min-h-[44px] rounded-full border-oma-plum/30 px-6 text-oma-plum hover:bg-oma-beige/60"
            }
          >
            <a
              href={`https://wa.me/${whatsapp!.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Phone className="mr-2 size-4" aria-hidden />
              WhatsApp
            </a>
          </Button>
        )}

        <FavouriteButton
          itemId={brandId}
          itemType="brand"
          showText
          itemData={{ name: brandName, image, category, location }}
          className={
            onPhoto
              ? "min-h-[44px] rounded-full border border-white/40 bg-white/10 px-5 text-white backdrop-blur-sm hover:bg-white/20"
              : "min-h-[44px] rounded-full border border-oma-gold/30 px-5"
          }
        />
      </div>

      <ContactDesignerModal
        isOpen={contactOpen}
        onClose={() => setContactOpen(false)}
        brandName={brandName}
        brandId={brandId}
      />
    </>
  );
}

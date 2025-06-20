"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle, Phone } from "lucide-react";
import { toast } from "sonner";
import {
  isValidWhatsAppNumber,
  formatPhoneForDisplay,
} from "@/lib/utils/phoneUtils";

interface WhatsAppContactProps {
  phoneNumber: string;
  brandName?: string;
  message?: string;
  className?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  showIcon?: boolean;
  showText?: boolean;
}

const WhatsAppContact: React.FC<WhatsAppContactProps> = ({
  phoneNumber,
  brandName = "",
  message,
  className = "",
  variant = "default",
  size = "default",
  showIcon = true,
  showText = true,
}) => {
  // Validate phone number
  if (!isValidWhatsAppNumber(phoneNumber)) {
    return null; // Don't render if invalid
  }

  // Format phone number for display
  const displayNumber = formatPhoneForDisplay(phoneNumber);

  // Create WhatsApp URL
  const createWhatsAppUrl = (phone: string, customMessage?: string) => {
    // Remove all non-digit characters except +
    const cleanPhone = phone.replace(/[^\d+]/g, "");

    // Default message if none provided
    const defaultMessage =
      customMessage ||
      `Hi${brandName ? ` ${brandName}` : ""}! I'm interested in your services and would like to know more.`;

    // Encode the message for URL
    const encodedMessage = encodeURIComponent(defaultMessage);

    return `https://wa.me/${cleanPhone.replace("+", "")}?text=${encodedMessage}`;
  };

  const whatsappUrl = createWhatsAppUrl(phoneNumber, message);

  const handleClick = () => {
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <Button
      onClick={handleClick}
      variant={variant}
      size={size}
      className={`inline-flex items-center gap-2 ${className}`}
    >
      {showIcon && <MessageCircle className="h-4 w-4" />}
      {showText && <span>WhatsApp {displayNumber}</span>}
    </Button>
  );
};

export default WhatsAppContact;

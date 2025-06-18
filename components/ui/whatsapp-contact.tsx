"use client";

import { Button } from "@/components/ui/button";
import { MessageCircle, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface WhatsAppContactProps {
  phoneNumber: string;
  brandName: string;
  variant?: "default" | "outline" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showIcon?: boolean;
  children?: React.ReactNode;
}

export function WhatsAppContact({
  phoneNumber,
  brandName,
  variant = "default",
  size = "default",
  className = "",
  showIcon = true,
  children,
}: WhatsAppContactProps) {
  // Format phone number for WhatsApp (remove spaces, dashes, parentheses)
  const formatPhoneForWhatsApp = (phone: string): string => {
    return phone.replace(/[\s\-\(\)]/g, "");
  };

  // Generate WhatsApp message
  const generateWhatsAppMessage = (): string => {
    return `Hi ${brandName}! I found your designs on OmaHub and I'm interested in learning more about your work.`;
  };

  // Handle WhatsApp contact
  const handleWhatsAppContact = () => {
    try {
      const formattedPhone = formatPhoneForWhatsApp(phoneNumber);
      const message = encodeURIComponent(generateWhatsAppMessage());

      // Create WhatsApp URL
      const whatsappUrl = `https://wa.me/${formattedPhone}?text=${message}`;

      // Open WhatsApp in a new tab/window
      window.open(whatsappUrl, "_blank", "noopener,noreferrer");

      // Show success toast
      toast.success(`Opening WhatsApp chat with ${brandName}`);
    } catch (error) {
      console.error("Error opening WhatsApp:", error);
      toast.error("Unable to open WhatsApp. Please try again.");
    }
  };

  // Default button content
  const defaultContent = (
    <>
      {showIcon && <MessageCircle className="h-4 w-4 mr-2" />}
      {children || "Contact on WhatsApp"}
    </>
  );

  return (
    <Button
      onClick={handleWhatsAppContact}
      variant={variant}
      size={size}
      className={`${className} transition-all duration-200 hover:scale-105`}
    >
      {defaultContent}
    </Button>
  );
}

// Utility function to check if a phone number is valid for WhatsApp
export const isValidWhatsAppNumber = (phoneNumber: string): boolean => {
  if (!phoneNumber || phoneNumber.trim() === "") return false;

  // Remove all non-digit characters except +
  const cleaned = phoneNumber.replace(/[^\d+]/g, "");

  // Check if it starts with + and has at least 10 digits
  return /^\+\d{10,15}$/.test(cleaned);
};

// Utility function to format phone number for display
export const formatPhoneForDisplay = (phoneNumber: string): string => {
  if (!phoneNumber) return "";

  // If it's a Nigerian number, format it nicely
  if (phoneNumber.startsWith("+234")) {
    const digits = phoneNumber.substring(4);
    if (digits.length === 10) {
      return `+234 ${digits.substring(0, 3)} ${digits.substring(3, 6)} ${digits.substring(6)}`;
    }
  }

  // For other numbers, just return as is
  return phoneNumber;
};

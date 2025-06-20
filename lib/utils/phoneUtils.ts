/**
 * Phone number validation and formatting utilities
 */

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

// Utility function to clean phone number for storage
export const cleanPhoneNumber = (phoneNumber: string): string => {
  if (!phoneNumber) return "";

  // Remove all non-digit characters except +
  return phoneNumber.replace(/[^\d+]/g, "");
};

// Utility function to validate phone number format
export const validatePhoneNumber = (
  phoneNumber: string
): {
  isValid: boolean;
  message?: string;
} => {
  if (!phoneNumber || phoneNumber.trim() === "") {
    return { isValid: false, message: "Phone number is required" };
  }

  const cleaned = cleanPhoneNumber(phoneNumber);

  if (!cleaned.startsWith("+")) {
    return {
      isValid: false,
      message: "Phone number must include country code (e.g., +234)",
    };
  }

  if (cleaned.length < 11) {
    return { isValid: false, message: "Phone number is too short" };
  }

  if (cleaned.length > 16) {
    return { isValid: false, message: "Phone number is too long" };
  }

  return { isValid: true };
};

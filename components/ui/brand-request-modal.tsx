"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ShoppingBag,
  User,
  Mail,
  Phone,
  MapPin,
  MessageSquare,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { formatPrice } from "@/lib/utils/priceFormatter";

interface BrandRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  productImage: string;
  price: number;
  brandId: string;
  brandName: string;
  brandCurrency?: string;
  sizes?: string[];
  colors?: string[];
}

const FALLBACK_SIZE_OPTIONS = [
  "XXS",
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "XXXL",
  "4XL",
  "5XL",
  "32",
  "34",
  "36",
  "38",
  "40",
  "42",
  "44",
  "46",
  "48",
  "50",
  "52",
  "54",
  "Custom Measurements",
  "Petite",
  "Tall",
  "Plus Size",
  "Maternity",
  "Other",
];

const FALLBACK_COLOR_OPTIONS = [
  "Black",
  "White",
  "Navy",
  "Red",
  "Blue",
  "Green",
  "Yellow",
  "Pink",
  "Purple",
  "Orange",
  "Brown",
  "Gray",
  "Beige",
  "Cream",
  "Other",
];

const COUNTRY_OPTIONS = [
  "Nigeria",
  "United Kingdom",
  "United States",
  "Canada",
  "Australia",
  "Germany",
  "France",
  "Italy",
  "Spain",
  "Netherlands",
  "Belgium",
  "Switzerland",
  "Austria",
  "Sweden",
  "Norway",
  "Denmark",
  "Finland",
  "Ireland",
  "Portugal",
  "Greece",
  "Poland",
  "Czech Republic",
  "Hungary",
  "Romania",
  "Bulgaria",
  "Croatia",
  "Slovenia",
  "Slovakia",
  "Estonia",
  "Latvia",
  "Lithuania",
  "Luxembourg",
  "Malta",
  "Cyprus",
  "Iceland",
  "Liechtenstein",
  "Monaco",
  "San Marino",
  "Vatican City",
  "Andorra",
  "Other",
];

export function BrandRequestModal({
  isOpen,
  onClose,
  productId,
  productName,
  productImage,
  price,
  brandId,
  brandName,
  brandCurrency,
  sizes,
  colors,
}: BrandRequestModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    address_line_1: "",
    city: "",
    state: "",
    postal_code: "",
    country: "",
    customer_notes: "",
    quantity: 1,
    preferred_size: "",
    preferred_color: "",
  });

  // Reset form when modal opens/closes or props change
  useEffect(() => {
    const initialFormData = {
      full_name: "",
      email: "",
      phone: "",
      address_line_1: "",
      city: "",
      state: "",
      postal_code: "",
      country: "",
      customer_notes: "",
      quantity: 1,
      preferred_size: "",
      preferred_color: "",
    };
    setFormData(initialFormData);
    setValidationErrors([]);
  }, [isOpen, sizes, colors, productName, brandName]);

  // Additional effect to handle size/color prop changes specifically
  useEffect(() => {
    if (sizes && sizes.length > 0 && !formData.preferred_size) {
      setFormData(prev => ({ ...prev, preferred_size: sizes[0] }));
    }
    if (colors && colors.length > 0 && !formData.preferred_color) {
      setFormData(prev => ({ ...prev, preferred_color: colors[0] }));
    }
  }, [sizes, colors, formData.preferred_size, formData.preferred_color]);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear validation errors when user starts typing
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  };

  const validateForm = () => {
    const errors = [];
    
    // Required fields (only essential contact info)
    if (!formData.full_name?.trim()) errors.push("Full name is required");
    if (!formData.email?.trim()) errors.push("Email address is required");
    
    // Address fields are now optional - no validation required
    
    // Email format validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.push("Please enter a valid email address");
    }
    
    // Quantity validation
    if (formData.quantity < 1) errors.push("Quantity must be at least 1");
    
    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validate form before submission
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);

    const requestData = {
      product_id: productId,
      brand_id: brandId,
      customer_notes: formData.customer_notes,
      delivery_address: {
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        address_line_1: formData.address_line_1,
        city: formData.city,
        state: formData.state,
        postal_code: formData.postal_code,
        country: formData.country,
      },
      total_amount: price * formData.quantity,
      size: formData.preferred_size,
      color: formData.preferred_color,
      quantity: formData.quantity,
    };

    try {
      const response = await fetch("/api/orders/custom", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit request");
      }
      await response.json();

      toast.success(
        "Request submitted successfully! The brand will contact you soon."
      );
      onClose();

      // Reset form
      setFormData({
        full_name: "",
        email: "",
        phone: "",
        address_line_1: "",
        city: "",
        state: "",
        postal_code: "",
        country: "",
        customer_notes: "",
        quantity: 1,
        preferred_size: "",
        preferred_color: "",
      });
      setValidationErrors([]);
    } catch (error: any) {
      console.error("Error submitting request:", error);
      toast.error(
        error.message || "Failed to submit request. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl border border-oma-gold/20 p-0">
        <DialogHeader>
          <div className="border-b border-oma-gold/20 bg-gradient-to-r from-oma-cream/80 via-white to-oma-beige/80 px-6 py-5">
            <DialogTitle className="text-2xl font-canela text-oma-plum">
              Request from {brandName}
            </DialogTitle>
            <DialogDescription className="mt-1 text-oma-cocoa/80">
              Submit your request for {productName} and we&apos;ll connect you with
              the brand.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-[0.9fr_1.1fr]">
          {/* Product Information */}
          <div className="space-y-4">
            {/* Validation Errors Display */}
            {validationErrors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <h4 className="font-medium text-red-800">Please fix the following errors:</h4>
                </div>
                <ul className="text-sm text-red-700 space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span>
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="rounded-xl border border-oma-gold/15 bg-oma-cream/40 p-4 shadow-sm">
              <h3 className="mb-3 font-semibold text-oma-plum">
                Product Details
              </h3>
              <div className="flex items-center space-x-3">
                <div className="h-16 w-16 overflow-hidden rounded-lg bg-gray-200 ring-1 ring-oma-gold/20">
                  <img
                    src={productImage}
                    alt={productName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{productName}</p>
                  <p className="text-sm font-medium text-oma-plum">
                    {price > 0
                      ? formatPrice(price, brandCurrency || "£")
                      : "Contact for pricing"}
                  </p>
                  {sizes && sizes.length > 0 && (
                    <p className="text-sm text-gray-600">
                      Available Sizes: {sizes.join(", ")}
                    </p>
                  )}
                  {colors && colors.length > 0 && (
                    <p className="text-sm text-gray-600">
                      Available Colors: {colors.join(", ")}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-3 rounded-xl border border-oma-gold/15 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-oma-cocoa/60">
                Preferences
              </p>
              <div>
                <Label
                  htmlFor="quantity"
                  className="text-sm font-medium text-oma-cocoa"
                >
                  Quantity
                </Label>
                <Select
                  value={formData.quantity.toString()}
                  onValueChange={(value) =>
                    handleInputChange("quantity", parseInt(value))
                  }
                >
                  <SelectTrigger className="border-oma-beige focus:border-oma-plum focus:ring-oma-plum">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label
                  htmlFor="preferred_size"
                  className="text-sm font-medium text-oma-cocoa"
                >
                  Preferred Size
                </Label>
                <Select
                  value={formData.preferred_size}
                  onValueChange={(value) => handleInputChange("preferred_size", value)}
                >
                  <SelectTrigger className="border-oma-beige focus:border-oma-plum focus:ring-oma-plum">
                    <SelectValue placeholder="Select your preferred size" />
                  </SelectTrigger>
                  <SelectContent>
                    {sizes && sizes.length > 0 ? (
                      sizes.map((sizeOption) => (
                        <SelectItem key={sizeOption} value={sizeOption}>
                          {sizeOption}
                        </SelectItem>
                      ))
                    ) : (
                      FALLBACK_SIZE_OPTIONS.map((sizeOption) => (
                        <SelectItem key={sizeOption} value={sizeOption}>
                          {sizeOption}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>

              </div>

              <div>
                <Label
                  htmlFor="preferred_color"
                  className="text-sm font-medium text-oma-cocoa"
                >
                  Preferred Color
                </Label>
                <Select
                  value={formData.preferred_color}
                  onValueChange={(value) => handleInputChange("preferred_color", value)}
                >
                  <SelectTrigger className="border-oma-beige focus:border-oma-plum focus:ring-oma-plum">
                    <SelectValue placeholder="Select your preferred color" />
                  </SelectTrigger>
                  <SelectContent>
                    {colors && colors.length > 0 ? (
                      colors.map((colorOption) => (
                        <SelectItem key={colorOption} value={colorOption}>
                          {colorOption}
                        </SelectItem>
                      ))
                    ) : (
                      FALLBACK_COLOR_OPTIONS.map((colorOption) => (
                        <SelectItem key={colorOption} value={colorOption}>
                          {colorOption}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Customer Information Form */}
          <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-oma-gold/15 bg-white p-4 shadow-sm md:p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-oma-cocoa/60">
              Contact Details
            </p>
            <div>
              <Label
                htmlFor="full_name"
                className="text-sm font-medium text-oma-cocoa"
              >
                Full Name *
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="full_name"
                  placeholder="Your full name"
                  className="pl-10 border-oma-beige focus:border-oma-plum focus:ring-oma-plum"
                  value={formData.full_name}
                  onChange={(e) =>
                    handleInputChange("full_name", e.target.value)
                  }
                  required
                />
              </div>
            </div>

            <div>
              <Label
                htmlFor="email"
                className="text-sm font-medium text-oma-cocoa"
              >
                Email Address *
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  className="pl-10 border-oma-beige focus:border-oma-plum focus:ring-oma-plum"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <Label
                htmlFor="phone"
                className="text-sm font-medium text-oma-cocoa"
              >
                Phone Number
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+44 123 456 7890"
                  className="pl-10 border-oma-beige focus:border-oma-plum focus:ring-oma-plum"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label
                htmlFor="address_line_1"
                className="text-sm font-medium text-oma-cocoa"
              >
                Address Line 1
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="address_line_1"
                  placeholder="Street address, P.O. box, company name"
                  className="pl-10 border-oma-beige focus:border-oma-plum focus:ring-oma-plum"
                  value={formData.address_line_1}
                  onChange={(e) =>
                    handleInputChange("address_line_1", e.target.value)
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label
                  htmlFor="city"
                  className="text-sm font-medium text-oma-cocoa"
                >
                  City
                </Label>
                <Input
                  id="city"
                  placeholder="City"
                  className="border-oma-beige focus:border-oma-plum focus:ring-oma-plum"
                  value={formData.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                />
              </div>
              <div>
                <Label
                  htmlFor="state"
                  className="text-sm font-medium text-oma-cocoa"
                >
                  State/Province
                </Label>
                <Input
                  id="state"
                  placeholder="State"
                  className="border-oma-beige focus:border-oma-plum focus:ring-oma-plum"
                  value={formData.state}
                  onChange={(e) => handleInputChange("state", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label
                  htmlFor="postal_code"
                  className="text-sm font-medium text-oma-cocoa"
                >
                  Postal Code
                </Label>
                <Input
                  id="postal_code"
                  placeholder="Postal code"
                  className="border-oma-beige focus:border-oma-plum focus:ring-oma-plum"
                  value={formData.postal_code}
                  onChange={(e) =>
                    handleInputChange("postal_code", e.target.value)
                  }
                />
              </div>
              <div>
                <Label
                  htmlFor="country"
                  className="text-sm font-medium text-oma-cocoa"
                >
                  Country
                </Label>
                <Select
                  value={formData.country}
                  onValueChange={(value) => handleInputChange("country", value)}
                >
                  <SelectTrigger className="border-oma-beige focus:border-oma-plum focus:ring-oma-plum">
                    <SelectValue placeholder="Select your country" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRY_OPTIONS.map((countryOption) => (
                      <SelectItem key={countryOption} value={countryOption}>
                        {countryOption}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label
                htmlFor="customer_notes"
                className="text-sm font-medium text-oma-cocoa"
              >
                Additional Notes
              </Label>
              <div className="relative">
                <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Textarea
                  id="customer_notes"
                  placeholder="Any special requirements, measurements, or questions for the brand..."
                  className="pl-10 border-oma-beige focus:border-oma-plum focus:ring-oma-plum min-h-[80px]"
                  value={formData.customer_notes}
                  onChange={(e) =>
                    handleInputChange("customer_notes", e.target.value)
                  }
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="mt-2 w-full bg-oma-plum py-3 text-white hover:bg-oma-plum/90"
            >
              {isLoading ? (
                "Submitting Request..."
              ) : (
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5" />
                  Submit Request to {brandName}
                </div>
              )}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

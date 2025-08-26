"use client";

import { useState } from "react";
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
  Loader2,
  ShoppingBag,
  User,
  Mail,
  Phone,
  MapPin,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";

interface BrandRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  productImage: string;
  price: number;
  brandId: string;
  brandName: string;
  size?: string;
  color?: string;
}

export function BrandRequestModal({
  isOpen,
  onClose,
  productId,
  productName,
  productImage,
  price,
  brandId,
  brandName,
  size,
  color,
}: BrandRequestModalProps) {
  const [isLoading, setIsLoading] = useState(false);
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
    preferred_size: size || "",
    preferred_color: color || "",
  });

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
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

    console.log("Submitting brand request:", requestData);

    try {
      const response = await fetch("/api/orders/custom", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      console.log("API response status:", response.status);
      console.log("API response headers:", response.headers);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API error response:", errorData);
        throw new Error(errorData.error || "Failed to submit request");
      }

      const successData = await response.json();
      console.log("API success response:", successData);

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
        preferred_size: size || "",
        preferred_color: color || "",
      });
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
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center">
          <DialogTitle className="text-xl font-semibold text-oma-plum">
            Request from {brandName}
          </DialogTitle>
          <DialogDescription className="text-oma-cocoa">
            Submit your request for {productName} and we'll connect you with the
            brand
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Product Information */}
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-oma-plum mb-3">
                Product Details
              </h3>
              <div className="flex items-center space-x-3">
                <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden">
                  <img
                    src={productImage}
                    alt={productName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{productName}</p>
                  <p className="text-sm text-gray-600">£{price.toFixed(2)}</p>
                  {size && (
                    <p className="text-sm text-gray-600">Size: {size}</p>
                  )}
                  {color && (
                    <p className="text-sm text-gray-600">Color: {color}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-3">
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
                <Input
                  id="preferred_size"
                  placeholder="e.g., M, L, XL, or custom measurements"
                  className="border-oma-beige focus:border-oma-plum focus:ring-oma-plum"
                  value={formData.preferred_size}
                  onChange={(e) =>
                    handleInputChange("preferred_size", e.target.value)
                  }
                />
              </div>

              <div>
                <Label
                  htmlFor="preferred_color"
                  className="text-sm font-medium text-oma-cocoa"
                >
                  Preferred Color
                </Label>
                <Input
                  id="preferred_color"
                  placeholder="e.g., Navy, Black, or specific color preference"
                  className="border-oma-beige focus:border-oma-plum focus:ring-oma-plum"
                  value={formData.preferred_color}
                  onChange={(e) =>
                    handleInputChange("preferred_color", e.target.value)
                  }
                />
              </div>
            </div>
          </div>

          {/* Customer Information Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
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
                Address Line 1 *
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
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label
                  htmlFor="city"
                  className="text-sm font-medium text-oma-cocoa"
                >
                  City *
                </Label>
                <Input
                  id="city"
                  placeholder="City"
                  className="border-oma-beige focus:border-oma-plum focus:ring-oma-plum"
                  value={formData.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  required
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
                  Postal Code *
                </Label>
                <Input
                  id="postal_code"
                  placeholder="Postal code"
                  className="border-oma-beige focus:border-oma-plum focus:ring-oma-plum"
                  value={formData.postal_code}
                  onChange={(e) =>
                    handleInputChange("postal_code", e.target.value)
                  }
                  required
                />
              </div>
              <div>
                <Label
                  htmlFor="country"
                  className="text-sm font-medium text-oma-cocoa"
                >
                  Country *
                </Label>
                <Input
                  id="country"
                  placeholder="Country"
                  className="border-oma-beige focus:border-oma-plum focus:ring-oma-plum"
                  value={formData.country}
                  onChange={(e) => handleInputChange("country", e.target.value)}
                  required
                />
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
              className="w-full bg-oma-plum hover:bg-oma-plum/90 text-white py-3"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Submitting Request...
                </div>
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

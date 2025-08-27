"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthModalContext } from "@/contexts/AuthModalContext";
import {
  Product,
  Brand,
  CustomerMeasurements,
  DeliveryAddress,
} from "@/lib/supabase";
import { calculateTailoredPrice } from "@/lib/services/tailoredOrderService";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Ruler,
  MapPin,
  CreditCard,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatProductPrice } from "@/lib/utils/priceFormatter";
import { engagement } from "@/lib/config/analytics";
import { toast } from "sonner";

interface TailoredOrderModalProps {
  product: Product;
  brand: Brand;
  isOpen: boolean;
  onClose: () => void;
}

export function TailoredOrderModal({
  product,
  brand,
  isOpen,
  onClose,
}: TailoredOrderModalProps) {
  const { user } = useAuth();
  const { openAuthModal } = useAuthModalContext();
  const [currentTab, setCurrentTab] = useState("measurements");
  const [loading, setLoading] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);

  // Form state
  const [measurements, setMeasurements] = useState<CustomerMeasurements>({
    fit_preference: "regular",
  });

  const [deliveryAddress, setDeliveryAddress] = useState<DeliveryAddress>({
    full_name: "",
    phone: "",
    email: user?.email || "",
    address_line_1: "",
    city: "",
    state: "",
    postal_code: "",
    country: "",
  });

  const [customerNotes, setCustomerNotes] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");

  // Calculate final price
  const finalPrice = calculateTailoredPrice(
    product.sale_price || product.price,
    product.is_custom,
    measurements
  );

  const handleMeasurementChange = (
    field: keyof CustomerMeasurements,
    value: string
  ) => {
    setMeasurements((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddressChange = (field: keyof DeliveryAddress, value: string) => {
    setDeliveryAddress((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmitOrder = async () => {
    if (!user) {
      openAuthModal({
        title: "Sign In Required",
        message: "Please sign in to submit your custom order request.",
        showSignUp: true,
      });
      return;
    }

    if (!isFormValid()) {
      toast.error("Please fill in all required delivery information.");
      return;
    }

    try {
      setLoading(true);

      const orderData = {
        user_id: user.id,
        product_id: product.id,
        brand_id: product.brand_id,
        customer_notes: customerNotes,
        delivery_address: deliveryAddress,
        total_amount: finalPrice,
      };

      const response = await fetch("/api/orders/custom", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to submit order");
      }

      // Track custom order submission in Google Analytics
      engagement.submitCustomOrder(`${product.title} - ${brand.name}`);

      setOrderComplete(true);
    } catch (error) {
      console.error("Error creating order:", error);
      toast.error("Failed to create order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    return (
      deliveryAddress.full_name &&
      deliveryAddress.phone &&
      deliveryAddress.email &&
      deliveryAddress.address_line_1 &&
      deliveryAddress.city &&
      deliveryAddress.state &&
      deliveryAddress.postal_code &&
      deliveryAddress.country
    );
  };

  if (orderComplete) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <div className="text-center py-6">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Order Submitted Successfully!
            </h3>
            <p className="text-gray-600 mb-6">
              Your custom order request has been sent to {brand.name}. They will
              contact you within 24-48 hours to confirm details and
              measurements.
            </p>
            <Button onClick={onClose} className="w-full">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Debug logging
  console.log("TailoredOrderModal - Product data:", {
    productId: product.id,
    productTitle: product.title,
    productDescription: product.description,
    brandName: brand.name
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] flex flex-col relative">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl font-semibold">
            Custom Order: {product.title || "Product"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2">
          <div className="space-y-6 pb-24">
            {/* Order Summary - Sticky at top */}
            <div className="bg-gradient-to-r from-oma-beige/50 to-oma-gold/10 rounded-lg p-4 border border-oma-gold/20">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Order Summary
                  </h3>
                  <p className="text-sm text-gray-600">
                    {product.title} by {brand.name}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-oma-plum">
                    {
                      formatProductPrice(product, {
                        price_range: brand.price_range,
                      }).displayPrice
                    }
                  </p>
                  <Badge variant="secondary" className="mt-1">
                    Custom Order
                  </Badge>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 bg-oma-plum/10 rounded-full flex items-center justify-center">
                  <span className="text-oma-plum font-semibold text-sm">1</span>
                </div>
                <h4 className="font-semibold text-gray-900">
                  Contact Information
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name" className="text-sm font-medium">
                    Full Name *
                  </Label>
                  <Input
                    id="full_name"
                    value={deliveryAddress.full_name}
                    onChange={(e) =>
                      handleAddressChange("full_name", e.target.value)
                    }
                    placeholder="Enter your full name"
                    className="h-11"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">
                    Phone Number *
                  </Label>
                  <Input
                    id="phone"
                    value={deliveryAddress.phone}
                    onChange={(e) =>
                      handleAddressChange("phone", e.target.value)
                    }
                    placeholder="Enter your phone number"
                    className="h-11"
                    required
                  />
                </div>
                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email Address *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={deliveryAddress.email}
                    onChange={(e) =>
                      handleAddressChange("email", e.target.value)
                    }
                    placeholder="Enter your email address"
                    className="h-11"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Delivery Address */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 bg-oma-plum/10 rounded-full flex items-center justify-center">
                  <span className="text-oma-plum font-semibold text-sm">2</span>
                </div>
                <h4 className="font-semibold text-gray-900">
                  Delivery Address
                </h4>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="address_line_1"
                    className="text-sm font-medium"
                  >
                    Street Address *
                  </Label>
                  <Input
                    id="address_line_1"
                    value={deliveryAddress.address_line_1}
                    onChange={(e) =>
                      handleAddressChange("address_line_1", e.target.value)
                    }
                    placeholder="Enter your street address"
                    className="h-11"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-sm font-medium">
                      City *
                    </Label>
                    <Input
                      id="city"
                      value={deliveryAddress.city}
                      onChange={(e) =>
                        handleAddressChange("city", e.target.value)
                      }
                      placeholder="City"
                      className="h-11"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state" className="text-sm font-medium">
                      State *
                    </Label>
                    <Input
                      id="state"
                      value={deliveryAddress.state}
                      onChange={(e) =>
                        handleAddressChange("state", e.target.value)
                      }
                      placeholder="State"
                      className="h-11"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="postal_code"
                      className="text-sm font-medium"
                    >
                      Postal Code *
                    </Label>
                    <Input
                      id="postal_code"
                      value={deliveryAddress.postal_code}
                      onChange={(e) =>
                        handleAddressChange("postal_code", e.target.value)
                      }
                      placeholder="Postal Code"
                      className="h-11"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country" className="text-sm font-medium">
                    Country
                  </Label>
                  <Select
                    value={deliveryAddress.country}
                    onValueChange={(value) =>
                      handleAddressChange("country", value)
                    }
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Nigeria">Nigeria</SelectItem>
                      <SelectItem value="Ghana">Ghana</SelectItem>
                      <SelectItem value="Kenya">Kenya</SelectItem>
                      <SelectItem value="South Africa">South Africa</SelectItem>
                      <SelectItem value="United States">
                        United States
                      </SelectItem>
                      <SelectItem value="United Kingdom">
                        United Kingdom
                      </SelectItem>
                      <SelectItem value="Canada">Canada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Special Requests */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 bg-oma-plum/10 rounded-full flex items-center justify-center">
                  <span className="text-oma-plum font-semibold text-sm">3</span>
                </div>
                <h4 className="font-semibold text-gray-900">
                  Special Requests
                </h4>
              </div>

              <div className="space-y-2">
                <Label htmlFor="customer_notes" className="text-sm font-medium">
                  Special Requests or Notes
                </Label>
                <Textarea
                  id="customer_notes"
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  placeholder="Any special requests, measurements, or notes for the designer..."
                  rows={4}
                  className="resize-none"
                />
              </div>
            </div>

            {/* What Happens Next */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-blue-600" />
                What happens next?
              </h4>
              <ul className="text-sm text-gray-700 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-semibold">•</span>
                  We'll send your order details to {brand.name}
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-semibold">•</span>
                  They'll contact you within 24-48 hours to discuss measurements
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-semibold">•</span>
                  Payment will be processed after order confirmation
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-semibold">•</span>
                  Estimated completion: {product.lead_time || "2-3 weeks"}
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Fixed bottom action buttons - Always visible */}
        <div className="sticky bottom-0 left-0 right-0 border-t border-gray-200 pt-4 mt-6 bg-white z-10 px-6 pb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 h-12"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitOrder}
              disabled={loading || !isFormValid()}
              className="flex-1 h-12 bg-oma-plum hover:bg-oma-plum/90 text-white"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting...
                </div>
              ) : (
                "Submit Order Request"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

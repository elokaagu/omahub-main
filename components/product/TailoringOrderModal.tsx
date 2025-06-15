"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Product,
  Brand,
  CustomerMeasurements,
  DeliveryAddress,
} from "@/lib/supabase";
import { calculateTailoringPrice } from "@/lib/services/tailoringOrderService";
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

interface TailoringOrderModalProps {
  product: Product;
  brand: Brand;
  isOpen: boolean;
  onClose: () => void;
}

export function TailoringOrderModal({
  product,
  brand,
  isOpen,
  onClose,
}: TailoringOrderModalProps) {
  const { user } = useAuth();
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
    country: "Nigeria",
  });

  const [customerNotes, setCustomerNotes] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");

  // Calculate final price
  const finalPrice = calculateTailoringPrice(
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
      alert("Please sign in to submit an order.");
      return;
    }

    if (!isFormValid()) {
      alert("Please fill in all required delivery information.");
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

      setOrderComplete(true);
    } catch (error) {
      console.error("Error creating order:", error);
      alert("Failed to create order. Please try again.");
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
      deliveryAddress.postal_code
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Custom Order: {product.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Order Summary</h3>
            <p className="text-sm text-gray-600 mb-2">
              {product.title} by {brand.name}
            </p>
            <p className="text-lg font-bold text-oma-plum">
              ${product.sale_price || product.price}
            </p>
          </div>

          {/* Customer Information Form */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Contact Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  value={deliveryAddress.full_name}
                  onChange={(e) =>
                    handleAddressChange("full_name", e.target.value)
                  }
                  placeholder="Enter your full name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  value={deliveryAddress.phone}
                  onChange={(e) => handleAddressChange("phone", e.target.value)}
                  placeholder="Enter your phone number"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={deliveryAddress.email}
                  onChange={(e) => handleAddressChange("email", e.target.value)}
                  placeholder="Enter your email address"
                  required
                />
              </div>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Delivery Address</h4>
            <div className="space-y-4">
              <div>
                <Label htmlFor="address_line_1">Street Address *</Label>
                <Input
                  id="address_line_1"
                  value={deliveryAddress.address_line_1}
                  onChange={(e) =>
                    handleAddressChange("address_line_1", e.target.value)
                  }
                  placeholder="Enter your street address"
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={deliveryAddress.city}
                    onChange={(e) =>
                      handleAddressChange("city", e.target.value)
                    }
                    placeholder="City"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    value={deliveryAddress.state}
                    onChange={(e) =>
                      handleAddressChange("state", e.target.value)
                    }
                    placeholder="State"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="postal_code">Postal Code *</Label>
                  <Input
                    id="postal_code"
                    value={deliveryAddress.postal_code}
                    onChange={(e) =>
                      handleAddressChange("postal_code", e.target.value)
                    }
                    placeholder="Postal Code"
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="country">Country</Label>
                <Select
                  value={deliveryAddress.country}
                  onValueChange={(value) =>
                    handleAddressChange("country", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Nigeria">Nigeria</SelectItem>
                    <SelectItem value="Ghana">Ghana</SelectItem>
                    <SelectItem value="Kenya">Kenya</SelectItem>
                    <SelectItem value="South Africa">South Africa</SelectItem>
                    <SelectItem value="United States">United States</SelectItem>
                    <SelectItem value="United Kingdom">
                      United Kingdom
                    </SelectItem>
                    <SelectItem value="Canada">Canada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Customer Notes */}
          <div className="space-y-2">
            <Label htmlFor="customer_notes">Special Requests or Notes</Label>
            <Textarea
              id="customer_notes"
              value={customerNotes}
              onChange={(e) => setCustomerNotes(e.target.value)}
              placeholder="Any special requests, measurements, or notes for the designer..."
              rows={3}
            />
          </div>

          <div className="bg-oma-beige/30 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">
              What happens next?
            </h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• We'll send your order details to {brand.name}</li>
              <li>
                • They'll contact you within 24-48 hours to discuss measurements
              </li>
              <li>• Payment will be processed after order confirmation</li>
              <li>
                • Estimated completion: {product.lead_time || "2-3 weeks"}
              </li>
            </ul>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleSubmitOrder}
              disabled={loading || !isFormValid()}
              className="flex-1 bg-oma-plum hover:bg-oma-plum/90"
            >
              {loading ? "Submitting..." : "Submit Order Request"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

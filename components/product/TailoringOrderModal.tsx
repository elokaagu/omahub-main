"use client";

import { useState } from "react";
import {
  Product,
  Brand,
  CustomerMeasurements,
  DeliveryAddress,
} from "@/lib/supabase";
import {
  createTailoringOrder,
  calculateTailoringPrice,
} from "@/lib/services/tailoringOrderService";
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
    email: "",
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
    try {
      setLoading(true);

      const orderData = {
        user_id: "",
        product_id: product.id,
        brand_id: product.brand_id,
        status: "pending" as const,
        total_amount: finalPrice,
        currency: "USD",
        customer_notes: customerNotes,
        measurements,
        delivery_address: deliveryAddress,
      };

      await createTailoringOrder(orderData);
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
              Your tailoring order has been sent to {brand.name}. They will
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
              className="flex-1 bg-oma-plum hover:bg-oma-plum/90"
            >
              Submit Order Request
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

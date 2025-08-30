"use client";

import { useState, useEffect } from "react";
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
  X,
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
    length_preference: "regular",
    sleeve_preference: "long",
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

  // Log product data for debugging
  useEffect(() => {
    console.log('🔍 TailoredOrderModal - Product data received:', {
      id: product.id,
      title: product.title,
      sizes: product.sizes,
      colors: product.colors,
      sizesType: typeof product.sizes,
      colorsType: typeof product.colors,
      sizesLength: product.sizes ? product.sizes.length : 'N/A',
      colorsLength: product.colors ? product.colors.length : 'N/A'
    });
  }, [product]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setOrderComplete(false);
      setCurrentTab("measurements");
      
      // Reset all form fields
      setMeasurements({
        fit_preference: "regular",
        length_preference: "regular",
        sleeve_preference: "long",
      });
      
      setDeliveryAddress((prev) => ({
        ...prev,
        email: user?.email || "",
        full_name: "",
        phone: "",
        address_line_1: "",
        city: "",
        state: "",
        postal_code: "",
        country: "",
      }));
      
      setCustomerNotes("");
      
      // Initialize size and color with product data if available
      if (product.sizes && product.sizes.length > 0) {
        console.log('🔍 Setting selected size to:', product.sizes[0]);
        setSelectedSize(product.sizes[0]);
      } else {
        console.log('⚠️ No product sizes available');
        setSelectedSize(""); // Reset if no sizes available
      }
      
      if (product.colors && product.colors.length > 0) {
        console.log('🔍 Setting selected color to:', product.colors[0]);
        setSelectedColor(product.colors[0]);
      } else {
        console.log('⚠️ No product colors available');
        setSelectedColor(""); // Reset if no colors available
      }
    }
  }, [isOpen, user?.email, product.sizes, product.colors]);

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
        message: "Please sign in to submit custom orders.",
        showSignUp: true,
      });
      return;
    }

    // Get validation errors
    const validationErrors = getValidationErrors();
    if (validationErrors.length > 0) {
      toast.error(`Please fix the following errors:\n${validationErrors.join('\n')}`);
      return;
    }

    setLoading(true);

    try {
      const orderData = {
        user_id: user.id,
        product_id: product.id,
        brand_id: brand.id,
        customer_notes: customerNotes,
        delivery_address: deliveryAddress,
        total_amount: finalPrice,
        size: selectedSize,
        color: selectedColor,
        quantity: 1,
        measurements: measurements,
      };

      console.log("Submitting custom order:", orderData);

      const response = await fetch("/api/orders/custom", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create order");
      }

      const result = await response.json();
      console.log("Order submitted successfully:", result);

      toast.success("Custom order submitted successfully!");
      engagement.submitCustomOrder(`${product.title} - ${brand.name}`);
      setOrderComplete(true);
      
      // Reset form
      setMeasurements({
        fit_preference: "regular",
        length_preference: "regular",
        sleeve_preference: "long",
      });
      setDeliveryAddress({
        full_name: "",
        phone: "",
        email: user?.email || "",
        address_line_1: "",
        city: "",
        state: "",
        postal_code: "",
        country: "",
      });
      setCustomerNotes("");
      setSelectedSize("");
      setSelectedColor("");
      
    } catch (error) {
      console.error("Error creating order:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    // Check required fields
    const requiredFields = [
      deliveryAddress.full_name,
      deliveryAddress.phone,
      deliveryAddress.email,
      deliveryAddress.address_line_1,
      deliveryAddress.city,
      deliveryAddress.postal_code,
      deliveryAddress.country,
    ];

    // Check if any required field is empty
    if (requiredFields.some(field => !field?.trim())) {
      return false;
    }

    // Check email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(deliveryAddress.email)) {
      return false;
    }

    // Check if at least one measurement preference is selected
    if (!measurements.fit_preference || !measurements.length_preference || !measurements.sleeve_preference) {
      return false;
    }

    return true;
  };

  const getValidationErrors = () => {
    const errors = [];
    
    if (!deliveryAddress.full_name?.trim()) errors.push("Full name is required");
    if (!deliveryAddress.phone?.trim()) errors.push("Phone number is required");
    if (!deliveryAddress.email?.trim()) errors.push("Email is required");
    if (!deliveryAddress.address_line_1?.trim()) errors.push("Address is required");
    if (!deliveryAddress.city?.trim()) errors.push("City is required");
    if (!deliveryAddress.postal_code?.trim()) errors.push("Postal code is required");
    if (!deliveryAddress.country?.trim()) errors.push("Country is required");
    
    // Email format validation
    if (deliveryAddress.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(deliveryAddress.email)) {
      errors.push("Please enter a valid email address");
    }
    
    // Measurement preferences validation
    if (!measurements.fit_preference) errors.push("Please select a fit preference");
    if (!measurements.length_preference) errors.push("Please select a length preference");
    if (!measurements.sleeve_preference) errors.push("Please select a sleeve preference");
    
    return errors;
  };

  // Success state
  if (orderComplete) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md mx-auto">
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="pb-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">
              Custom Order: {product.title}
            </DialogTitle>
            {/* Removed duplicate close button - DialogContent has built-in close */}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4">
          <div className="space-y-6">
            {/* Order Summary */}
            <div className="bg-gradient-to-r from-oma-beige/50 to-oma-gold/10 rounded-lg p-4 border border-oma-gold/20">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Order Summary
                  </h3>
                  <p className="text-sm text-gray-600">
                    {product.title} by {brand.name}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Base Price: {formatProductPrice(product, {
                      price_range: brand.price_range,
                    }).displayPrice}
                  </p>
                  <p className="text-sm text-gray-500">
                    Custom Markup: +30% (Tailored Service)
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-oma-plum">
                    £{finalPrice.toFixed(2)}
                  </p>
                  <Badge variant="secondary" className="mt-1">
                    Custom Order
                  </Badge>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <Tabs
              value={currentTab}
              onValueChange={setCurrentTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="measurements">Measurements</TabsTrigger>
                <TabsTrigger value="contact">Contact</TabsTrigger>
                <TabsTrigger value="review">Review</TabsTrigger>
              </TabsList>

              {/* Measurements Tab */}
              <TabsContent value="measurements" className="space-y-4">
                {/* Validation Errors Display */}
                {(() => {
                  const errors = getValidationErrors();
                  if (errors.length === 0) return null;
                  
                  return (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <h4 className="font-medium text-red-800">Please fix the following errors:</h4>
                      </div>
                      <ul className="text-sm text-red-700 space-y-1">
                        {errors.map((error, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span>
                            {error}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })()}
                
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  {/* Pricing Information */}
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-4 w-4 bg-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">£</span>
                      </div>
                      <p className="font-medium text-blue-800">Pricing Information</p>
                    </div>
                    <p className="text-blue-700">
                      Custom tailored orders include a 30% markup for personalized measurements, 
                      custom fitting, and specialized craftsmanship. This ensures your piece is 
                      perfectly tailored to your specifications.
                    </p>
                  </div>
                  
                  {/* Development Debug Info */}
                  {process.env.NODE_ENV === 'development' && (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-xs">
                      <p className="font-medium text-yellow-800 mb-2">🔍 Debug Info (Development):</p>
                      <div className="grid grid-cols-2 gap-2 text-yellow-700">
                        <div>
                          <p><strong>Product ID:</strong> {product.id}</p>
                          <p><strong>Product Title:</strong> {product.title}</p>
                          <p><strong>Product Sizes:</strong> {product.sizes ? JSON.stringify(product.sizes) : 'None'}</p>
                          <p><strong>Product Colors:</strong> {product.colors ? JSON.stringify(product.colors) : 'None'}</p>
                        </div>
                        <div>
                          <p><strong>Selected Size:</strong> "{selectedSize || 'empty'}"</p>
                          <p><strong>Selected Color:</strong> "{selectedColor || 'empty'}"</p>
                          <p><strong>Sizes Array Length:</strong> {product.sizes ? product.sizes.length : 'N/A'}</p>
                          <p><strong>Colors Array Length:</strong> {product.colors ? product.colors.length : 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-8 w-8 bg-oma-plum/10 rounded-full flex items-center justify-center">
                      <Ruler className="h-4 w-4 text-oma-plum" />
                    </div>
                    <h4 className="font-semibold text-gray-900">
                      Custom Measurements
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fit_preference">Fit Preference</Label>
                      <Select
                        value={measurements.fit_preference}
                        onValueChange={(value) =>
                          handleMeasurementChange("fit_preference", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select fit preference" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="very-loose">Very Loose</SelectItem>
                          <SelectItem value="loose">Loose</SelectItem>
                          <SelectItem value="slightly-loose">
                            Slightly Loose
                          </SelectItem>
                          <SelectItem value="regular">Regular</SelectItem>
                          <SelectItem value="slightly-fitted">
                            Slightly Fitted
                          </SelectItem>
                          <SelectItem value="fitted">Fitted</SelectItem>
                          <SelectItem value="slim">Slim</SelectItem>
                          <SelectItem value="tight">Tight</SelectItem>
                          <SelectItem value="very-tight">Very Tight</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="size">Preferred Size</Label>
                      <Select
                        key={`size-${selectedSize}`}
                        value={selectedSize}
                        onValueChange={setSelectedSize}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select your preferred size" />
                        </SelectTrigger>
                        <SelectContent>
                          {/* Show product's available sizes first */}
                          {product.sizes && product.sizes.length > 0 ? (
                            product.sizes.map((size, index) => (
                              <SelectItem key={`product-${index}`} value={size}>
                                {size}
                              </SelectItem>
                            ))
                          ) : null}
                          
                          {/* Show standard sizes as fallback */}
                          <SelectItem value="xs">XS (Extra Small)</SelectItem>
                          <SelectItem value="s">S (Small)</SelectItem>
                          <SelectItem value="m">M (Medium)</SelectItem>
                          <SelectItem value="l">L (Large)</SelectItem>
                          <SelectItem value="xl">XL (Extra Large)</SelectItem>
                          <SelectItem value="xxl">XXL (2XL)</SelectItem>
                          <SelectItem value="xxxl">XXXL (3XL)</SelectItem>
                          
                          {/* Always show custom option */}
                          <SelectItem value="custom">
                            Custom Measurements
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="color">Preferred Color</Label>
                      {product.colors && product.colors.length > 0 ? (
                        <Select
                          key={`color-${selectedColor}`}
                          value={selectedColor}
                          onValueChange={setSelectedColor}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select your preferred color" />
                          </SelectTrigger>
                          <SelectContent>
                            {product.colors.map((color, index) => (
                              <SelectItem key={`color-${index}`} value={color}>
                                {color}
                              </SelectItem>
                            ))}
                            <SelectItem value="custom">Custom Color</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          id="color"
                          value={selectedColor}
                          onChange={(e) => setSelectedColor(e.target.value)}
                          placeholder="e.g., Navy, Black, etc."
                        />
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="length_preference">
                        Length Preference
                      </Label>
                      <Select
                        value={measurements.length_preference || ""}
                        onValueChange={(value) =>
                          handleMeasurementChange("length_preference", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select length preference" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="short">Short</SelectItem>
                          <SelectItem value="regular">Regular</SelectItem>
                          <SelectItem value="long">Long</SelectItem>
                          <SelectItem value="extra-long">Extra Long</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sleeve_preference">
                        Sleeve Preference
                      </Label>
                      <Select
                        value={measurements.sleeve_preference || ""}
                        onValueChange={(value) =>
                          handleMeasurementChange("sleeve_preference", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select sleeve preference" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="short">Short Sleeve</SelectItem>
                          <SelectItem value="three-quarter">
                            3/4 Sleeve
                          </SelectItem>
                          <SelectItem value="long">Long Sleeve</SelectItem>
                          <SelectItem value="no-sleeve">No Sleeve</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="customer_notes">
                        Special Requirements
                      </Label>
                      <Textarea
                        id="customer_notes"
                        value={customerNotes}
                        onChange={(e) => setCustomerNotes(e.target.value)}
                        placeholder="Any special requirements or notes..."
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Contact Tab */}
              <TabsContent value="contact" className="space-y-4">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-8 w-8 bg-oma-plum/10 rounded-full flex items-center justify-center">
                      <MapPin className="h-4 w-4 text-oma-plum" />
                    </div>
                    <h4 className="font-semibold text-gray-900">
                      Delivery Information
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Full Name *</Label>
                      <Input
                        id="full_name"
                        value={deliveryAddress.full_name}
                        onChange={(e) =>
                          handleAddressChange("full_name", e.target.value)
                        }
                        placeholder="Your full name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        value={deliveryAddress.phone}
                        onChange={(e) =>
                          handleAddressChange("phone", e.target.value)
                        }
                        placeholder="Your phone number"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={deliveryAddress.email}
                        onChange={(e) =>
                          handleAddressChange("email", e.target.value)
                        }
                        placeholder="Your email address"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address_line_1">Address *</Label>
                      <Input
                        id="address_line_1"
                        value={deliveryAddress.address_line_1}
                        onChange={(e) =>
                          handleAddressChange("address_line_1", e.target.value)
                        }
                        placeholder="Street address"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        value={deliveryAddress.city}
                        onChange={(e) =>
                          handleAddressChange("city", e.target.value)
                        }
                        placeholder="City"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="state">State/Province *</Label>
                      <Input
                        id="state"
                        value={deliveryAddress.state}
                        onChange={(e) =>
                          handleAddressChange("state", e.target.value)
                        }
                        placeholder="State or province"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="postal_code">Postal Code *</Label>
                      <Input
                        id="postal_code"
                        value={deliveryAddress.postal_code}
                        onChange={(e) =>
                          handleAddressChange("postal_code", e.target.value)
                        }
                        placeholder="Postal code"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="country">Country *</Label>
                      <Input
                        id="country"
                        value={deliveryAddress.country}
                        onChange={(e) =>
                          handleAddressChange("country", e.target.value)
                        }
                        placeholder="Country"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Review Tab */}
              <TabsContent value="review" className="space-y-4">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-8 w-8 bg-oma-plum/10 rounded-full flex items-center justify-center">
                      <CreditCard className="h-4 w-4 text-oma-plum" />
                    </div>
                    <h4 className="font-semibold text-gray-900">
                      Order Review
                    </h4>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h5 className="font-medium text-gray-900 mb-2">
                        Product Details
                      </h5>
                      <p className="text-sm text-gray-600">
                        {product.title} by {brand.name}
                      </p>
                      <p className="text-lg font-semibold text-oma-plum mt-2">
                        {
                          formatProductPrice(product, {
                            price_range: brand.price_range,
                          }).displayPrice
                        }
                      </p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <h5 className="font-medium text-gray-900 mb-2">
                        Customization
                      </h5>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>Fit: {measurements.fit_preference}</p>
                        {selectedSize && <p>Size: {selectedSize}</p>}
                        {selectedColor && <p>Color: {selectedColor}</p>}
                        {customerNotes && <p>Notes: {customerNotes}</p>}
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <h5 className="font-medium text-gray-900 mb-2">
                        Delivery Address
                      </h5>
                      <div className="text-sm text-gray-600">
                        <p>{deliveryAddress.full_name}</p>
                        <p>{deliveryAddress.address_line_1}</p>
                        <p>
                          {deliveryAddress.city}, {deliveryAddress.state}{" "}
                          {deliveryAddress.postal_code}
                        </p>
                        <p>{deliveryAddress.country}</p>
                        <p className="mt-2">Phone: {deliveryAddress.phone}</p>
                        <p>Email: {deliveryAddress.email}</p>
                      </div>
                    </div>

                    <div className="bg-oma-plum/10 rounded-lg p-4 border border-oma-plum/20">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900">
                            Base Price:
                          </span>
                          <span className="text-gray-600">
                            {formatProductPrice(product, {
                              price_range: brand.price_range,
                            }).displayPrice}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900">
                            Custom Markup (30%):
                          </span>
                          <span className="text-gray-600">
                            +£{((product.sale_price || product.price) * 0.3).toFixed(2)}
                          </span>
                        </div>
                        <div className="border-t pt-2 flex items-center justify-between">
                          <span className="font-medium text-gray-900">
                            Total Amount:
                          </span>
                          <span className="text-2xl font-bold text-oma-plum">
                            £{finalPrice.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t pt-4 flex flex-col sm:flex-row gap-3 justify-between">
          <div className="flex gap-2">
            {currentTab !== "measurements" && (
              <Button
                variant="outline"
                onClick={() => {
                  if (currentTab === "contact") setCurrentTab("measurements");
                  if (currentTab === "review") setCurrentTab("contact");
                }}
              >
                Previous
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            {currentTab === "measurements" && (
              <Button
                onClick={() => setCurrentTab("contact")}
                className="bg-oma-plum hover:bg-oma-plum/90"
              >
                Next: Contact Information
              </Button>
            )}

            {currentTab === "contact" && (
              <Button
                onClick={() => setCurrentTab("review")}
                className="bg-oma-plum hover:bg-oma-plum/90"
              >
                Next: Review Order
              </Button>
            )}

            {currentTab === "review" && (
              <Button
                onClick={handleSubmitOrder}
                disabled={loading || !isFormValid()}
                className="bg-oma-plum hover:bg-oma-plum/90"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Submitting...
                  </>
                ) : (
                  "Submit Custom Order"
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

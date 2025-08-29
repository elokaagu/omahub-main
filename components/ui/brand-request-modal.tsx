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
  Loader2,
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
  brandCurrency,
  size,
  color,
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
    preferred_size: size || "",
    preferred_color: color || "",
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
      preferred_size: size || "",
      preferred_color: color || "",
    };
    
    setFormData(initialFormData);
    setValidationErrors([]);
    
    console.log("🔄 Form reset - Size prop:", size, "Color prop:", color);
    console.log("📝 Initial form data:", initialFormData);
  }, [isOpen, size, color]);

  const handleInputChange = (field: string, value: string | number) => {
    console.log(`📝 Field change: ${field} = ${value}`);
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
                  <p className="text-sm text-gray-600">
                    {price > 0
                      ? formatPrice(price, brandCurrency || "£")
                      : "Contact for pricing"}
                  </p>
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
                <Select
                  value={formData.preferred_size}
                  onValueChange={(value) => handleInputChange("preferred_size", value)}
                >
                  <SelectTrigger className="border-oma-beige focus:border-oma-plum focus:ring-oma-plum">
                    <SelectValue placeholder="Select your preferred size" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Standard Sizes */}
                    <SelectItem value="XXS">XXS (Extra Extra Small)</SelectItem>
                    <SelectItem value="XS">XS (Extra Small)</SelectItem>
                    <SelectItem value="S">S (Small)</SelectItem>
                    <SelectItem value="M">M (Medium)</SelectItem>
                    <SelectItem value="L">L (Large)</SelectItem>
                    <SelectItem value="XL">XL (Extra Large)</SelectItem>
                    <SelectItem value="XXL">XXL (2XL)</SelectItem>
                    <SelectItem value="XXXL">XXXL (3XL)</SelectItem>
                    <SelectItem value="4XL">4XL</SelectItem>
                    <SelectItem value="5XL">5XL</SelectItem>
                    
                    {/* Numeric Sizes */}
                    <SelectItem value="32">32</SelectItem>
                    <SelectItem value="34">34</SelectItem>
                    <SelectItem value="36">36</SelectItem>
                    <SelectItem value="38">38</SelectItem>
                    <SelectItem value="40">40</SelectItem>
                    <SelectItem value="42">42</SelectItem>
                    <SelectItem value="44">44</SelectItem>
                    <SelectItem value="46">46</SelectItem>
                    <SelectItem value="48">48</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="52">52</SelectItem>
                    <SelectItem value="54">54</SelectItem>
                    
                    {/* Custom Options */}
                    <SelectItem value="custom">Custom Measurements</SelectItem>
                    <SelectItem value="petite">Petite</SelectItem>
                    <SelectItem value="tall">Tall</SelectItem>
                    <SelectItem value="plus-size">Plus Size</SelectItem>
                    <SelectItem value="maternity">Maternity</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {/* Debug info - remove in production */}
                {process.env.NODE_ENV === 'development' && (
                  <p className="text-xs text-blue-600 mt-1">
                    Current value: "{formData.preferred_size}" | Size prop: "{size}"
                  </p>
                )}
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
                    <SelectItem value="Nigeria">Nigeria</SelectItem>
                    <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                    <SelectItem value="United States">United States</SelectItem>
                    <SelectItem value="Canada">Canada</SelectItem>
                    <SelectItem value="Australia">Australia</SelectItem>
                    <SelectItem value="Germany">Germany</SelectItem>
                    <SelectItem value="France">France</SelectItem>
                    <SelectItem value="Italy">Italy</SelectItem>
                    <SelectItem value="Spain">Spain</SelectItem>
                    <SelectItem value="Netherlands">Netherlands</SelectItem>
                    <SelectItem value="Belgium">Belgium</SelectItem>
                    <SelectItem value="Switzerland">Switzerland</SelectItem>
                    <SelectItem value="Austria">Austria</SelectItem>
                    <SelectItem value="Sweden">Sweden</SelectItem>
                    <SelectItem value="Norway">Norway</SelectItem>
                    <SelectItem value="Denmark">Denmark</SelectItem>
                    <SelectItem value="Finland">Finland</SelectItem>
                    <SelectItem value="Ireland">Ireland</SelectItem>
                    <SelectItem value="Portugal">Portugal</SelectItem>
                    <SelectItem value="Greece">Greece</SelectItem>
                    <SelectItem value="Poland">Poland</SelectItem>
                    <SelectItem value="Czech Republic">Czech Republic</SelectItem>
                    <SelectItem value="Hungary">Hungary</SelectItem>
                    <SelectItem value="Romania">Romania</SelectItem>
                    <SelectItem value="Bulgaria">Bulgaria</SelectItem>
                    <SelectItem value="Croatia">Croatia</SelectItem>
                    <SelectItem value="Slovenia">Slovenia</SelectItem>
                    <SelectItem value="Slovakia">Slovakia</SelectItem>
                    <SelectItem value="Estonia">Estonia</SelectItem>
                    <SelectItem value="Latvia">Latvia</SelectItem>
                    <SelectItem value="Lithuania">Lithuania</SelectItem>
                    <SelectItem value="Luxembourg">Luxembourg</SelectItem>
                    <SelectItem value="Malta">Malta</SelectItem>
                    <SelectItem value="Cyprus">Cyprus</SelectItem>
                    <SelectItem value="Iceland">Iceland</SelectItem>
                    <SelectItem value="Liechtenstein">Liechtenstein</SelectItem>
                    <SelectItem value="Monaco">Monaco</SelectItem>
                    <SelectItem value="San Marino">San Marino</SelectItem>
                    <SelectItem value="Vatican City">Vatican City</SelectItem>
                    <SelectItem value="Andorra">Andorra</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {/* Debug info - remove in production */}
                {process.env.NODE_ENV === 'development' && (
                  <p className="text-xs text-blue-600 mt-1">
                    Current value: "{formData.country}"
                  </p>
                )}
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
            
            {/* Debug Display (Development Only) */}
            {process.env.NODE_ENV === "development" && (
              <div className="mt-4 p-3 bg-gray-100 rounded-lg text-xs">
                <h4 className="font-medium mb-2">Debug Info:</h4>
                <div className="space-y-1">
                  <p><strong>Quantity:</strong> {formData.quantity}</p>
                  <p><strong>Preferred Size:</strong> {formData.preferred_size || 'Not selected'}</p>
                  <p><strong>Preferred Color:</strong> {formData.preferred_color || 'Not entered'}</p>
                  <p><strong>Full Name:</strong> {formData.full_name || 'Not entered'}</p>
                  <p><strong>Email:</strong> {formData.email || 'Not entered'}</p>
                  <p className="text-blue-600"><strong>Note:</strong> Address fields are now optional</p>
                </div>
                
                {/* Test Buttons */}
                <div className="mt-3 space-y-2">
                  <h5 className="font-medium">Test Dropdowns:</h5>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleInputChange("preferred_size", "M")}
                      className="text-xs"
                    >
                      Set Size: M
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleInputChange("preferred_size", "XL")}
                      className="text-xs"
                    >
                      Set Size: XL
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleInputChange("preferred_size", "custom")}
                      className="text-xs"
                    >
                      Set Size: Custom
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleInputChange("country", "United Kingdom")}
                      className="text-xs"
                    >
                      Set Country: UK
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleInputChange("country", "Nigeria")}
                      className="text-xs"
                    >
                      Set Country: Nigeria
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

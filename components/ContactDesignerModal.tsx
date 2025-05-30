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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface ContactDesignerModalProps {
  isOpen: boolean;
  onClose: () => void;
  brandName: string;
}

export default function ContactDesignerModal({
  isOpen,
  onClose,
  brandName,
}: ContactDesignerModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    setFormData({
      ...formData,
      [id]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (
      !formData.name.trim() ||
      !formData.email.trim() ||
      !formData.message.trim()
    ) {
      toast.error("Please fill out all fields");
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success(`Your message to ${brandName} has been sent successfully.`);

      // Reset form and close modal
      setFormData({
        name: "",
        email: "",
        message: "",
      });
      onClose();
    } catch (error) {
      toast.error("Failed to send your message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Contact {brandName}</DialogTitle>
          <DialogDescription>
            Send a message directly to this designer. They will respond to your
            email address.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Your Name
            </label>
            <Input
              id="name"
              value={formData.name}
              onChange={handleInputChange}
              disabled={isSubmitting}
              required
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email Address
            </label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              disabled={isSubmitting}
              required
            />
          </div>
          <div>
            <label htmlFor="message" className="block text-sm font-medium mb-1">
              Your Message
            </label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={handleInputChange}
              rows={4}
              disabled={isSubmitting}
              required
              placeholder="Introduce yourself and ask about their designs, availability, or pricing..."
            />
          </div>
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-oma-plum hover:bg-oma-plum/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Sending..." : "Send Message"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

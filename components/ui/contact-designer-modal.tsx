"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { Mail } from "lucide-react";
import { toast } from "sonner";

interface ContactDesignerModalProps {
  designerName: string;
  children: React.ReactNode;
}

export function ContactDesignerModal({
  designerName,
  children,
}: ContactDesignerModalProps) {
  const [open, setOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Message sent successfully!");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Contact {designerName}</DialogTitle>
          <DialogDescription>
            Send a message directly to the designer. They typically respond
            within 48 hours.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input placeholder="Your name" required />
          <Input type="email" placeholder="Your email" required />
          <Textarea
            placeholder="Your message"
            className="min-h-[100px]"
            required
          />
          <div className="flex justify-end">
            <Button type="submit" className="bg-oma-plum hover:bg-oma-plum/90">
              <Mail className="mr-2 h-4 w-4" />
              Send Message
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

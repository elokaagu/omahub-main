"use client";

import { useState } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { MessageSquare, Send, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function FeedbackPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    feedbackType: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      feedbackType: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Submit feedback to API endpoint
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to submit feedback");
      }
      
      toast.success("Thank you for your feedback! We'll review it shortly.");
      setIsSubmitted(true);
      setFormData({
        name: "",
        email: "",
        feedbackType: "",
        subject: "",
        message: "",
      });
    } catch (error) {
      console.error("Feedback submission error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to submit feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-oma-cream via-white to-oma-beige">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-4xl font-canela text-oma-plum mb-4">
              Thank You for Your Feedback!
            </h1>
            <p className="text-xl text-oma-cocoa mb-8 max-w-2xl mx-auto">
              We've received your feedback and will review it carefully. Your input helps us improve OmaHub and provide a better experience for our community.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                asChild
                size="lg"
                className="bg-oma-plum hover:bg-oma-plum/90 text-white px-8 py-4 text-lg"
              >
                <Link href="/">Return Home</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-oma-plum text-oma-plum hover:bg-oma-plum/10 px-8 py-4 text-lg"
                onClick={() => setIsSubmitted(false)}
              >
                <button>Submit More Feedback</button>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-oma-cream via-white to-oma-beige">
      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-oma-plum/10 rounded-full mb-6">
            <MessageSquare className="h-8 w-8 text-oma-plum" />
          </div>
          <h1 className="text-4xl font-canela text-oma-plum mb-4">
            Share Your Feedback
          </h1>
          <p className="text-xl text-oma-cocoa max-w-2xl mx-auto">
            Help us improve OmaHub! We value your thoughts, suggestions, and feedback. 
            Your input shapes the future of our platform.
          </p>
        </div>

        {/* Feedback Form */}
        <Card className="max-w-2xl mx-auto border-oma-gold/20 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-canela text-oma-plum">
              Tell Us What You Think
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name and Email Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-oma-cocoa font-medium">
                    Name *
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Your name"
                    className="border-oma-gold/30 focus:border-oma-plum focus:ring-oma-plum/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-oma-cocoa font-medium">
                    Email *
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="your.email@example.com"
                    className="border-oma-gold/30 focus:border-oma-plum focus:ring-oma-plum/20"
                  />
                </div>
              </div>

              {/* Feedback Type */}
              <div className="space-y-2">
                <Label htmlFor="feedbackType" className="text-oma-cocoa font-medium">
                  Feedback Type *
                </Label>
                <Select
                  value={formData.feedbackType}
                  onValueChange={handleSelectChange}
                  required
                >
                  <SelectTrigger className="border-oma-gold/30 focus:border-oma-plum focus:ring-oma-plum/20">
                    <SelectValue placeholder="Select feedback type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General Feedback</SelectItem>
                    <SelectItem value="bug">Bug Report</SelectItem>
                    <SelectItem value="feature">Feature Request</SelectItem>
                    <SelectItem value="improvement">Improvement Suggestion</SelectItem>
                    <SelectItem value="compliment">Compliment</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Subject */}
              <div className="space-y-2">
                <Label htmlFor="subject" className="text-oma-cocoa font-medium">
                  Subject *
                </Label>
                <Input
                  id="subject"
                  name="subject"
                  type="text"
                  required
                  value={formData.subject}
                  onChange={handleInputChange}
                  placeholder="Brief summary of your feedback"
                  className="border-oma-gold/30 focus:border-oma-plum focus:ring-oma-plum/20"
                />
              </div>

              {/* Message */}
              <div className="space-y-2">
                <Label htmlFor="message" className="text-oma-cocoa font-medium">
                  Message *
                </Label>
                <Textarea
                  id="message"
                  name="message"
                  required
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="Please provide detailed feedback, suggestions, or describe any issues you've encountered..."
                  rows={6}
                  className="border-oma-gold/30 focus:border-oma-plum focus:ring-oma-plum/20 resize-none"
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-oma-plum hover:bg-oma-plum/90 text-white py-4 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Submitting...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Send className="h-5 w-5" />
                    Submit Feedback
                  </div>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Additional Info */}
        <div className="mt-12 text-center">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-oma-gold/20">
            <h3 className="text-xl font-canela text-oma-plum mb-4">
              Why Your Feedback Matters
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-oma-cocoa">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-oma-plum/10 rounded-full flex items-center justify-center mb-3">
                  <span className="text-oma-plum text-xl">🎯</span>
                </div>
                <p className="text-center">Helps us prioritize improvements</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-oma-plum/10 rounded-full flex items-center justify-center mb-3">
                  <span className="text-oma-plum text-xl">💡</span>
                </div>
                <p className="text-center">Drives innovation and new features</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-oma-plum/10 rounded-full flex items-center justify-center mb-3">
                  <span className="text-oma-plum text-xl">🤝</span>
                </div>
                <p className="text-center">Builds a better community</p>
              </div>
            </div>
          </div>
        </div>

        {/* Alternative Contact */}
        <div className="mt-12 text-center">
          <p className="text-oma-cocoa mb-4">
            Prefer to contact us directly?
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              variant="outline"
              className="border-oma-plum text-oma-plum hover:bg-oma-plum/10"
            >
              <Link href="/contact">Contact Support</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-oma-plum text-oma-plum hover:bg-oma-plum/10"
            >
              <a href="mailto:feedback@oma-hub.com">Email Us</a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Mail, Calendar, Clock, X } from "lucide-react";
import { fadeIn, slideIn } from "@/app/utils/animations";

interface ApplicationConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId?: string;
  brandName?: string;
  designerName?: string;
  email?: string;
}

export default function ApplicationConfirmationModal({
  isOpen,
  onClose,
  applicationId,
  brandName,
  designerName,
  email,
}: ApplicationConfirmationModalProps) {
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 300);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="relative overflow-hidden">
            <CardHeader className="text-center pb-4 bg-gradient-to-r from-oma-plum to-oma-plum/90 p-6">
              <div className="flex justify-end mb-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  className="h-8 w-8 p-0 hover:bg-white/20 text-white"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <motion.div
                variants={fadeIn}
                initial="hidden"
                animate="visible"
                className="flex flex-col items-center space-y-4"
              >
                {/* OmaHub Banner */}
                <div className="mb-4">
                  <img
                    src="/omahub-banner.png"
                    alt="OmaHub"
                    className="h-auto w-auto max-w-[200px]"
                  />
                </div>
                
                <div className="relative">
                  <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="absolute -top-1 -right-1 h-6 w-6 bg-green-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                </div>
                
                <div>
                  <CardTitle className="text-2xl font-bold text-white mb-2">
                    Application Submitted!
                  </CardTitle>
                  <p className="text-white/90 text-sm">
                    Your designer application has been successfully submitted
                  </p>
                </div>
              </motion.div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Application Details */}
              <motion.div
                variants={slideIn}
                initial="hidden"
                animate="visible"
                transition={{ delay: 0.2 }}
                className="bg-gray-50 rounded-lg p-4 space-y-3"
              >
                <h3 className="font-semibold text-gray-900 mb-3">Application Details</h3>
                
                {brandName && (
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs">
                      Brand
                    </Badge>
                    <span className="text-sm font-medium text-gray-700">
                      {brandName}
                    </span>
                  </div>
                )}
                
                {designerName && (
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs">
                      Designer
                    </Badge>
                    <span className="text-sm font-medium text-gray-700">
                      {designerName}
                    </span>
                  </div>
                )}
                
                {email && (
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">{email}</span>
                  </div>
                )}
                
                {applicationId && (
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="text-xs">
                      ID: {applicationId.slice(0, 8)}...
                    </Badge>
                  </div>
                )}
              </motion.div>

              {/* Next Steps */}
              <motion.div
                variants={slideIn}
                initial="hidden"
                animate="visible"
                transition={{ delay: 0.3 }}
                className="space-y-4"
              >
                <h3 className="font-semibold text-gray-900">What happens next?</h3>
                
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="h-6 w-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Calendar className="h-3 w-3 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Review Process
                      </p>
                      <p className="text-xs text-gray-600">
                        Our team will review your application within 3-5 business days
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="h-6 w-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Mail className="h-3 w-3 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Email Notification
                      </p>
                      <p className="text-xs text-gray-600">
                        You'll receive an email with our decision and next steps
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="h-6 w-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Clock className="h-3 w-3 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Studio Access
                      </p>
                      <p className="text-xs text-gray-600">
                        If approved, you'll get access to the OmaHub Studio
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Action Buttons */}
              <motion.div
                variants={slideIn}
                initial="hidden"
                animate="visible"
                transition={{ delay: 0.4 }}
                className="flex flex-col space-y-3 pt-4"
              >
                <Button
                  onClick={handleClose}
                  className="w-full bg-oma-plum hover:bg-oma-plum/90 text-white"
                >
                  Got it, thanks!
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => {
                    window.location.href = "/contact";
                  }}
                  className="w-full"
                >
                  Contact Support
                </Button>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export type StudioInquiryPriority = "low" | "normal" | "high";
export type StudioInquiryStatus = "new" | "read" | "replied" | "closed";

export type StudioInquiry = {
  id: string;
  brand_id: string;
  customer_name: string;
  customer_email: string;
  subject: string;
  message: string;
  inquiry_type: string;
  priority: StudioInquiryPriority;
  status: StudioInquiryStatus;
  source: string;
  created_at: string;
  brand?: {
    name: string;
    category?: string;
  };
};

export type StudioNotification = {
  id: string;
  user_id: string;
  brand_id: string;
  type: string;
  title: string;
  message: string;
  data?: unknown;
  is_read: boolean;
  created_at: string;
  brand?: {
    name: string;
  };
};

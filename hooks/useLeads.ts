import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { formatCurrency } from "@/lib/utils";

// Types
export interface Lead {
  id?: string;
  brand_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  source:
    | "website"
    | "whatsapp"
    | "instagram"
    | "email"
    | "phone"
    | "referral"
    | "direct";
  lead_type:
    | "inquiry"
    | "quote_request"
    | "booking_intent"
    | "consultation"
    | "product_interest";
  status: "new" | "contacted" | "qualified" | "converted" | "lost" | "closed";
  priority?: "low" | "normal" | "high" | "urgent";
  estimated_value?: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  contacted_at?: string;
  qualified_at?: string;
  converted_at?: string;
  // From view
  brand_name?: string;
  brand_category?: string;
  brand_image?: string;
  interaction_count?: number;
  latest_interaction_date?: string;
  latest_interaction_type?: string;
  booking_id?: string;
  booking_value?: number;
  commission_amount?: number;
  booking_date?: string;
  booking_status?: string;
  brand_location?: string;
}

export interface Booking {
  id?: string;
  lead_id?: string;
  brand_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  booking_type:
    | "custom_order"
    | "ready_to_wear"
    | "consultation"
    | "fitting"
    | "alteration"
    | "rental";
  status: "confirmed" | "in_progress" | "completed" | "cancelled" | "refunded";
  booking_value: number;
  commission_rate?: number;
  commission_amount?: number;
  currency?: string;
  booking_date?: string;
  delivery_date?: string;
  completion_date?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  // From joins
  brands?: { name: string; image: string };
  leads?: {
    customer_name: string;
    customer_email: string;
    source: string;
    lead_type: string;
  };
}

export interface LeadInteraction {
  id?: string;
  lead_id: string;
  interaction_type:
    | "email"
    | "phone"
    | "whatsapp"
    | "meeting"
    | "quote_sent"
    | "follow_up"
    | "note";
  interaction_date?: string;
  description?: string;
  admin_id?: string;
  created_at?: string;
}

export interface LeadsAnalytics {
  total_leads: number;
  qualified_leads: number;
  converted_leads: number;
  total_bookings: number;
  total_booking_value: number;
  total_commission_earned: number;
  average_booking_value: number;
  conversion_rate: number;
  this_month_leads: number;
  this_month_bookings: number;
  this_month_revenue: number;
  this_month_commission: number;
  top_performing_brands: Array<{
    brand_id: string;
    brand_name: string;
    total_revenue: number;
    total_commission: number;
  }>;
  leads_by_source: Record<string, number>;
  bookings_by_type: Record<string, number>;
  monthly_trends: Array<{
    month: string;
    leads: number;
    bookings: number;
    revenue: number;
    commission: number;
  }>;
}

export interface CommissionStructure {
  id?: string;
  brand_id?: string;
  booking_type: string;
  min_booking_value: number;
  max_booking_value?: number;
  commission_rate: number;
  currency: string;
  is_active: boolean;
  effective_date?: string;
  created_at?: string;
  updated_at?: string;
}

// Hook for fetching leads
export function useLeads(filters?: {
  brand_id?: string;
  status?: string;
  source?: string;
  limit?: number;
  offset?: number;
}) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  // Add refs to prevent race conditions
  const isFetchingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchLeads = useCallback(async () => {
    // Prevent concurrent fetches
    if (isFetchingRef.current) {
      console.log("🔄 useLeads: Fetch already in progress, skipping...");
      return;
    }

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      isFetchingRef.current = true;
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filters?.brand_id) params.append("brand_id", filters.brand_id);
      if (filters?.status) params.append("status", filters.status);
      if (filters?.source) params.append("source", filters.source);
      if (filters?.limit) params.append("limit", filters.limit.toString());
      if (filters?.offset) params.append("offset", filters.offset.toString());

      const response = await fetch(`/api/admin/leads?${params.toString()}`, {
        credentials: "include",
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch leads: ${response.status}`);
      }

      const data = await response.json();

      // Only update state if the request wasn't aborted
      if (!abortController.signal.aborted) {
        setLeads(data.leads || []);
        setTotal(data.total || 0);
      }
    } catch (err) {
      // Don't show errors for aborted requests
      if (err instanceof Error && err.name === "AbortError") {
        console.log("🔄 useLeads: Request aborted");
        return;
      }

      console.error("Error fetching leads:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch leads");
      toast.error("Failed to fetch leads");
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, [
    filters?.brand_id,
    filters?.status,
    filters?.source,
    filters?.limit,
    filters?.offset,
  ]); // Stable dependencies

  useEffect(() => {
    fetchLeads();

    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchLeads]);

  return {
    leads,
    loading,
    error,
    total,
    refetch: fetchLeads,
  };
}

// Hook for fetching bookings
export function useBookings(filters?: {
  brand_id?: string;
  limit?: number;
  offset?: number;
}) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  // Add refs to prevent race conditions
  const isFetchingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchBookings = useCallback(async () => {
    // Prevent concurrent fetches
    if (isFetchingRef.current) {
      console.log("🔄 useBookings: Fetch already in progress, skipping...");
      return;
    }

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      isFetchingRef.current = true;
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append("action", "bookings");
      if (filters?.brand_id) params.append("brand_id", filters.brand_id);
      if (filters?.limit) params.append("limit", filters.limit.toString());
      if (filters?.offset) params.append("offset", filters.offset.toString());

      const response = await fetch(`/api/admin/leads?${params.toString()}`, {
        credentials: "include",
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch bookings: ${response.status}`);
      }

      const data = await response.json();

      // Only update state if the request wasn't aborted
      if (!abortController.signal.aborted) {
        setBookings(data.bookings || []);
        setTotal(data.total || 0);
      }
    } catch (err) {
      // Don't show errors for aborted requests
      if (err instanceof Error && err.name === "AbortError") {
        console.log("🔄 useBookings: Request aborted");
        return;
      }

      console.error("Error fetching bookings:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch bookings");
      toast.error("Failed to fetch bookings");
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, [filters?.brand_id, filters?.limit, filters?.offset]); // Stable dependencies

  useEffect(() => {
    fetchBookings();

    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchBookings]);

  return {
    bookings,
    loading,
    error,
    total,
    refetch: fetchBookings,
  };
}

// Hook for fetching leads analytics
export function useLeadsAnalytics() {
  const [analytics, setAnalytics] = useState<LeadsAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add refs to prevent race conditions
  const isFetchingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchAnalytics = useCallback(async () => {
    // Prevent concurrent fetches
    if (isFetchingRef.current) {
      console.log(
        "🔄 useLeadsAnalytics: Fetch already in progress, skipping..."
      );
      return;
    }

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      isFetchingRef.current = true;
      setLoading(true);
      setError(null);

      const response = await fetch("/api/admin/leads?action=analytics", {
        credentials: "include",
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch analytics: ${response.status}`);
      }

      const data = await response.json();

      // Only update state if the request wasn't aborted
      if (!abortController.signal.aborted) {
        setAnalytics(data.analytics || null);
      }
    } catch (err) {
      // Don't show errors for aborted requests
      if (err instanceof Error && err.name === "AbortError") {
        console.log("🔄 useLeadsAnalytics: Request aborted");
        return;
      }

      console.error("Error fetching analytics:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch analytics"
      );
      toast.error("Failed to fetch analytics");
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, []); // No dependencies - analytics don't need filters

  useEffect(() => {
    fetchAnalytics();

    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchAnalytics]);

  return {
    analytics,
    loading,
    error,
    refetch: fetchAnalytics,
  };
}

// Hook for fetching commission structure
export function useCommissionStructure() {
  const [commissionStructure, setCommissionStructure] = useState<
    CommissionStructure[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add refs to prevent race conditions
  const isFetchingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchCommissionStructure = useCallback(async () => {
    // Prevent concurrent fetches
    if (isFetchingRef.current) {
      console.log(
        "🔄 useCommissionStructure: Fetch already in progress, skipping..."
      );
      return;
    }

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      isFetchingRef.current = true;
      setLoading(true);
      setError(null);

      const response = await fetch("/api/admin/leads?action=commission", {
        credentials: "include",
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch commission structure: ${response.status}`
        );
      }

      const data = await response.json();

      // Only update state if the request wasn't aborted
      if (!abortController.signal.aborted) {
        setCommissionStructure(data.commission || []);
      }
    } catch (err) {
      // Don't show errors for aborted requests
      if (err instanceof Error && err.name === "AbortError") {
        console.log("🔄 useCommissionStructure: Request aborted");
        return;
      }

      console.error("Error fetching commission structure:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch commission structure"
      );
      toast.error("Failed to fetch commission structure");
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, []); // No dependencies

  useEffect(() => {
    fetchCommissionStructure();

    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchCommissionStructure]);

  return {
    commissionStructure,
    loading,
    error,
    refetch: fetchCommissionStructure,
  };
}

// Hook for lead mutations (create, update, delete)
export function useLeadMutations() {
  const [loading, setLoading] = useState(false);

  const createLead = async (
    leadData: Omit<Lead, "id" | "created_at" | "updated_at">
  ) => {
    try {
      setLoading(true);

      const response = await fetch("/api/admin/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          type: "lead",
          data: leadData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create lead");
      }

      const result = await response.json();
      toast.success("Lead created successfully");
      return result.lead;
    } catch (err) {
      console.error("Error creating lead:", err);
      toast.error(err instanceof Error ? err.message : "Failed to create lead");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateLead = async (id: string, updates: Partial<Lead>) => {
    try {
      setLoading(true);

      const response = await fetch("/api/admin/leads", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          type: "lead",
          id,
          data: updates,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update lead");
      }

      const result = await response.json();
      toast.success("Lead updated successfully");
      return result.lead;
    } catch (err) {
      console.error("Error updating lead:", err);
      toast.error(err instanceof Error ? err.message : "Failed to update lead");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteLead = async (id: string) => {
    try {
      setLoading(true);

      const response = await fetch(`/api/admin/leads?type=lead&id=${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete lead");
      }

      toast.success("Lead deleted successfully");
    } catch (err) {
      console.error("Error deleting lead:", err);
      toast.error(err instanceof Error ? err.message : "Failed to delete lead");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const addInteraction = async (
    interactionData: Omit<LeadInteraction, "id" | "created_at" | "admin_id">
  ) => {
    try {
      setLoading(true);

      const response = await fetch("/api/admin/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          type: "interaction",
          data: interactionData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add interaction");
      }

      const result = await response.json();
      toast.success("Interaction added successfully");
      return result.interaction;
    } catch (err) {
      console.error("Error adding interaction:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to add interaction"
      );
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    createLead,
    updateLead,
    deleteLead,
    addInteraction,
    loading,
  };
}

// Hook for booking mutations
export function useBookingMutations() {
  const [loading, setLoading] = useState(false);

  const createBooking = async (
    bookingData: Omit<
      Booking,
      "id" | "created_at" | "updated_at" | "commission_amount"
    >
  ) => {
    try {
      setLoading(true);

      const response = await fetch("/api/admin/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          type: "booking",
          data: bookingData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create booking");
      }

      const result = await response.json();
      toast.success("Booking created successfully");
      return result.booking;
    } catch (err) {
      console.error("Error creating booking:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to create booking"
      );
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateBooking = async (id: string, updates: Partial<Booking>) => {
    try {
      setLoading(true);

      const response = await fetch("/api/admin/leads", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          type: "booking",
          id,
          data: updates,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update booking");
      }

      const result = await response.json();
      toast.success("Booking updated successfully");
      return result.booking;
    } catch (err) {
      console.error("Error updating booking:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to update booking"
      );
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteBooking = async (id: string) => {
    try {
      setLoading(true);

      const response = await fetch(`/api/admin/leads?type=booking&id=${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete booking");
      }

      toast.success("Booking deleted successfully");
    } catch (err) {
      console.error("Error deleting booking:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to delete booking"
      );
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    createBooking,
    updateBooking,
    deleteBooking,
    loading,
  };
}

// Hook for commission structure mutations (super admin only)
export function useCommissionMutations() {
  const [loading, setLoading] = useState(false);

  const updateCommissionStructure = async (
    id: string,
    updates: Partial<CommissionStructure>
  ) => {
    try {
      setLoading(true);

      const response = await fetch("/api/admin/leads", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          type: "commission",
          id,
          data: updates,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to update commission structure"
        );
      }

      const result = await response.json();
      toast.success("Commission structure updated successfully");
      return result.commission;
    } catch (err) {
      console.error("Error updating commission structure:", err);
      toast.error(
        err instanceof Error
          ? err.message
          : "Failed to update commission structure"
      );
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    updateCommissionStructure,
    loading,
  };
}

// Utility functions
export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const getStatusColor = (status: string) => {
  const colors = {
    new: "bg-blue-100 text-blue-800",
    contacted: "bg-yellow-100 text-yellow-800",
    qualified: "bg-purple-100 text-purple-800",
    converted: "bg-green-100 text-green-800",
    lost: "bg-red-100 text-red-800",
    closed: "bg-gray-100 text-gray-800",
    confirmed: "bg-blue-100 text-blue-800",
    in_progress: "bg-yellow-100 text-yellow-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
    refunded: "bg-orange-100 text-orange-800",
  };
  return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800";
};

export const getPriorityColor = (priority: string) => {
  const colors = {
    low: "bg-gray-100 text-gray-800",
    normal: "bg-blue-100 text-blue-800",
    high: "bg-orange-100 text-orange-800",
    urgent: "bg-red-100 text-red-800",
  };
  return colors[priority as keyof typeof colors] || "bg-gray-100 text-gray-800";
};

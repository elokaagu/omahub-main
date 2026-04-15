import { useState, useCallback, useRef, useEffect } from "react";
import { toast } from "sonner";
import type { ApplicationStatus, DesignerApplication } from "./types";
import {
  fetchStudioApplications,
  updateStudioApplication,
  deleteStudioApplication,
} from "./studioApplicationsApi";
import { devLog, devWarn } from "./devLog";

export function useStudioApplications(fetchEnabled: boolean) {
  const [applications, setApplications] = useState<DesignerApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedApplication, setSelectedApplication] =
    useState<DesignerApplication | null>(null);
  const [updatingApplicationId, setUpdatingApplicationId] = useState<
    string | null
  >(null);
  const [deletingApplication, setDeletingApplication] = useState<string | null>(
    null
  );

  const fetchAbortRef = useRef<AbortController | null>(null);

  const fetchApplications = useCallback(async () => {
    fetchAbortRef.current?.abort();
    const ac = new AbortController();
    fetchAbortRef.current = ac;
    const { signal } = ac;

    try {
      setLoading(true);
      setError(null);

      devLog("🔄 [Applications] Fetching all applications from API...");

      const apps = await fetchStudioApplications(signal);

      if (signal.aborted) return;

      devLog("✅ [Applications] Set", apps.length, "applications in state");
      if (apps.length === 0) {
        devWarn(
          "⚠️ [Applications] No applications found (DB empty, wrong table, or RLS)."
        );
      }

      setApplications(apps);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      if (signal.aborted) return;

      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch applications";
      console.error("❌ [Applications] Fetch error:", err);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      if (!signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    return () => fetchAbortRef.current?.abort();
  }, []);

  useEffect(() => {
    if (!fetchEnabled) {
      fetchAbortRef.current?.abort();
      setLoading(false);
      return;
    }
    fetchApplications();
  }, [fetchEnabled, fetchApplications]);

  const updateApplicationStatus = useCallback(
    async (applicationId: string, status: ApplicationStatus, notes?: string) => {
      try {
        setUpdatingApplicationId(applicationId);

        setApplications((prev) =>
          prev.map((app) =>
            app.id === applicationId
              ? {
                  ...app,
                  status,
                  notes: notes ?? app.notes,
                  updated_at: new Date().toISOString(),
                }
              : app
          )
        );

        setSelectedApplication((prev) =>
          prev?.id === applicationId
            ? {
                ...prev,
                status,
                notes: notes ?? prev.notes,
                updated_at: new Date().toISOString(),
              }
            : prev
        );

        const serverApp = await updateStudioApplication(applicationId, {
          status,
          notes,
        });

        if (serverApp) {
          setApplications((prev) =>
            prev.map((app) =>
              app.id === applicationId ? { ...app, ...serverApp } : app
            )
          );
          setSelectedApplication((prev) =>
            prev?.id === applicationId ? { ...prev, ...serverApp } : prev
          );
        }

        toast.success(
          `Application ${
            status === "approved"
              ? "approved"
              : status === "rejected"
                ? "rejected"
                : "updated"
          } successfully`
        );

        if (status === "approved" || status === "rejected") {
          setSelectedApplication(null);
        }
      } catch (err) {
        console.error("❌ Update error:", err);
        toast.error(
          err instanceof Error ? err.message : "Failed to update application"
        );
        await fetchApplications();
      } finally {
        setUpdatingApplicationId(null);
      }
    },
    [fetchApplications]
  );

  const deleteApplication = useCallback(
    async (applicationId: string) => {
      let sawNotFound = false;
      const snapshot = applications.find((app) => app.id === applicationId);

      try {
        setDeletingApplication(applicationId);

        devLog("🗑️ [Applications] Delete attempt:", {
          id: applicationId,
          brand_name: snapshot?.brand_name,
        });

        setApplications((prev) => prev.filter((app) => app.id !== applicationId));
        setSelectedApplication((prev) =>
          prev?.id === applicationId ? null : prev
        );

        const result = await deleteStudioApplication(applicationId);

        if (result.notFound) {
          sawNotFound = true;
          devWarn(
            "⚠️ [Applications] 404 on delete — treating as already removed"
          );
          toast.success("Application removed (was already deleted)");
          await fetchApplications();
          return;
        }

        devLog("✅ [Applications] Delete successful");
        toast.success("Application deleted successfully");
        await fetchApplications();
      } catch (err) {
        console.error("❌ [Applications] Delete error:", err);
        toast.error(
          err instanceof Error ? err.message : "Failed to delete application"
        );

        if (snapshot) {
          devLog(
            "🔄 [Applications] Reverting optimistic delete:",
            snapshot.brand_name
          );
          setApplications((prev) => {
            if (!prev.find((app) => app.id === applicationId)) {
              return [...prev, snapshot].sort(
                (a, b) =>
                  new Date(b.created_at).getTime() -
                  new Date(a.created_at).getTime()
              );
            }
            return prev;
          });
        }

        if (!sawNotFound) {
          await fetchApplications();
        }
      } finally {
        setDeletingApplication(null);
      }
    },
    [applications, fetchApplications]
  );

  return {
    applications,
    loading,
    error,
    fetchApplications,
    selectedApplication,
    setSelectedApplication,
    updatingApplicationId,
    deletingApplication,
    updateApplicationStatus,
    deleteApplication,
  };
}

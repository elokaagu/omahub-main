import type { ApplicationStatus, DesignerApplication } from "./types";

export async function fetchStudioApplications(
  signal?: AbortSignal
): Promise<DesignerApplication[]> {
  const timestamp = Date.now();
  const response = await fetch(`/api/studio/applications?t=${timestamp}`, {
    method: "GET",
    cache: "no-store",
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
    },
    signal,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      typeof errorData.error === "string"
        ? errorData.error
        : `Failed to fetch applications (${response.status})`
    );
  }

  const data = (await response.json()) as {
    applications?: DesignerApplication[];
    rawCount?: number;
    timestamp?: string;
  };

  return data.applications ?? [];
}

export async function updateStudioApplication(
  applicationId: string,
  body: { status: ApplicationStatus; notes?: string },
  signal?: AbortSignal
): Promise<DesignerApplication | undefined> {
  const response = await fetch(`/api/studio/applications/${applicationId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });

  const result = (await response.json().catch(() => ({}))) as {
    error?: string;
    application?: DesignerApplication;
  };

  if (!response.ok) {
    throw new Error(
      typeof result.error === "string"
        ? result.error
        : `Failed to update (${response.status})`
    );
  }

  return result.application;
}

export async function deleteStudioApplication(
  applicationId: string,
  signal?: AbortSignal
): Promise<{ ok: true; notFound?: boolean }> {
  const response = await fetch(`/api/studio/applications/${applicationId}`, {
    method: "DELETE",
    signal,
  });

  if (response.status === 404) {
    return { ok: true, notFound: true };
  }

  if (!response.ok) {
    const errorData = await response.json().catch(async () => ({
      error: await response.text().catch(() => "Unknown error"),
    }));
    throw new Error(
      typeof errorData.error === "string"
        ? errorData.error
        : `Failed to delete: ${response.statusText}`
    );
  }

  await response.json().catch(() => undefined);
  return { ok: true };
}

"use client";

type LoginAuthBannersProps = {
  infoMessage: string | null;
  callbackError: string | null;
  submitError: string | null;
  debugJson: string | null;
};

export function LoginAuthBanners({
  infoMessage,
  callbackError,
  submitError,
  debugJson,
}: LoginAuthBannersProps) {
  const showDebug =
    process.env.NODE_ENV === "development" && Boolean(debugJson) && callbackError;

  if (!infoMessage && !callbackError && !submitError) {
    return null;
  }

  return (
    <div className="space-y-3">
      {infoMessage && (
        <div
          className="rounded-md border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900"
          role="status"
        >
          {infoMessage}
        </div>
      )}

      {callbackError && (
        <div
          className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {callbackError}
          {showDebug && debugJson && (
            <details className="mt-3">
              <summary className="cursor-pointer font-semibold">
                Debug info (development only)
              </summary>
              <pre className="mt-2 max-h-48 overflow-x-auto overflow-y-auto rounded bg-red-100 p-2 text-xs">
                {debugJson}
              </pre>
            </details>
          )}
        </div>
      )}

      {submitError && (
        <div
          className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {submitError}
        </div>
      )}
    </div>
  );
}

/**
 * Debug utility functions for tracking image upload issues
 */

// Enable debug mode - set this to true to see detailed logs
export const DEBUG_MODE = true;

// Log levels
export enum LogLevel {
  INFO = "INFO",
  WARNING = "WARNING",
  ERROR = "ERROR",
  DEBUG = "DEBUG",
}

// Request/response debugging data
interface RequestDebugData {
  url: string;
  method: string;
  headers?: Record<string, string>;
  body?: any;
}

interface ResponseDebugData {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body?: any;
}

// Main debug logger
export function debugLog(
  message: string,
  level: LogLevel = LogLevel.INFO,
  data?: any
): void {
  if (!DEBUG_MODE && level !== LogLevel.ERROR) return;

  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level}]`;

  switch (level) {
    case LogLevel.ERROR:
      console.error(`${prefix} ${message}`, data || "");
      break;
    case LogLevel.WARNING:
      console.warn(`${prefix} ${message}`, data || "");
      break;
    case LogLevel.DEBUG:
      console.debug(`${prefix} ${message}`, data || "");
      break;
    default:
      console.log(`${prefix} ${message}`, data || "");
  }
}

// Track request/response
export function logRequest(req: RequestDebugData): void {
  debugLog(`Request to ${req.url} [${req.method}]`, LogLevel.DEBUG, {
    headers: req.headers,
    body: req.body,
  });
}

export function logResponse(res: ResponseDebugData): void {
  const level = res.status >= 400 ? LogLevel.ERROR : LogLevel.DEBUG;
  debugLog(`Response ${res.status} ${res.statusText}`, level, {
    headers: res.headers,
    body: res.body,
  });
}

// Helper to examine JSON data
export function inspectJSON(data: string): {
  valid: boolean;
  parsed?: any;
  error?: string;
} {
  try {
    // Remove non-printable characters
    const cleaned = data.replace(/[^\x20-\x7E]/g, "");

    // Attempt to parse
    const parsed = JSON.parse(cleaned);
    return { valid: true, parsed };
  } catch (e) {
    return {
      valid: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

// Helper to create enhanced fetch for debugging
export async function debugFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const reqHeaders = options.headers || {};

  // Log the request
  logRequest({
    url,
    method: options.method || "GET",
    headers: reqHeaders as Record<string, string>,
    body: options.body,
  });

  try {
    // Execute the fetch
    const response = await fetch(url, options);

    // Clone the response so we can read the body
    const clonedResponse = response.clone();

    // Try to get the response body
    let responseBody;
    try {
      if (response.headers.get("content-type")?.includes("application/json")) {
        responseBody = await clonedResponse.json();
      } else {
        responseBody = await clonedResponse.text();
      }
    } catch (e) {
      responseBody = `[Error reading response body: ${e}]`;
    }

    // Log the response
    logResponse({
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries([...response.headers.entries()]),
      body: responseBody,
    });

    return response;
  } catch (error) {
    debugLog(`Fetch error for ${url}`, LogLevel.ERROR, error);
    throw error;
  }
}

// Helper to extract detailed error info from any error object
export function extractErrorDetails(error: any): Record<string, any> {
  const details: Record<string, any> = {
    message: error instanceof Error ? error.message : String(error),
    name: error instanceof Error ? error.name : "Unknown Error",
    stack: error instanceof Error ? error.stack : undefined,
  };

  // Add all enumerable properties
  if (error && typeof error === "object") {
    for (const key in error) {
      if (key !== "message" && key !== "name" && key !== "stack") {
        details[key] = error[key];
      }
    }
  }

  return details;
}

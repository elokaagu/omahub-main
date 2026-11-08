import { z } from "zod";

/** Same rule the API routes use (`z.string().trim().email()`), so the form never
 *  accepts an address the server will reject. */
const emailSchema = z.string().trim().email();

export function getEmailValidationError(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return "Email is required";
  if (!emailSchema.safeParse(trimmed).success) {
    return "Please enter a valid email address";
  }
  return null;
}

export function isValidEmailFormat(value: string): boolean {
  return emailSchema.safeParse(value).success;
}

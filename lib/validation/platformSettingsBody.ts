import { z } from "zod";

const contentField = z.string().trim().max(50_000);

export const platformSettingsUpdateSchema = z
  .object({
    about: contentField.optional(),
    ourStory: contentField.optional(),
    tailoredServices: contentField.optional(),
  })
  .strict()
  .refine(
    (data) =>
      data.about !== undefined ||
      data.ourStory !== undefined ||
      data.tailoredServices !== undefined,
    { message: "At least one setting field is required" }
  );

export function parsePlatformSettingsUpdate(raw: unknown) {
  return platformSettingsUpdateSchema.safeParse(raw);
}

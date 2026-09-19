import { z } from "zod";

const contentField = z.string().trim().max(50_000);
/** Vimeo numeric video ID, e.g. the "1206857643" in vimeo.com/1206857643. */
const videoIdField = z
  .string()
  .trim()
  .regex(/^\d+$/, "Enter just the numeric Vimeo video ID");
/** Public URL for the top homepage still or looping film. Empty restores the default. */
const heroMediaUrlField = z.string().trim().max(2000);

export const platformSettingsUpdateSchema = z
  .object({
    about: contentField.optional(),
    ourStory: contentField.optional(),
    tailoredServices: contentField.optional(),
    heroVideoId: videoIdField.optional(),
    welcomeVideoId: videoIdField.optional(),
    heroMediaUrl: heroMediaUrlField.optional(),
    customerSignupEnabled: z.enum(["true", "false"]).optional(),
    cataloguesPubliclyVisible: z.enum(["true", "false"]).optional(),
  })
  .strict()
  .refine(
    (data) =>
      data.about !== undefined ||
      data.ourStory !== undefined ||
      data.tailoredServices !== undefined ||
      data.heroVideoId !== undefined ||
      data.welcomeVideoId !== undefined ||
      data.heroMediaUrl !== undefined ||
      data.customerSignupEnabled !== undefined ||
      data.cataloguesPubliclyVisible !== undefined,
    { message: "At least one setting field is required" }
  );

export function parsePlatformSettingsUpdate(raw: unknown) {
  return platformSettingsUpdateSchema.safeParse(raw);
}

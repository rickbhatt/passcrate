import { z } from "zod";
import { PasswordFormValue } from "types";

export const passwordFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required"),
  password: z
    .string()
    .refine((value) => value.trim().length > 0, "Password is required"),
  folderId: z.string().min(1, "Please select a folder"),
  tags: z
    .array(z.object({ id: z.string().nullable(), name: z.string() }))
    .min(1, "Add at least one tag"),
  username: z.string().optional(),
  url: z.string().optional(),
  notes: z.string().optional(),
  folderName: z.string().optional(),
  expiryDays: z
    .string()
    .optional()
    .refine((value) => {
      if (!value) return true;
      const trimmed = value.trim();
      return (
        /^\d+$/.test(trimmed) &&
        Number(trimmed) > 0 &&
        Number(trimmed) <= 999
      );
    }, "Enter a valid number of days (1-999)"),
});

export type PasswordFormSchema = z.infer<typeof passwordFormSchema>;

export type PasswordFormErrors = Partial<Record<keyof PasswordFormSchema, string>>;

export const validatePasswordForm = (
  values: PasswordFormValue,
): { success: true } | { success: false; errors: PasswordFormErrors } => {
  const result = passwordFormSchema.safeParse(values);

  if (result.success) {
    return { success: true };
  }

  const errors: PasswordFormErrors = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0] as keyof PasswordFormErrors;
    if (field && !errors[field]) {
      errors[field] = issue.message;
    }
  }

  return { success: false, errors };
};
